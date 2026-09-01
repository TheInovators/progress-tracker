import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    room: { type: String, default: 'general', index: true },
    text: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true },
);

export default mongoose.model('Message', messageSchema);
