from sqlalchemy import create_engine
import pandas as pd

DATABASE_URL = "postgresql://autosphere_user:autospheredb@localhost:5432/autosphere"

def get_connection():
    """Create a connection to the PostgreSQL database"""
    engine = create_engine(DATABASE_URL)
    return engine.connect()

def fetch_user_interactions(): # Database doesn't exist yet but will(important)
    """
    Get all user interactions with vehicles.
    Interactions include: views, bookings, saved vehicles.
    Returns a DataFrame with columns: userId, vehicleId, score.
    """
    query = '''
        SELECT
            user_id,
            vehicle_id,
            --Score: booking=3, save=2, view=1
            CASE
                WHEN interaction_type = 'booking' THEN 3
                WHEN interaction_type = 'save' THEN 2
                ELSE 1
            END AS score
        FROM user_vehicle_interactions
        ORDER BY "createdAt" DESC
        LIMIT 50000
    '''
    conn = get_connection()
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def fetch_vehicle_data():  #Body type doesn't exist in the database
    """
    Get all vehicle details for content-based filtering.
    Returns a DataFrame with vehicle features.
    """
    query = '''
        SELECT
            id AS vehicle_id,
            make, model, year, price, fuel_type,
            transmission, body_type, mileage, color, description
        FROM vehicles
        WHERE status = 'available'
    '''
    conn = get_connection()
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def fetch_user_preferences(user_id):   # Database doesn't exist yet
    """Get a specific user's stated preferences"""
    query = '''
        SELECT budget_min, budget_max, prefered_fuel,
                preferred_transmission, preffered_body_type
        FROM user_preferences
        WHERE user_id = %s
    '''
    conn = get_connection()
    df = pd.read_sql(query, conn, params=(user_id,))
    conn.close()
    return df.iloc[0].to_dict() if not df.empty else{}
    