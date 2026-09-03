import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../lib/prisma.js";

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

          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email }] },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                googleId: profile.id,
                profile: {
                  create: {
                    displayName: profile.displayName || email.split("@")[0],
                    avatarUrl: profile.photos?.[0]?.value,
                  },
                },
              },
            });
          } else if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id },
            });
          }

          done(null, user);
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
