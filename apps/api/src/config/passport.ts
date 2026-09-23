import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { resolveGoogleUser } from "../lib/googleAccount.js";

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL;

if (clientID && clientSecret && callbackURL) {
  passport.use(
    new GoogleStrategy(
      { clientID, clientSecret, callbackURL },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("لا يوجد بريد إلكتروني من Google"));

          const result = await resolveGoogleUser({
            googleId: profile.id,
            email,
            displayName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          });

          if (!result.ok) return done(null, false, { message: result.reason });
          done(null, result.user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
} else {
  // eslint-disable-next-line no-console
  console.warn("Google OAuth غير مُفعّل: أضف GOOGLE_CLIENT_ID/SECRET في .env لتفعيله.");
}

export default passport;
