from sqlalchemy import create_engine, text
import pandas as pd
import os

# Allow DATABASE_URL to be overridden by an environment variable for flexibility
DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://autosphere_user:autospheredb@localhost:5432/autosphere'
)

_engine = None

def get_engine():
    """Return a shared SQLAlchemy engine (created lazily)."""
    global _engine
    if _engine is None:
        _engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    return _engine

def get_connection():
    """Create a connection to the PostgreSQL database"""
    return get_engine().connect()

def fetch_user_interactions():
    """
    Get all user interactions with vehicles.
    Interactions include: views, bookings, saved vehicles.
    Returns a DataFrame with columns: userId, vehicleId, score.
    """
    query = text('''
        SELECT
            user_id,
            vehicle_id,
            CASE
                WHEN interaction_type = 'booking' THEN 3
                WHEN interaction_type = 'save' THEN 2
                ELSE 1
            END AS score
        FROM user_vehicle_interactions
        ORDER BY "createdAt" DESC
        LIMIT 50000
    ''')
    with get_connection() as conn:
        df = pd.read_sql(query, conn)
    return df

def fetch_vehicle_data():
    """
    Get all vehicle details for content-based filtering.
    Returns a DataFrame with vehicle features.
    """
    query = text('''
        SELECT
            id AS vehicle_id,
            make, model, year, price, fuel_type,
            transmission, body_type, mileage, color, description,
            condition, features, images
        FROM vehicles
        WHERE status = \'available\'
    ''')
    with get_connection() as conn:
        df = pd.read_sql(query, conn)

    # Normalise the images column — DB stores JSON arrays; ensure we have a list
    if 'images' in df.columns:
        def _parse_images(val):
            if val is None:
                return []
            if isinstance(val, list):
                return val
            try:
                import json
                parsed = json.loads(val)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return []
        df['images'] = df['images'].apply(_parse_images)

    # Normalise features column — DB stores JSON arrays; join to semicolon string for recommender
    if 'features' in df.columns:
        def _parse_features(val):
            if val is None:
                return ''
            if isinstance(val, list):
                return ';'.join(str(f) for f in val)
            if isinstance(val, str):
                try:
                    import json
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return ';'.join(str(f) for f in parsed)
                except Exception:
                    pass
            return str(val)
        df['features'] = df['features'].apply(_parse_features)

    return df

def fetch_user_preferences(user_id):
    """Get a specific user's stated preferences"""
    query = text('''
        SELECT budget_min, budget_max, prefered_fuel,
                preferred_transmission, preffered_body_type
        FROM user_preferences
        WHERE user_id = :user_id
    ''')
    with get_connection() as conn:
        df = pd.read_sql(query, conn, params={'user_id': user_id})
    return df.iloc[0].to_dict() if not df.empty else {}
    