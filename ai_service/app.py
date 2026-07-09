from flask import Flask, request, jsonify
from recommender import VehicleRecommendationEngine
from database import fetch_user_interactions, fetch_vehicle_data, fetch_user_preferences
from csv_loader import load_Kaggle_vehicles
import pandas as pd
import threading, time

app = Flask(__name__)
engine = VehicleRecommendationEngine()

def train_model():
    """
    Load data from both sources and train the model.
    -Kaggle CSVs -- Vehicle Knowledge(features, prices, specs)
    -PostgreSQL -- user behaviour(views, bookings, saves)
    """
    print('Loading Kaggle CSV vehicle data...')
    kaggle_vehicles = load_Kaggle_vehicles('data/')

    print('Loading database vehicle data...')
    db_vehicles = fetch_vehicle_data()

    # Merge both sources - database vehicles take prioty
    all_vehicles = pd.concat([kaggle_vehicles, db_vehicles], ignore_index=True)
    all_vehicles = all_vehicles.drop_duplicates(subset=['make', 'model', 'year', 'price'])
    print(f'✅ Total vehicles for training: {len(all_vehicles)}')

    print('Loading user interactions from database...')
    interactions = fetch_user_interactions()

    engine.train(interactions, all_vehicles)

# --Train immediately on startup --
train_model()

# --Retrain every 24 hours automatically --
def schedule_retraining():
    while True:
        time.sleep(86400)  # 24hours
        print('🔄️ Retraining model with fresh data...')
        train_model()

thread = threading.Thread(target=schedule_retraining, daemon=True)
thread.start()

# API Endpoints

@app.route('/health', methods=['GET'])
def health():
    """Check if service is running"""
    return jsonify({'status': 'ok', 'message':'AI service is running'})


@app.route('/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    """
    Get recommendations for a user.
    Called by Node.js backend like: Get /recommendions/123
    """
    try:
        n = int(request.args.get('n', 10))   # Number of recommendations

        # Get preferences from query params first
        query_preferences = {}
        if request.args.get('budget_min'):
            query_preferences['budget_min'] = float(request.args.get('budget_min'))
        if request.args.get('budget_max'):
            query_preferences['budget_max'] = float(request.args.get('budget_max'))
        if request.args.get('fuel_type'):
            query_preferences['preferred_fuel'] = request.args.get('fuel_type')
        if request.args.get('body_type'):
            query_preferences['preferred_body_type'] = request.args.get('body_type')
        if request.args.get('transmission'):
            query_preferences['preferred_transmission'] = request.args.get('transmission')

        # Safely fetch preferences from db - return empty dict if table doesn't exist
        try:
            db_preferences = fetch_user_preferences(user_id)
        except:
            db_preferences = {}

        preferences = {**db_preferences, **query_preferences}
            
        recs = engine.get_recommendations(user_id, preferences, n)

        # Enrich each recommendations with full vehicle details
        enriched = []
        for rec in recs:
            vid = rec['vehicle_id']

            vehicle_row = engine.vehicle_df[
                engine.vehicle_df['vehicle_id'] == vid
            ]

            if not vehicle_row.empty:
                v = vehicle_row.iloc[0]
                enriched.append({
                    'vehicle_id': vid,
                    'score': rec['score'],
                    'make': v['make'] if pd.notna(v['make']) else 'Unknown',
                    'model': v['model'] if pd.notna(v['model']) else 'Unknown',
                    'year': int(v['year']) if pd.notna(v['year']) else None,
                    'price': float(v['price']) if pd.notna(v['price']) else None,
                    'fuel_type': v['fuel_type'] if pd.notna(v['fuel_type']) else None,
                    'transmission': v['transmission'] if pd.notna(v['transmission']) else None,
                    'body_type': v['body_type'] if pd.notna(v['body_type']) else None,
                    'mileage': float(v['mileage']) if pd.notna(v['mileage']) else None,
                    'reasons': engine.explain(user_id, vid)
                })
            else:
                enriched.append(rec)

        return jsonify({'user_id':user_id, 'recommendations':enriched})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/retrain', methods=['POST'])
def retrain():
    """Manually trigger retraining (call this after major data updates)"""
    threading.Thread(target=train_model).start()
    return jsonify({'message': 'Retraining started in background'})


if __name__ =='__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)