import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import { User } from '../models/core/User.model';

// ── Local Strategy ────────────────────────────────────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        if (!user.password) {
          return done(null, false, { message: 'Use social login for this account.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ── Google OAuth Strategy ─────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'mock_google_id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'mock_google_secret';
const GOOGLE_CALLBACK_URL = '/api/v1/auth/google/callback';

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (_req, _accessToken, _refreshToken, profile, done) => {
      try {
        // Check existing Google user
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // Link to existing email account
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            if (!user.avatar) {
              user.avatar = profile.photos?.[0]?.value;
            }
            await user.save();
            return done(null, user);
          }
        }

        // Create new Google user
        const newUser = new User({
          googleId: profile.id,
          email: email ?? `${profile.id}@google.com`,
          name: profile.displayName ?? 'Google User',
          avatar: profile.photos?.[0]?.value,
          role: 'USER',
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err: unknown) {
        return done(err as Error);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as unknown as { id: string }).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
