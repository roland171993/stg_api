const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Device schema
 * - playerId: OneSignal Player ID (unique per device)
 * - platform: 'android' | 'ios' | 'web'
 * - userId: optional owner (ObjectId -> User)
 * - tags: arbitrary key/value labels synced with OneSignal (stored as strings)
 * - opt: per-category opt-in flags (booleans), updated by updateOpt()
 * - appVersion/deviceInfo: metadata you upsert from the client
 * - lastActiveAt: touched on each upsert
 */
const DeviceSchema = new Schema(
  {
    playerId: { type: String, required: true, unique: true, index: true },
    platform: {
      type: String,
      required: true,
      enum: ['android', 'ios', 'web'],
      index: true,
    },

    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, default: null },

    // Arbitrary tag bag (store as strings; OneSignal tags are string values)
    tags: {
      type: Map,
      of: String,
      default: {},
    },

    // Per-category opt-in flags (booleans), e.g. { marketing: true, jobs: false }
    opt: {
      type: Map,
      of: Boolean,
      default: {},
    },

    appVersion: { type: String, default: null },

    // Free-form device metadata (model, osVersion, brand, etc.)
    deviceInfo: { type: Schema.Types.Mixed, default: {} },

    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Helpful compound index if you often query user devices by platform
DeviceSchema.index({ userId: 1, platform: 1 });

// Keep lastActiveAt fresh when saving (safety; your service already sets it)
DeviceSchema.pre('save', function (next) {
  this.lastActiveAt = this.lastActiveAt || new Date();
  next();
});

module.exports = mongoose.model('Device', DeviceSchema);
