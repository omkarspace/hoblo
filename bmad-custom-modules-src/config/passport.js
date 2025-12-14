const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (only initialize if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback'
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID or email
      let user = await User.findByEmailOrSocialId(profile.emails[0].value, profile.id);

      if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      // Create new user
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        isEmailVerified: true, // Google emails are pre-verified
        profilePicture: profile.photos[0].value
      });

      await user.save();
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
  ));
}

// Facebook OAuth Strategy (only initialize if credentials are provided)
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name', 'picture']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Facebook ID or email
      let user = await User.findByEmailOrSocialId(profile.emails[0].value, null, profile.id);

      if (user) {
        // Update Facebook ID if not set
        if (!user.facebookId) {
          user.facebookId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      // Create new user
      user = new User({
        facebookId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        isEmailVerified: true, // Facebook emails are pre-verified
        profilePicture: profile.photos[0].value
      });

      await user.save();
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
  ));
}

module.exports = passport;
