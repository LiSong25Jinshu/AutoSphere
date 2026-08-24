"""
Fills the image_url column using Wikimedia Commons — free, CC-licensed,
direct-linkable images with permission to reuse (with attribution).

Run this on your own machine (Wikimedia isn't reachable from this sandbox):

    pip install requests pandas
    python fetch_commons_images.py

What it does per row:
  1. Searches Commons for "<year> <make> <model> <body_type>"
  2. Falls back to "<make> <model>" if nothing matches
  3. Takes the top image result, pulls its direct file URL + license
  4. Writes the URL into image_url, and logs the license/author into
     image_source_license.csv (keep this — the pipeline's README asks
     you to keep license/source info in your project records)

Be a good citizen: this makes ~1 request per row with a short delay.
Not every row will find a confident match — check failed_matches.csv
and fill those in by hand from commons.wikimedia.org.
"""
import time
import requests
import pandas as pd

INPUT_CSV = "autosphere_vehicles_dataset.csv"       # output of fix_ghana_dataset.py
OUTPUT_CSV = "autosphere_vehicles_dataset_images.csv"
LICENSE_LOG = "image_source_license.csv"
FAILED_LOG = "failed_matches.csv"

API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {"User-Agent": "AutoSphere-Student-Project/1.0 (educational use)"}
DELAY_SECONDS = 2.0          # slower = fewer 429s
MAX_RETRIES = 5
SAVE_EVERY = 5                # checkpoint so a crash doesn't lose progress


def search_commons(query):
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": 6,       # File namespace
        "gsrlimit": 1,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "iiurlwidth": 800,
    }

    for attempt in range(1, MAX_RETRIES + 1):
        resp = requests.get(API, params=params, headers=HEADERS, timeout=15)

        if resp.status_code == 429:
            wait = int(resp.headers.get("Retry-After", 5 * attempt))
            print(f"  rate limited, waiting {wait}s (attempt {attempt}/{MAX_RETRIES})...")
            time.sleep(wait)
            continue

        resp.raise_for_status()
        break
    else:
        # Exhausted retries — treat as no match rather than crashing the run
        return None

    data = resp.json()
    pages = data.get("query", {}).get("pages", {})
    if not pages:
        return None

    page = next(iter(pages.values()))
    info = page.get("imageinfo", [{}])[0]
    meta = info.get("extmetadata", {})

    return {
        "url": info.get("thumburl") or info.get("url"),
        "license": meta.get("LicenseShortName", {}).get("value", "unknown"),
        "artist": meta.get("Artist", {}).get("value", "unknown"),
        "source_page": info.get("descriptionurl", ""),
    }


def main():
    import os

    # Resume from a previous partial run if present, instead of starting over
    resume_path = OUTPUT_CSV if os.path.exists(OUTPUT_CSV) else INPUT_CSV
    df = pd.read_csv(resume_path)

    # Fix: image_url starts as all-NaN (float64) — cast to plain text
    # dtype so writing URL strings into it doesn't warn/break.
    df["image_url"] = df["image_url"].astype("object")
    df["image_url"] = df["image_url"].where(df["image_url"].notna(), "")

    license_rows = []
    failed_rows = []

    for idx, row in df.iterrows():
        existing = str(row["image_url"])
        if existing.startswith("http"):
            continue  # already found in a previous run — skip it

        query = f"{row['year']} {row['make']} {row['model']} {row['body_type']}"
        result = search_commons(query)

        if not result:
            query2 = f"{row['make']} {row['model']}"
            result = search_commons(query2)

        if result and result["url"]:
            df.at[idx, "image_url"] = result["url"]
            license_rows.append({
                "make": row["make"], "model": row["model"], "year": row["year"],
                "image_url": result["url"], "license": result["license"],
                "artist": result["artist"], "source_page": result["source_page"],
            })
            print(f"[{idx+1}/{len(df)}] {row['make']} {row['model']} -> found")
        else:
            failed_rows.append({"make": row["make"], "model": row["model"], "year": row["year"]})
            print(f"[{idx+1}/{len(df)}] {row['make']} {row['model']} -> NOT FOUND")

        time.sleep(DELAY_SECONDS)

        if (idx + 1) % SAVE_EVERY == 0:
            df.to_csv(OUTPUT_CSV, index=False)  # checkpoint

    df.to_csv(OUTPUT_CSV, index=False)

    # Append rather than overwrite license/failed logs across resumed runs
    for path, rows in [(LICENSE_LOG, license_rows), (FAILED_LOG, failed_rows)]:
        new_df = pd.DataFrame(rows)
        if os.path.exists(path) and not new_df.empty:
            new_df = pd.concat([pd.read_csv(path), new_df], ignore_index=True)
        if not new_df.empty:
            new_df.to_csv(path, index=False)

    print(f"\nDone this run. {len(license_rows)} matched, {len(failed_rows)} need manual lookup.")
    print(f"Updated dataset: {OUTPUT_CSV}")
    print(f"License records: {LICENSE_LOG}  (keep this for your project report)")
    print(f"Unmatched rows: {FAILED_LOG}")


if __name__ == "__main__":
    main()
