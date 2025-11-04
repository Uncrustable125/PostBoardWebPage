import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import Post from "./models/Post.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes

// Test route
app.get("/", (req, res) => res.send("Welcome to DevConnect API!"));

// Get all posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Failed to fetch posts." });
  }
});

// Create a new post
app.post("/api/posts", async (req, res) => {
  try {
    const { title, content } = req.body;

    // Validation
    const errors = [];
    if (!title || !title.trim()) errors.push("Title is required.");
    if (!content || !content.trim()) errors.push("Content is required.");
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const newPost = new Post({ title, content });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: "Failed to create post." });
  }
});

// Update a post
app.put("/api/posts/:id", async (req, res) => {
  try {
    const { title, content } = req.body;

    // Validation
    const errors = [];
    if (!title || !title.trim()) errors.push("Title is required.");
    if (!content || !content.trim()) errors.push("Content is required.");
    if (errors.length) {
      return res.status(400).json({ message: errors.join(" ") });
    }

    // Update post with both updatedAt and contentUpdatedAt
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, contentUpdatedAt: new Date(), updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!post) return res.status(404).json({ message: "Post not found." });

    res.json(post);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ message: "Failed to update post." });
  }
});


// Delete a post
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    res.json({ message: "Post deleted successfully." });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Failed to delete post." });
  }
});

// Like a post
app.post("/api/posts/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    post.likes = (post.likes || 0) + 1;
    await post.save();
    res.json(post);
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ message: "Failed to like post." });
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
