import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import { User } from '../models/core/User.model';
import { authService } from '../modules/auth/auth.service';

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

        if (!user.isVerified) {
          return done(null, false, { message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email kích hoạt.' });
        }

        if (user.status === 'BLOCKED') {
          return done(null, false, { message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
        }

        if (!user.password) {
          return done(null, false, { message: 'Tài khoản liên kết mạng xã hội. Vui lòng đăng nhập qua Google.' });
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
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile.'));
        }

        const user = await authService.upsertSocialMedia({
          googleId: profile.id,
          email,
          fullName: profile.displayName || 'Google User',
          avatar: profile.photos?.[0]?.value,
        });

        return done(null, user);
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

