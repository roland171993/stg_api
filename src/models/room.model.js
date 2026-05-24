/**
 * room.model.js
 *
 * Represents a support conversation between one user and the support team.
 * One room per user (created lazily on first message).
 *
 * roomId convention: "support-{userId}"
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema(
  {
    // The end-user who opened this support conversation
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true
    },

    // Human-readable room identifier — "support-{userId}"
    roomId: { type: String, required: true, unique: true },

    // Conversation lifecycle
    status: {
      type:    String,
      enum:    ['open', 'closed'],
      default: 'open'
    },

    // Denormalised for listing efficiency (no extra query needed)
    lastMessage:   { type: String, default: '' },
    lastMessageAt: { type: Date,   default: null },

    // Count of messages not yet read by support
    unreadBySupport: { type: Number, default: 0 },
    // Count of messages not yet read by user
    unreadByUser:    { type: Number, default: 0 }
  },
  { timestamps: true }
);

RoomSchema.index({ userId: 1 }, { unique: true });
RoomSchema.index({ status: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Room', RoomSchema);
