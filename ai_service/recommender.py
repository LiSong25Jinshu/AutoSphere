import numpy as np
import pandas as pd
from sklearn.decomposition import NMF
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler

class VehicleRecommendationEngine:
    def __init__(self):
        # To Hold trained models
        self.user_item_matrix = None  # Grid of users vs vehicles
        self.vehicle_features = None  # Numeric features of each vehicle
        self.collab_model = None      # Collaborative filtering model
        self.vehicle_ids = []         # List to map index to vehicle ID
        self.user_ids = []            # List to map index to user ID
        self.vehicle_similarity = None# Similarity scores between vehicles
        self.vehicle_df = None        # Raw vehicle data

    # Build User-Vehicle Matrix
    def build_user_item_matrix(self, interactions_df):
        """
        Convert.raw interactions into a matrix.
        Rows = user, Columns = vehicles, Values = interaction score.
        Like a spreadsheet where each cell shows how much a user
        interacted with a vehicle (0 = never, 3 = booked).
        """
        # Get unique users and vehicles
        self.user_ids = interactions_df['user_id'].unique().tolist()
        self.vehicle_ids = interactions_df['vehicle_id'].unique().tolist()

        # Creating index maps
        user_index = {uid: i for i, uid in enumerate(self.user_ids)}
        vehicle_index = {vid: i for i, vid in enumerate(self.vehicle_ids)}

        # Build the matrix filled with zeros
        matrix = np.zeros((len(self.user_ids), len(self.vehicle_ids)))

        # Fill up the scores
        for _, row in interactions_df.iterrows():
            u = user_index.get(row['user_id'])
            v = vehicle_index.get(row['vehicle_id'])
            if u is not None and v is not None:
                matrix[u][v] = max(matix[u][v], row['score'])  # Keep highest score
        return matrix

    # Train Collaborative filter
    def train_collabrative_filter(self):
        """
        NMF (Non-negative Matrix Facorization) finds hidden patterns.
        Like discovering that users who like SUVs also tend to like 
        specific price ranges - without being told explicitly.
        """
        self.collab_model = NMF(
            n_components=20,  # Number of hidden patterns to find
            random_state=42,
            max_iter=300
        )
        self.collab_model.fit(self.user_item_matrix)
        print('✅Collaborative filter trained')

    # Build Vehicle Feature Vectors
    def build_vehicle_features(self, vehicle_df):
        """
        Convert vehicle attribute into numbers the model can compare.
        Think of it as translating car specs into a language that math
        can understand.
        """
        self.vehicle_df = vehicle_df.copy()
        features = pd.DataFrame()
        features['vehicle_id'] = vehicle_df['vehicle_id']

        # Numeric features - normalize price and mileage
        scaler = StandardScaler()
        features[['price_norm', 'mileage_norm', 'year_norm']] = scaler.fit_transform(
            vehicle_df[['price', 'mileage', 'year']].fillna(0)
        )

        # Caterogical features - one-hot encode
        fuel_dummies = pd.get_dummies(vehicle_df['fuel_type'], prefix='fuel')
        trans_dummies = pd.get_dummies(vehicle_df['transmission'], prefix='trans')
        body_dummies = pd.get_dummies(vehicle_df['body_type'], prefix='body')
        make_dummies = pd.get_dummies(vehicle_df['make'], prefix='make')

        # Text Features - TF-IDF on description
        tfidf = TfidfVectorizer(max_features=50, stop_words='english')
        desc_matrix = tfidf.fit_transform(
            vehicle_df['description'].fillna('')
        ).toarray()
        desc_df = pd.DataFrame(desc_matrix, columns=[f'desc_{i}' for i in range(desc_matrix.shape[1])])

        # Combine all features into one big feature matrix
        feature_matrix = pd.concat([
            features[['price_norm', 'mileage_norm', 'year_norm']],
            fuel_dummies, trans_dummies, body_dummies, make_dummies, desc_df],
        axis=1)

        self.vehicle_features = feature_matrix.values

        # Build similarity matrix - how similar is each car to every other car?
        self.vehicle_similarity = cosine_similarity(self.vehicle_features)
        print('✅ Content-based features built')

    # Master Train Function
    def train(self, interactions_df, vehicle_df):
        """
        Call this to train the Full model.
        Run this once when the service starts, then retrain periodically.
        """
        print('Training recommendation model...')
        
        # Handle empty or invalid interactions
        if interactions_df is None or not isinstance(interactions_df, pd.DataFrame) or interactions_df.empty:
            print('⚠️ No interaction data yet - skipping collaborativr filter')
            self.user_item_matrix = None
            self.collab_model = None
        else:
            self.user_item_matrix = self.build_user_item_matrix(interactions_df)
            self.train_collabrative_filter()
        
        self.build_vehicle_features(vehicle_df)
        print('✅ Model fully tained and ready!')

    # Generate Recommendations
    def collaborative_recommendations(self, user_id, n=20):
        """Get recommendations using what similar users liked"""
        if user_id not in self.user_id:
            return []   # New user - no history yet

        user_idx = self.user_ids.index(user_id)

        # Get this user's hidden preference factors
        user_factors = self.collab_model.transform(
            self.user_item_matrix[user_idx:user_idx+1]
        )

        # Predict scores for all vehicles
        predicted = np.dot(user_factors, self.collab_model.components_)[0]
    
        # Don't recommend vehicles the user already interacted with
        already_seen = self.user_item_matrix[user_idx] > 0
        predicted[already_seen] = -np.inf

        # Predict top N vehicle IDs with their scores
        top_indices = np.argsort(predicted)[::-1][:n]
        return [
            {'vehicle_id': self.vehicle_ids[i], 'score': float(predicted[i])}
            for i in top_indices if predicted[i] > -np.inf
        ]

    def content_recommendations(self, user_preferences, n=20):
        """Get recommendations based on user's stated preferences"""
        if self.vehicle_df is None:
            return []

        # Filter by budget if provided
        candidates = self.vehicle_df.copy()
        if 'budget_max' in user_preferences:
            candidates = candidates[candidates['price'] <= user_preferences['budget_max']]
        if 'budget_min' in user_preferences:
            candidates = candidates[candidates['price'] >= user_preferences['budget_min']]
        if 'preferred_fuel' in user_preferences and user_preferences['preferred_fuel']:
            candidates = candidates[candidates['fuel_type'] == user_preferences['preferred_fuel']]

        if candidates.empty:
            candidates = self.vehicle_df.copy()   # Fall back to all vehicles

        # Return top N from filtered candidates
        top_candidates = candidates.head(n)
        return [
            {'vehicle_id': row['vehicle_id'], 'score': 0.5}
            for _, row in top_candidates.iterrows()
        ]

    def get_recommendations(self, user_id, user_preferences={}, n=10):
        """
        Main method - combines both approaches.
        60% weight on collaborative, 40% on content-based.
        Like asking both friend a friend and a salesperson, then averaging their advice.
        """
        # Combine scores
        combined = {}

        # Run collab filter if model is trained
        if self.collab_model is not None and user_id in self.user_ids:
            collab = self.collaborative_recommendations(user_id, n *2)
            for items in collab:
                combined[item['vehicle_id']] = 0.6 * item['score']

        # Always run content-based filter
        content = self.content_recommendations(user_preferences, n *2)
        for item in content:
            vid = item['vehicle_id']
            combined[vid] = combined.get(vid, 0) + 0.4 * item['score']

        # Sort by combined score
        sorted_recs = sorted(combined.items(), key=lambda x: x[1], reverse=True)
        top_recs = sorted_recs[:n]

        return [{'vehicle_id': vid, 'score': round(score, 4)} for vid, score in top_recs]

    def explain(self, user_id, vehicle_id):
        """Return a human-readable for the recommendations"""
        reasons = []
        if user_id in self.user_ids:
            reasons.append('Users with similar preferences also liked this vehicle')
        if self.vehicle_df is not None:
            v = self.vehicle_df[self.vehicle_df['vehicle_id'] == vehicle_id]
            if not v.empty:
                reasons.append(f"Matches your interest in {v.iloc[0]['make']}{v.iloc[0]['body_type']} vehicles")
        return reasons if reasons else ['Highly rated vehicle on AutoSphere']