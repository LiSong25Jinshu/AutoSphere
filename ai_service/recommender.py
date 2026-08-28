import numpy as np
import pandas as pd
from sklearn.decomposition import NMF
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler, MultiLabelBinarizer

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
                matrix[u][v] = max(matrix[u][v], row['score'])  # Keep highest score
        return matrix

    # Train Collaborative filter
    def train_collabrative_filter(self):
        """
        NMF (Non-negative Matrix Facorization) finds hidden patterns.
        Like discovering that users who like SUVs also tend to like 
        specific price ranges - without being told explicitly.
        """
        component_count = min(20, self.user_item_matrix.shape[0], self.user_item_matrix.shape[1])
        if component_count < 1:
            self.collab_model = None
            return

        self.collab_model = NMF(
            n_components=component_count,  # Number of hidden patterns to find
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
        vehicle_df = vehicle_df.reset_index(drop=True)
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
        
        # Multi-label features - a car can have several features(Bluetooth AND Sunroof AND ...)
        raw_features = vehicle_df['features'] if 'features' in vehicle_df.columns else pd.Series([''] * len(vehicle_df))
        feature_lists = raw_features.fillna('').apply(
            lambda s: [f.strip() for f in str(s).split(';') if f.strip()]
        )
        mlb = MultiLabelBinarizer()
        feature_dummies = pd.DataFrame(
            mlb.fit_transform(feature_lists),
            columns=[f'feat_{f}' for f in mlb.classes_]
        )

        # Text Features - TF-IDF on description
        tfidf = TfidfVectorizer(max_features=50, stop_words='english')
        desc_matrix = tfidf.fit_transform(
            vehicle_df['description'].fillna('')
        ).toarray()
        desc_df = pd.DataFrame(desc_matrix, columns=[f'desc_{i}' for i in range(desc_matrix.shape[1])])

        # Combine all features into one big feature matrix
        feature_matrix = pd.concat([
            features[['price_norm', 'mileage_norm', 'year_norm']],
            fuel_dummies, trans_dummies, body_dummies, make_dummies,
            feature_dummies, desc_df],
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
        
        if vehicle_df is None or not isinstance(vehicle_df, pd.DataFrame) or vehicle_df.empty:
            self.vehicle_df = pd.DataFrame()
            self.vehicle_ids = []
            self.vehicle_features = None
            self.vehicle_similarity = None
            self.user_item_matrix = None
            self.collab_model = None
            return

        required_columns = ['vehicle_id', 'price', 'mileage', 'year', 'fuel_type',
                            'transmission', 'body_type', 'make', 'model',
                            'condition', 'features', 'description']
        for column in required_columns:
            if column not in vehicle_df.columns:
                vehicle_df[column] = '' if column not in ['price', 'mileage', 'year'] else 0
        vehicle_df['vehicle_id'] = vehicle_df['vehicle_id'].astype(str)
        self.vehicle_ids = vehicle_df['vehicle_id'].tolist()

        # Handle empty or invalid interactions
        if interactions_df is None or not isinstance(interactions_df, pd.DataFrame) or interactions_df.empty:
            print('⚠️ No interaction data yet - skipping collaborative filter')
            self.user_item_matrix = None
            self.collab_model = None
        else:
            interactions_df = interactions_df.copy()
            interactions_df['user_id'] = interactions_df['user_id'].astype(str)
            interactions_df['vehicle_id'] = interactions_df['vehicle_id'].astype(str)
            interactions_df = interactions_df[interactions_df['vehicle_id'].isin(self.vehicle_ids)]
            if interactions_df.empty:
                self.user_item_matrix = None
                self.collab_model = None
                self.user_ids = []
                self.vehicle_ids = vehicle_df['vehicle_id'].tolist()
            else:
                self.user_item_matrix = self.build_user_item_matrix(interactions_df)
                self.train_collabrative_filter()
        
        self.build_vehicle_features(vehicle_df)
        print('✅ Model fully tained and ready!')

    # Generate Recommendations
    def collaborative_recommendations(self, user_id, n=20):
        """Get recommendations using what similar users liked"""
        user_id = str(user_id)
        if self.collab_model is None or user_id not in self.user_ids:
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
            {'vehicle_id': str(self.vehicle_ids[i]), 'score': float(predicted[i])}
            for i in top_indices if predicted[i] > -np.inf
        ]

    def _feature_values(self, value):
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return set()
        if isinstance(value, (list, tuple, set)):
            return {str(feature).strip().lower() for feature in value if str(feature).strip()}
        return {feature.strip().lower() for feature in str(value).split(';') if feature.strip()}

    def _closest_match_score(self, row, user_preferences):
        if not user_preferences:
            return 1.0

        score = 0.0
        total_weight = 0.0

        def add_weight(weight, value):
            nonlocal score, total_weight
            score += weight * value
            total_weight += weight

        budget_min = user_preferences.get('budget_min')
        if budget_min is not None:
            price = float(row.get('price', 0) or 0)
            if price >= float(budget_min):
                add_weight(0.2, 1.0)
            else:
                ratio = max(0.0, min(1.0, price / float(budget_min)))
                add_weight(0.2, ratio)

        budget_max = user_preferences.get('budget_max')
        if budget_max is not None:
            price = float(row.get('price', 0) or 0)
            if price <= float(budget_max):
                add_weight(0.2, 1.0)
            else:
                ratio = max(0.0, min(1.0, float(budget_max) / max(price, 1)))
                add_weight(0.2, ratio)

        for key, field, weight in [
            ('preferred_fuel', 'fuel_type', 0.2),
            ('preferred_body_type', 'body_type', 0.2),
            ('preferred_transmission', 'transmission', 0.15),
            ('preferred_condition', 'condition', 0.1),
        ]:
            preferred = user_preferences.get(key)
            if preferred:
                preferred_value = str(preferred).lower()
                actual_value = str(row.get(field, '') or '').lower()
                if actual_value == preferred_value:
                    add_weight(weight, 1.0)
                else:
                    add_weight(weight, 0.0)

        preferred_make = user_preferences.get('preferred_make')
        if preferred_make:
            actual_make = str(row.get('make', '') or '').lower()
            add_weight(0.12, 1.0 if actual_make == str(preferred_make).lower() else 0.0)

        preferred_model = user_preferences.get('preferred_model')
        if preferred_model:
            actual_model = str(row.get('model', '') or '').lower()
            add_weight(0.12, 1.0 if actual_model == str(preferred_model).lower() else 0.0)

        for key, field in [('min_year', 'year'), ('max_year', 'year'), ('min_mileage', 'mileage'), ('max_mileage', 'mileage')]:
            value = user_preferences.get(key)
            if value is not None:
                candidate_val = float(row.get(field, 0) or 0)
                bound = float(value)
                if 'min_' in key:
                    if candidate_val >= bound:
                        add_weight(0.08, 1.0)
                    else:
                        ratio = max(0.0, min(1.0, candidate_val / max(bound, 1)))
                        add_weight(0.08, ratio)
                else:
                    if candidate_val <= bound:
                        add_weight(0.08, 1.0)
                    else:
                        ratio = max(0.0, min(1.0, bound / max(candidate_val, 1)))
                        add_weight(0.08, ratio)

        desired_features = user_preferences.get('desired_features', [])
        if isinstance(desired_features, str):
            desired_features = desired_features.split(',')
        desired = {str(feature).strip().lower() for feature in desired_features if str(feature).strip()}
        if desired:
            available = self._feature_values(row.get('features', ''))
            matched = len(desired & available)
            ratio = matched / len(desired) if desired else 0.0
            add_weight(0.18, ratio)

        return score / total_weight if total_weight else 0.0

    def closest_match_recommendations(self, user_preferences, n=20):
        """Return the nearest vehicles when strict filters produce no result."""
        if self.vehicle_df is None or self.vehicle_df.empty:
            return []

        scored = []
        for _, row in self.vehicle_df.iterrows():
            score = self._closest_match_score(row, user_preferences)
            scored.append({'vehicle_id': str(row['vehicle_id']), 'score': round(score, 4), 'match_status': 'closest_match'})

        scored.sort(key=lambda item: item['score'], reverse=True)
        return scored[:n]

    def content_recommendations(self, user_preferences, n=20):
        """Get recommendations based strictly on the user's stated preferences"""
        if self.vehicle_df is None or self.vehicle_df.empty:
            return []

        # Filter by budget if provided
        candidates = self.vehicle_df.copy()
        if user_preferences.get('budget_max') is not None:
            candidates = candidates[candidates['price'] <= float(user_preferences['budget_max'])]
        if user_preferences.get('budget_min') is not None:
            candidates = candidates[candidates['price'] >= float(user_preferences['budget_min'])]
        if 'preferred_fuel' in user_preferences and user_preferences['preferred_fuel']:
            fuel = user_preferences['preferred_fuel'].lower()
            candidates = candidates[candidates['fuel_type'].str.lower() == fuel]
        if 'preferred_body_type' in user_preferences and user_preferences['preferred_body_type']:
            body = user_preferences['preferred_body_type'].lower()
            candidates = candidates[candidates['body_type'].str.lower() == body]
        if 'preferred_transmission' in user_preferences and user_preferences['preferred_transmission']:
            trans = user_preferences['preferred_transmission'].lower()
            candidates = candidates[candidates['transmission'].str.lower() == trans]
        if user_preferences.get('preferred_condition'):
            condition = str(user_preferences['preferred_condition']).lower()
            candidates = candidates[candidates['condition'].fillna('').str.lower() == condition]

        if user_preferences.get('preferred_make'):
            make = str(user_preferences['preferred_make']).lower()
            candidates = candidates[candidates['make'].fillna('').str.lower() == make]

        if user_preferences.get('preferred_model'):
            model = str(user_preferences['preferred_model']).lower()
            candidates = candidates[candidates['model'].fillna('').str.lower() == model]

        for preference_key, column_name, comparison in [
            ('min_year', 'year', lambda values, bound: values >= float(bound)),
            ('max_year', 'year', lambda values, bound: values <= float(bound)),
            ('min_mileage', 'mileage', lambda values, bound: values >= float(bound)),
            ('max_mileage', 'mileage', lambda values, bound: values <= float(bound)),
        ]:
            if user_preferences.get(preference_key) is not None:
                candidates = candidates[comparison(candidates[column_name], user_preferences[preference_key])]

        desired_features = user_preferences.get('desired_features', [])
        if isinstance(desired_features, str):
            desired_features = desired_features.split(',')
        if desired_features:
            desired = {str(feature).strip().lower() for feature in desired_features if str(feature).strip()}

            def has_desired_features(value):
                if isinstance(value, (list, tuple, set)):
                    available = {str(feature).strip().lower() for feature in value if str(feature).strip()}
                else:
                    available = {feature.strip().lower() for feature in str(value or '').split(';') if feature.strip()}
                return all(
                    any(feature in available_feature or available_feature in feature for available_feature in available)
                    for feature in desired
                )

            candidates = candidates[candidates['features'].apply(has_desired_features)]

        if candidates.empty:
            return []

        # Return top N from filtered candidates
        top_candidates = candidates.head(n)
        return [
            {'vehicle_id': row['vehicle_id'], 'score': 0.5}
            for _, row in top_candidates.iterrows()
        ]

    def get_recommendations(self, user_id, user_preferences=None, n=10):
        """
        Main method - combines both approaches.
        60% weight on collaborative, 40% on content-based.
        Like asking both friend a friend and a salesperson, then averaging their advice.
        """
        user_preferences = user_preferences or {}

        strict_content = self.content_recommendations(user_preferences, n * 2)
        strict_ids = {item['vehicle_id'] for item in strict_content}

        if strict_content:
            content_pool = strict_content
            relaxed = False
        else:
            content_pool = self.closest_match_recommendations(user_preferences, n * 2)
            relaxed = True

        combined = {}

        # Run collab filter if model is trained
        if self.collab_model is not None and str(user_id) in self.user_ids:
            collab = self.collaborative_recommendations(user_id, n * 2)
            allowed_ids = {item['vehicle_id'] for item in content_pool}
            for item in collab:
                if item['vehicle_id'] in allowed_ids:
                    combined[item['vehicle_id']] = 0.6 * item['score']

        # Always run content-based filter
        for item in content_pool:
            vid = item['vehicle_id']
            base_score = item.get('score', 0.5)
            combined[vid] = combined.get(vid, 0) + 0.4 * base_score

        # Sort by combined score
        sorted_recs = sorted(combined.items(), key=lambda x: x[1], reverse=True)
        top_recs = sorted_recs[:n]

        results = []
        for vid, score in top_recs:
            item = {'vehicle_id': vid, 'score': round(score, 4)}
            if relaxed:
                item['match_status'] = 'closest_match'
            else:
                item['match_status'] = 'exact'
            results.append(item)

        return results

    def explain(self, user_id, vehicle_id):
        """Return a human-readable for the recommendations"""
        reasons = []
        if user_id in self.user_ids:
            reasons.append('Users with similar preferences also liked this vehicle')
        if self.vehicle_df is not None:
            v = self.vehicle_df[self.vehicle_df['vehicle_id'] == vehicle_id]
            if not v.empty:
                reasons.append(f"Matches your interest in {v.iloc[0]['make']} {v.iloc[0]['body_type']} vehicles")
                if v.iloc[0].get('features'):
                    reasons.append(f"Includes features you're looking for: {v.iloc[0]['features']}")
        return reasons if reasons else ['Highly rated vehicle on AutoSphere']