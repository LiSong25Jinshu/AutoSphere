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


@app.route('/recommendations<user_id>', methods=['GET'])
def get_recommendations(user_id):
    """
    Get recommendations for a user.
    Called by Node.js backend like: Get /recommendions/123
    """
    try:
        n = int(request.args.get('n', 10))   # How many recommendations?
        preferences = fetch_user_preferences(user_id)
        recs = engine.get_recommendations(user_id, preferences, n)

        # Add explanations to each recommendations
        for rec in recs:
            recs['reasons'] = engine.explain(user_id, rec['vehicle_id'])

        return jsonify({'user_id':user_id, 'recommendations':recs})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/retrain', methods=['POST'])
def retrain():
    """Manually trigger retraining (call this after major data updates)"""
    threading.Thread(target=train_model).start()
    return jsonify({'message': 'Retraining started in background'})


if __name__ =='__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)