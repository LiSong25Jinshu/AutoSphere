import psycopg2
import pandas as pd

DB_CONFIG = {
    'host': 'localhost',
    'database': 'autosphere',
    'user': 'autosphere_user',
    'password': 'autospheredb',
    'port' : 5432
}

def get_connection():
    """Create a connection to the PostgreSQL database"""
    return psycopg2.connect(**DB_CONFIG)

def fetch_user_interactions(): # Database doesn't exist yet but will(important)
    """
    Get all user interactions with vehicles.
    Interactions include: views, bookings, saved vehicles.
    Returns a DataFrame with columns: user_id, vehicle_id, score.
    """
    # query = '''
    #     SELECT
    #         user_id,
    #         vehicle_id,
    #         --Score: booking=3, save=2, view=1
    #         CASE
    #             WHEN interaction_type = 'booking' THEN 3
    #             WHEN interaction_type = 'save' THEN 2
    #             ELSE 1
    #         END AS score
    #     FROM user_vehicle_interactions
    #     ORDER BY created_at DESC
    #     LIMIT 50000
    # '''
    # conn = get_connection()
    # df = pd.read_sql(query, conn)
    # conn.close()
    return 0 # df

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
    