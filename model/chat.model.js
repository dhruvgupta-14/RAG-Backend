import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, enum: ["user", "ai"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});



export const ChatMessageModel = mongoose.model("ChatMessage", chatMessageSchema);
