const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { Schema } = mongoose;

/**
 * User model — supports local (email/password) and OAuth (Google / Apple via Firebase).
 *
 * Fields:
 *   firstName, lastName, age, email (required, unique), phone, photoUrl
 *   authProvider  : 'local' | 'google' | 'apple'
 *   firebaseUid   : UID from Firebase Auth (Google / Apple flow)
 *   password      : optional — present only for local accounts
 *   role          : 'user' | 'admin'
 */
const UserSchema = new Schema(
  {
    firstName: { type: String, trim: true, default: '' },
    lastName:  { type: String, trim: true, default: '' },
    age:       { type: Number, min: 1, max: 150 },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:     { type: String, trim: true, default: '' },
    photoUrl:  { type: String, default: null },

    password:  { type: String, default: null }, // null for OAuth accounts

    authProvider: {
      type:    String,
      enum:    ['local', 'google', 'apple'],
      default: 'local'
    },

    // Firebase UID — shared key for Google & Apple sign-in flows
    firebaseUid: { type: String, default: null, sparse: true },

    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user'
    }
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/* Indexes                                                              */
/* ------------------------------------------------------------------ */
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ firebaseUid: 1 }, { sparse: true });

/* ------------------------------------------------------------------ */
/* Pre-save: hash password only when it is set and modified            */
/* ------------------------------------------------------------------ */
UserSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  try {
    const salt   = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/* Instance method: password comparison                                */
/* ------------------------------------------------------------------ */
UserSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

/* ------------------------------------------------------------------ */
/* Safe serialisation helper (no password, no __v)                     */
/* ------------------------------------------------------------------ */
UserSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
