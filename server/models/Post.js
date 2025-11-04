import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    contentUpdatedAt: { type: Date, default: null }, // track edits
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
