import pandas as pd
import glob 
import os
import ast

# COLUMN MAPPING: left side(Kaggle CSV columns -- right side(model expectations)

DATASET_MAPS = {
    "autosphere_vehicles_dataset_images.csv": {
    'make': 'make',
    'model': 'model',
    'year': 'year',
    'price': 'price',
    'mileage': 'mileage',
    'fuel_type': 'fuel_type',
    'transmission': 'transmission',
    'body_type': 'body_type',
    'condition': 'condition',
    'seat': 'seat',
    'color': 'color',
    'features': 'features',
    'description': 'description',
    'image_url': 'image_url'
    }
}

def _extract_first_image_url(raw):
    if pd.isna(raw):
        return None
    try:
        urls = ast.literal_eval(raw)  # turns "['url1', 'url2']" into a real list
        return urls[0] if urls else None
    except (ValueError, SyntaxError):
        return None

def load_Kaggle_vehicles(data_folder='data/'):
    """
    Load, clean, and combine all CSV files in the data/ folder.
    Returns a DataFrame in the standard format the model expects.
    """
    csv_files = glob.glob(os.path.join(data_folder, '*.csv'))

    if not csv_files:
        print('⚠️  No CSV files found in data/ folder')
        return pd.DataFrame()

    all_dfs = []
    for filepath in csv_files:
        filename = os.path.basename(filepath)
        column_map = DATASET_MAPS.get(filename, {})
        
        if not column_map:
            print(f"⚠️  No column map found for {filename} — skipping")
            continue
        
        try:
            df = pd.read_csv(filepath, low_memory=False)
            df = df.rename(columns=column_map)  # Apply this file's specific map
            if 'image_url_raw' in df.columns:
                df['image_url'] = df['image_url_raw'].apply(_extract_first_image_url)
            all_dfs.append(df)
        except Exception as e:
            print(f'  Skipped {filepath}: {e}')

    if not all_dfs:
        return pd.DataFrame()

    # Combine all CSVs into one DataFrame
    combined = pd.concat(all_dfs, ignore_index=True)

    # Keep only the columns we need
    needed = ['make', 'model', 'year', 'price', 'mileage', 'fuel_type', 
              'transmission', 'body_type', 'description',
               'condition', 'seat', 'color', 'features', 'image_url']
    available = [c for c in needed if c in combined.columns]
    combined = combined[available].copy()

    # Add missing columns with empty values if not present
    for col in needed:
        if col not in combined.columns:
            combined[col] = None

    # Clean up the data
    combined = _clean_vehicle_data(combined)

    # Add a unique vehicle_id for each row
    combined['vehicle_id'] = ['kaggle_' + str(i) for i in range(len(combined))]

    print(f'✅ Loaded {len(combined)} vehicles from {len(csv_files)} CSV file(s)')
    return combined


def _clean_vehicle_data(df):
    """
    Clean and standardise the raw CSV data.
    Like proofreading the catalogue before handing it to the salesperson.
    """
    # Remove rows with no price (useless for recommendations)
    df = df.dropna(subset=['price'])

    # Convert price to numeric — remove currency symbols if present
    df['price'] = pd.to_numeric(
        df['price'].astype(str).str.replace(r'[^\d.]', '', regex=True),
        errors='coerce'
    )

    # Convert year and mileage to numeric
    df['year']    = pd.to_numeric(df['year'],    errors='coerce')
    df['mileage'] = pd.to_numeric(df['mileage'], errors='coerce')

    # Remove rows where price is 0 or unrealistically low
    df = df[df['price'] > 100]

    # Standardise text columns to title case
    for col in ['make', 'model', 'fuel_type', 'transmission', 'body_type']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().str.title()
            df[col] = df[col].replace('Nan', None)

    # Fill missing descriptions
    df['description'] = df['description'].fillna('')

    # Remove duplicates
    df = df.drop_duplicates(subset=['make', 'model', 'year', 'price'])

    # Reset index after all the filtering
    df = df.reset_index(drop=True)

    return df
