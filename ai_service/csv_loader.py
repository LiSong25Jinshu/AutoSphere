import pandas as pd
import glob 
import os

# COLUMN MAPPING: left side(Kaggle CSV columns -- right side(model expectations)

DATASET_MAPS = {
    'Car_features_and_msrp.csv': {
        'Make':         'make',
        'Model':        'model',
        'Year':         'year',
        'MSRP':        'price',
        'highway MPG':      'mileage',
        'Engine Fuel Type':    'fuel_type',
        'Transmission Type': 'transmission',
        'Vehicle Style':   'body_type',
        'Vehicle Size':  'description' #***
    },
    'Car_price_prediction.csv': {
        'name':           'make',
        'Car_Model':       'model', #***
        'year':            'year',
        'selling_price':   'price',
        'km_driven':       'mileage',
        'fuel':            'fuel_type',
        'transmission':    'transmission',
        'seats':           'body_type', #***
        'Description':     'description' #***
    },
    'OLX_cars_dataset00.csv': {
        'Make':           'make',
        'Model':          'model',
        'Year':           'year',
        'Price':          'price',
        'KM's driven':    'mileage',
        'Fuel':           'fuel_type',
        'Transmission':   'transmission',
        'Body_type':      'body_type', #***
        'Description':    'description'
    }
}

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
            all_dfs.append(df)
        except Exception as e:
            print(f'  Skipped {filepath}: {e}')

    if not all_dfs:
        return pd.DataFrame()

    # Combine all CSVs into one DataFrame
    combined = pd.concat(all_dfs, ignore_index=True)

    # Keep only the columns we need
    needed = ['make', 'model', 'year', 'price', 'mileage',
              'fuel_type', 'transmission', 'body_type', 'description']
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
