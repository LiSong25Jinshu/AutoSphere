from flask import Flask, request, jsonify
from recommender import VehicleRecommendationEngine
from database import fetch_user_interactions, fetch_vehicle_data, fetch_user_preferences
from csv_loader import load_kaggle_vehicles
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
    all_vehicles = pd.concat([kaggle_vehicle, db_vehicle], ignore_index=True)
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

