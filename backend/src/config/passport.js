// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// Only register the Google strategy when real credentials are configured.
// Placeholder values (e.g. "your-google-client-id") are treated as missing so
// the server starts normally and email/password auth still works.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

const googleCredentialsConfigured =
  googleClientId &&
  googleClientSecret &&
  !googleClientId.startsWith('your-') &&
  !googleClientSecret.startsWith('your-');

if (googleCredentialsConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email found in Google profile'), null);

          // 1. Check by google_id first (returning user)
          let user = await User.findOne({ where: { googleId: profile.id } });
          if (user) return done(null, user);

          // 2. Check by email — link google_id to existing account
          user = await User.findOne({ where: { email } });
          if (user) {
            // Only update if not already linked to a different Google account
            if (!user.googleId) {
              await user.update({ googleId: profile.id, isVerified: true });
            }
            return done(null, user);
          }

          // 3. Create brand-new user
          user = await User.create({
            googleId:     profile.id,
            email,
            firstName:    profile.name?.givenName  || 'User',
            lastName:     profile.name?.familyName || '',
            isVerified:   true,
            passwordHash: null,  // null is allowed for OAuth users
            role:         'user',
            approvalStatus: 'approved',
          });

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth strategy error:', error.message);
          return done(error, null);
        }
      }
    )
  );
  console.log('Google OAuth strategy registered');
} else {
  console.log('Google OAuth credentials not configured — Google sign-in disabled');
}

// Sessions
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;