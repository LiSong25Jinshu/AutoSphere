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
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email found'), null);

          // Check user by googleId
          let user = await User.findOne({ where: { googleId: profile.id } });
          if (user) return done(null, user);

          // Check user by email
          user = await User.findOne({ where: { email } });
          if (user) {
            user.googleId = profile.id;
            user.isVerified = true;
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            googleId: profile.id,
            email,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            isVerified: true,
            passwordHash: 'google-oauth', // placeholder
            role: 'user',
          });

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
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