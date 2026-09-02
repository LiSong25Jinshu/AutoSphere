from flask import Flask, request, jsonify
from pathlib import Path
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
    data_folder = Path(__file__).resolve().parent / 'data'
    kaggle_vehicles = load_Kaggle_vehicles(str(data_folder))

    print('Loading database vehicle data...')
    try:
        db_vehicles = fetch_vehicle_data()
    except Exception as error:
        print(f'⚠️ Database vehicle data unavailable: {error}')
        db_vehicles = pd.DataFrame()

    # Merge both sources - database vehicles take prioty
    all_vehicles = pd.concat([kaggle_vehicles, db_vehicles], ignore_index=True)
    all_vehicles = all_vehicles.drop_duplicates(subset=['make', 'model', 'year', 'price'])
    print(f'✅ Total vehicles for training: {len(all_vehicles)}')

    print('Loading user interactions from database...')
    try:
        interactions = fetch_user_interactions()
    except Exception as error:
        print(f'⚠️ Interaction data unavailable: {error}')
        interactions = pd.DataFrame()

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
    Called by Node.js backend like: GET /recommendations/123
    """
    try:
        # Guard: model not yet trained or training failed
        if engine.vehicle_df is None or engine.vehicle_df.empty:
            return jsonify({
                'user_id': user_id,
                'recommendations': [],
                'metadata': {
                    'result_count': 0,
                    'model_source': 'unavailable',
                    'applied_filters': {},
                    'fallback_used': True,
                },
                'message': 'Model not ready — no vehicle data loaded yet.',
            }), 200

        # Get preferences from query params first
        n = min(max(int(request.args.get('n', 10)), 1), 50)
        query_preferences = {}
        if request.args.get('budget_min') is not None:
            query_preferences['budget_min'] = float(request.args.get('budget_min'))
        if request.args.get('budget_max') is not None:
            query_preferences['budget_max'] = float(request.args.get('budget_max'))
        if request.args.get('fuel_type'):
            query_preferences['preferred_fuel'] = request.args.get('fuel_type')
        if request.args.get('body_type'):
            query_preferences['preferred_body_type'] = request.args.get('body_type')
        if request.args.get('transmission'):
            query_preferences['preferred_transmission'] = request.args.get('transmission')
        if request.args.get('condition'):
            query_preferences['preferred_condition'] = request.args.get('condition')
        if request.args.get('make'):
            query_preferences['preferred_make'] = request.args.get('make')
        if request.args.get('model'):
            query_preferences['preferred_model'] = request.args.get('model')
        for parameter in ('min_year', 'max_year', 'min_mileage', 'max_mileage'):
            if request.args.get(parameter) is not None:
                query_preferences[parameter] = float(request.args.get(parameter))
        if request.args.get('usage'):
            query_preferences['usage'] = request.args.get('usage')
        if request.args.get('lifestyle'):
            query_preferences['lifestyle'] = request.args.get('lifestyle')
        if request.args.get('features'):
            query_preferences['desired_features'] = request.args.get('features').split(',')

        # Safely fetch preferences from db - return empty dict if table doesn't exist
        try:
            db_preferences = fetch_user_preferences(user_id)
        except Exception as error:
            print(f'⚠️ User preferences unavailable: {error}')
            db_preferences = {}

        db_preferences = {
            'budget_min': db_preferences.get('budget_min'),
            'budget_max': db_preferences.get('budget_max'),
            'preferred_fuel': db_preferences.get('preferred_fuel', db_preferences.get('prefered_fuel')),
            'preferred_transmission': db_preferences.get('preferred_transmission'),
            'preferred_body_type': db_preferences.get('preferred_body_type', db_preferences.get('preffered_body_type')),
        }
        preferences = {key: value for key, value in {**db_preferences, **query_preferences}.items() if value is not None}
            
        recs = engine.get_recommendations(user_id, preferences, n)
        if not recs:
            fallback = engine.fallback_recommendations(preferences, n)
            if fallback:
                recs = [{
                    'vehicle_id': item['vehicle_id'],
                    'score': item.get('score', 0.0),
                    'match_status': 'best_available'
                } for item in fallback[:n]]

        # Enrich each recommendations with full vehicle details
        enriched = []
        for rec in recs:
            vid = rec['vehicle_id']
            relaxed = rec.get('match_status') == 'closest_match'

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
                    'condition': v['condition'] if 'condition' in v and pd.notna(v['condition']) else None,
                    'seat': int(v['seat']) if 'seat' in v and pd.notna(v['seat']) else None,
                    'color': v['color'] if 'color' in v and pd.notna(v['color']) else None,
                    'features': v['features'] if pd.notna(v['features']) else '',
                    'image_url': v['image_url'] if 'image_url' in v and pd.notna(v['image_url']) else None,
                    'images': v['images'] if 'images' in v and isinstance(v['images'], list) else ([v['image_url']] if 'image_url' in v and pd.notna(v['image_url']) else []),
                    'match_status': rec.get('match_status', 'exact'),
                    'relaxed': relaxed,
                    'reasons': engine.explain(user_id, vid)
                })
            else:
                enriched.append(rec)

        return jsonify({
            'user_id': user_id,
            'recommendations': enriched,
            'metadata': {
                'result_count': len(enriched),
                'model_source': 'hybrid' if engine.collab_model is not None else 'content',
                'applied_filters': query_preferences,
                'fallback_used': len(enriched) > 0 and all(item.get('match_status') == 'best_available' for item in enriched) if enriched else False,
            },
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/retrain', methods=['POST'])
def retrain():
    """Manually trigger retraining (call this after major data updates)"""
    threading.Thread(target=train_model).start()
    return jsonify({'message': 'Retraining started in background'})


if __name__ =='__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)