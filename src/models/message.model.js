/**
 * message.model.js
 *
 * A single message inside a support Room.
 *
 * senderType:
 *   'user'    — sent by the end-user
 *   'support' — sent by a support agent
 *
 * fileType (when a file is attached):
 *   'image'    — jpg, jpeg, png, gif, webp
 *   'document' — pdf, doc, docx, xls, xlsx, txt
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    // Links back to the Room document
    roomId: { type: String, required: true, index: true },

    // ObjectId of the User (for user messages); null for support agents
    senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    senderType: {
      type:     String,
      enum:     ['user', 'support'],
      required: true
    },

    // Text content — optional when a file is attached
    content: { type: String, default: '' },

    // File attachment — optional
    fileUrl:  { type: String, default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: null },  // bytes
    fileType: {
      type:    String,
      enum:    ['image', 'document', null],
      default: null
    },

    // ISO timestamp when the other party read the message
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Efficient history queries: roomId + createdAt
MessageSchema.index({ roomId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
