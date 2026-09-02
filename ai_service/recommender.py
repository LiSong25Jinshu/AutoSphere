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

    def _normalize_token(self, value):
        if value is None:
            return ''
        cleaned = str(value).strip().lower().replace('-', ' ').replace('_', ' ')
        cleaned = ''.join(ch if ch.isalnum() or ch.isspace() else ' ' for ch in cleaned)
        return ' '.join(cleaned.split())

    def _canonical_value(self, value):
        token = self._normalize_token(value)
        if not token:
            return ''

        aliases = {
            'suv': {'suv', 'sport utility vehicle', 'sport utility', 'utility vehicle'},
            'sedan': {'sedan', 'saloon'},
            'hatchback': {'hatchback', 'hatch'},
            'truck': {'truck', 'pickup', 'pickup truck'},
            'wagon': {'wagon', 'estate'},
            'coupe': {'coupe'},
            'convertible': {'convertible', 'cabriolet'},
            'petrol': {'petrol', 'gasoline', 'gas', 'benzine'},
            'diesel': {'diesel'},
            'hybrid': {'hybrid'},
            'electric': {'electric', 'ev', 'battery electric'},
            'automatic': {'automatic', 'auto'},
            'manual': {'manual', 'mt'},
            'cvt': {'cvt', 'continuously variable transmission'},
            'all wheel drive': {'all wheel drive', 'allwheeldrive', 'awd'},
            'front wheel drive': {'front wheel drive', 'fwd'},
            'rear wheel drive': {'rear wheel drive', 'rwd'},
            'foreign used': {'foreign used', 'foreign', 'imported'},
            'ghana used': {'ghana used', 'ghana'},
            'daily commuting': {'daily commuting', 'daily commute', 'commuting', 'commute', 'city commute'},
            'weekend trips': {'weekend trips', 'weekend trip', 'weekend getaway', 'travel'},
            'family use': {'family use', 'family', 'school runs', 'kids', 'school'},
            'business': {'business', 'executive', 'office', 'corporate'},
            'adventure': {'adventure', 'offroad', 'off road', 'trail', 'terrain', 'camping'},
            'urban professional': {'urban professional', 'urban', 'professional', 'city'},
            'family oriented': {'family oriented', 'family', 'school', 'kids'},
            'adventure seeker': {'adventure seeker', 'adventure', 'offroad', 'trail', 'terrain', 'explore'},
            'eco conscious': {'eco conscious', 'eco', 'green', 'efficient', 'fuel efficient', 'hybrid', 'electric'},
            'luxury lover': {'luxury lover', 'luxury', 'premium', 'executive', 'prestige'},
            'budget conscious': {'budget conscious', 'budget', 'affordable', 'value', 'economy', 'cheapest'},
        }

        for canonical, values in aliases.items():
            if token in values or any(value_key in token for value_key in values):
                return canonical
        return token

    def _keyword_map(self):
        return {
            'daily_commuting': {'daily', 'commute', 'commuting', 'city', 'urban', 'work'},
            'weekend_trips': {'weekend', 'trip', 'trips', 'getaway', 'travel'},
            'family_use': {'family', 'families', 'familyoriented', 'school', 'kids', 'cabin'},
            'business': {'business', 'executive', 'office', 'corporate'},
            'adventure': {'adventure', 'offroad', 'trail', 'terrain', 'camping'},
            'urban_professional': {'urban', 'professional', 'city', 'daily', 'commute'},
            'family_oriented': {'family', 'families', 'familyoriented', 'school', 'kids', 'trip'},
            'adventure_seeker': {'adventure', 'offroad', 'trail', 'terrain', 'explore'},
            'eco_conscious': {'eco', 'green', 'hybrid', 'electric', 'efficient', 'fuel efficient'},
            'luxury_lover': {'luxury', 'premium', 'executive', 'premium audio', 'prestige'},
            'budget_conscious': {'budget', 'affordable', 'value', 'economy', 'cheapest'},
        }

    def _feature_aliases(self):
        return {
            'allwheeldrive': {'all wheel drive', 'all wheel drive awd', 'awd', 'allwheeldrive'},
            'backupcamera': {'backup camera', 'rear camera', 'reverse camera'},
            'bluetooth': {'bluetooth'},
            'heatedseats': {'heated seats', 'heated seat'},
            'leatherseats': {'leather seats', 'leather seat'},
            'navigation': {'navigation', 'gps', 'nav'},
            'premiumaudio': {'premium audio', 'audio system'},
            'sunroof': {'sunroof', 'moonroof'},
            'all wheel drive': {'all wheel drive', 'allwheeldrive', 'awd'},
            'backup camera': {'backup camera', 'rear camera', 'reverse camera'},
            'heated seats': {'heated seats', 'heated seat'},
            'leather seats': {'leather seats', 'leather seat'},
            'premium audio': {'premium audio', 'audio system'},
        }

    def _feature_values(self, value):
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return set()
        if isinstance(value, (list, tuple, set)):
            return {self._normalize_token(feature) for feature in value if str(feature).strip()}
        return {self._normalize_token(feature) for feature in str(value).split(';') if feature.strip()}

    def _match_equivalence_score(self, preferred, actual):
        if not preferred or not actual:
            return 0.0

        preferred_value = self._canonical_value(preferred)
        actual_value = self._canonical_value(actual)
        if preferred_value and actual_value and preferred_value == actual_value:
            return 1.0

        preferred_tokens = set(self._normalize_token(preferred_value).split())
        actual_tokens = set(self._normalize_token(actual_value).split())
        if preferred_tokens and actual_tokens:
            overlap = len(preferred_tokens & actual_tokens)
            if overlap:
                return 0.55

        preferred_text = self._normalize_token(preferred)
        actual_text = self._normalize_token(actual)
        if preferred_text and actual_text:
            if preferred_text in actual_text or actual_text in preferred_text:
                return 0.45

        if preferred_value and actual_value:
            if preferred_value in actual_value or actual_value in preferred_value:
                return 0.35

        return 0.0

    def _match_feature_tokens(self, desired_feature, available_features):
        if not desired_feature:
            return False
        desired = self._canonical_value(desired_feature)
        aliases = self._feature_aliases().get(self._normalize_token(desired_feature).replace(' ', ''), set())
        candidate_tokens = {desired, self._normalize_token(desired_feature), *{self._normalize_token(alias) for alias in aliases}}
        for token in candidate_tokens:
            if token in available_features:
                return True
            for available in available_features:
                normalized_available = self._normalize_token(available)
                if token in normalized_available or normalized_available in token:
                    return True
                canonical_available = self._canonical_value(available)
                if token == canonical_available or canonical_available in token or token in canonical_available:
                    return True
        return False

    def _description_keyword_score(self, description, preferences):
        if not description:
            return 0.0
        description_text = self._normalize_token(description)
        score = 0.0
        keywords = self._keyword_map()

        for key in ['usage', 'lifestyle']:
            value = preferences.get(key)
            if not value:
                continue
            normalized = self._normalize_token(value)
            if not normalized:
                continue
            if any(word in description_text for word in [normalized]):
                score += 0.4
            for alias_key, alias_words in keywords.items():
                alias_text = self._normalize_token(alias_key).replace('_', ' ')
                if normalized in alias_text or alias_text in normalized:
                    if any(word in description_text for word in alias_words):
                        score += 0.6
        return score

    def _soft_preference_score(self, preferred, actual):
        if not preferred or not actual:
            return 0.0
        exact = self._match_equivalence_score(preferred, actual)
        if exact > 0:
            return exact

        preferred_tokens = set(self._normalize_token(preferred).split())
        actual_tokens = set(self._normalize_token(actual).split())
        if preferred_tokens and actual_tokens:
            overlap = len(preferred_tokens & actual_tokens)
            if overlap:
                return 0.55

        preferred_clean = self._normalize_token(preferred)
        actual_clean = self._normalize_token(actual)
        if preferred_clean and actual_clean:
            if preferred_clean in actual_clean or actual_clean in preferred_clean:
                return 0.45
        return 0.0

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

        preferred_fuel = user_preferences.get('preferred_fuel')
        preferred_body = user_preferences.get('preferred_body_type')
        if preferred_fuel or preferred_body:
            fuel_score = self._soft_preference_score(preferred_fuel, row.get('fuel_type', '')) if preferred_fuel else 0.0
            body_score = self._soft_preference_score(preferred_body, row.get('body_type', '')) if preferred_body else 0.0
            pair_score = 0.0
            if preferred_fuel and preferred_body:
                if fuel_score > 0.0 and body_score > 0.0:
                    pair_score = 1.0 if fuel_score >= 1.0 and body_score >= 1.0 else 0.7
                elif fuel_score > 0.0 or body_score > 0.0:
                    pair_score = 0.55
                else:
                    pair_score = 0.2
            elif preferred_fuel:
                pair_score = fuel_score
            elif preferred_body:
                pair_score = body_score
            add_weight(0.34, pair_score)

        for key, field, weight in [
            ('preferred_transmission', 'transmission', 0.15),
            ('preferred_condition', 'condition', 0.1),
        ]:
            preferred = user_preferences.get(key)
            if preferred:
                match_score = self._match_equivalence_score(preferred, row.get(field, ''))
                add_weight(weight, match_score)

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
        desired = [feature for feature in desired_features if str(feature).strip()]
        if desired:
            available = self._feature_values(row.get('features', ''))
            matched = 0
            for feature in desired:
                if self._match_feature_tokens(feature, available):
                    matched += 1
            ratio = matched / len(desired) if desired else 0.0
            add_weight(0.18, ratio)

        description = str(row.get('description', '') or '')
        add_weight(0.16, self._description_keyword_score(description, user_preferences))

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

    def fallback_recommendations(self, user_preferences, n=10):
        if self.vehicle_df is None or self.vehicle_df.empty:
            return []
        ranked = []
        for _, row in self.vehicle_df.iterrows():
            score = 0.0

            body_pref = user_preferences.get('preferred_body_type')
            fuel_pref = user_preferences.get('preferred_fuel')
            if body_pref:
                body_score = self._soft_preference_score(body_pref, row.get('body_type', ''))
                score += 0.45 * body_score
            if fuel_pref:
                fuel_score = self._soft_preference_score(fuel_pref, row.get('fuel_type', ''))
                score += 0.35 * fuel_score

            description = str(row.get('description', '') or '').lower()
            if user_preferences.get('usage'):
                usage_score = 0.2 if self._normalize_token(user_preferences['usage']) in description else 0.0
                score += usage_score
            if user_preferences.get('lifestyle'):
                lifestyle_score = 0.2 if self._normalize_token(user_preferences['lifestyle']) in description else 0.0
                score += lifestyle_score

            desired_features = user_preferences.get('desired_features', [])
            if isinstance(desired_features, str):
                desired_features = desired_features.split(',')
            available = self._feature_values(row.get('features', ''))
            feature_hits = 0
            for feature in [f for f in desired_features if str(f).strip()]:
                if self._match_feature_tokens(feature, available):
                    feature_hits += 1
            if desired_features:
                score += 0.25 * (feature_hits / len(desired_features))

            ranked.append({'vehicle_id': str(row['vehicle_id']), 'score': round(score, 4)})
        ranked.sort(key=lambda item: item['score'], reverse=True)
        return [{'vehicle_id': item['vehicle_id'], 'score': item['score'], 'match_status': 'closest_match'} for item in ranked[:n]]

    def content_recommendations(self, user_preferences, n=20):
        """Rank vehicles by preference fit, not exact-pass filtering alone."""
        if self.vehicle_df is None or self.vehicle_df.empty:
            return []

        scored = []
        for _, row in self.vehicle_df.iterrows():
            score = 0.0
            total_weight = 0.0

            def add_weight(weight, value):
                nonlocal score, total_weight
                score += weight * value
                total_weight += weight

            budget_min = user_preferences.get('budget_min')
            budget_max = user_preferences.get('budget_max')
            price = float(row.get('price', 0) or 0)
            if budget_min is not None:
                if price >= float(budget_min):
                    add_weight(0.18, 1.0)
                else:
                    add_weight(0.18, max(0.0, min(1.0, price / float(budget_min))))
            if budget_max is not None:
                if price <= float(budget_max):
                    add_weight(0.18, 1.0)
                else:
                    add_weight(0.18, max(0.0, min(1.0, float(budget_max) / max(price, 1))))

            preferred_fuel = user_preferences.get('preferred_fuel')
            preferred_body = user_preferences.get('preferred_body_type')
            if preferred_fuel or preferred_body:
                fuel_score = self._soft_preference_score(preferred_fuel, row.get('fuel_type', '')) if preferred_fuel else 0.0
                body_score = self._soft_preference_score(preferred_body, row.get('body_type', '')) if preferred_body else 0.0
                if preferred_fuel and preferred_body:
                    if fuel_score > 0 and body_score > 0:
                        pair_score = 1.0 if fuel_score >= 1.0 and body_score >= 1.0 else 0.75
                    elif fuel_score > 0 or body_score > 0:
                        pair_score = 0.6
                    else:
                        pair_score = 0.2
                elif preferred_fuel:
                    pair_score = fuel_score
                else:
                    pair_score = body_score
                add_weight(0.26, pair_score)

            for key, field, weight in [
                ('preferred_transmission', 'transmission', 0.12),
                ('preferred_condition', 'condition', 0.08),
            ]:
                preferred = user_preferences.get(key)
                if not preferred:
                    continue
                match_score = self._match_equivalence_score(preferred, row.get(field, ''))
                add_weight(weight, match_score)

            if user_preferences.get('preferred_make'):
                actual_make = self._normalize_token(row.get('make', ''))
                if actual_make == self._normalize_token(user_preferences['preferred_make']):
                    add_weight(0.09, 1.0)
                else:
                    add_weight(0.09, 0.0)

            if user_preferences.get('preferred_model'):
                actual_model = self._normalize_token(row.get('model', ''))
                if actual_model == self._normalize_token(user_preferences['preferred_model']):
                    add_weight(0.09, 1.0)
                else:
                    add_weight(0.09, 0.0)

            for key, field in [('min_year', 'year'), ('max_year', 'year'), ('min_mileage', 'mileage'), ('max_mileage', 'mileage')]:
                if user_preferences.get(key) is None:
                    continue
                value = float(row.get(field, 0) or 0)
                bound = float(user_preferences[key])
                if 'min_' in key:
                    if value >= bound:
                        add_weight(0.05, 1.0)
                    else:
                        add_weight(0.05, max(0.0, min(1.0, value / max(bound, 1))))
                else:
                    if value <= bound:
                        add_weight(0.05, 1.0)
                    else:
                        add_weight(0.05, max(0.0, min(1.0, bound / max(value, 1))))

            desired_features = user_preferences.get('desired_features', [])
            if isinstance(desired_features, str):
                desired_features = desired_features.split(',')
            desired = [feature for feature in desired_features if str(feature).strip()]
            if desired:
                available = self._feature_values(row.get('features', ''))
                matches = 0
                for feature in desired:
                    if self._match_feature_tokens(feature, available):
                        matches += 1
                ratio = matches / len(desired) if desired else 0.0
                add_weight(0.14, ratio)

            description = str(row.get('description', '') or '')
            add_weight(0.14, self._description_keyword_score(description, user_preferences))

            if total_weight == 0:
                score = 0.15
            else:
                score = score / total_weight

            scored.append({'vehicle_id': str(row['vehicle_id']), 'score': round(score, 4)})

        scored.sort(key=lambda item: item['score'], reverse=True)
        return scored[:n]

    def get_recommendations(self, user_id, user_preferences=None, n=10):
        """
        Final pass: always return the strongest ranked candidate list, even when the
        user request is sparse or only partially matched.
        """
        user_preferences = user_preferences or {}

        content_pool = self.content_recommendations(user_preferences, n * 2)
        used_fallback = False

        if not content_pool:
            content_pool = self.closest_match_recommendations(user_preferences, n * 2)
            used_fallback = True

        if not content_pool:
            content_pool = self.fallback_recommendations(user_preferences, n * 2)
            used_fallback = True

        if not content_pool:
            return []

        combined = {}

        if self.collab_model is not None and str(user_id) in self.user_ids:
            collab = self.collaborative_recommendations(user_id, n * 2)
            allowed_ids = {item['vehicle_id'] for item in content_pool}
            for item in collab:
                if item['vehicle_id'] in allowed_ids:
                    combined[item['vehicle_id']] = 0.6 * item['score']

        for item in content_pool:
            vid = item['vehicle_id']
            base_score = item.get('score', 0.5)
            combined[vid] = combined.get(vid, 0) + 0.4 * base_score

        sorted_recs = sorted(combined.items(), key=lambda x: x[1], reverse=True)
        top_recs = sorted_recs[:n]

        results = []
        for vid, score in top_recs:
            item = {'vehicle_id': vid, 'score': round(score, 4)}
            if score >= 0.8 and not used_fallback:
                item['match_status'] = 'exact'
            elif score >= 0.45:
                item['match_status'] = 'closest_match'
            else:
                item['match_status'] = 'best_available'
            results.append(item)

        if not results:
            safe_pool = self.fallback_recommendations(user_preferences, n)
            if safe_pool:
                results = [{
                    'vehicle_id': item['vehicle_id'],
                    'score': round(item.get('score', 0.0), 4),
                    'match_status': 'best_available'
                } for item in safe_pool[:n]]

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