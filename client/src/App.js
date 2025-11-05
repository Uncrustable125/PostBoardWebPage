import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

function App() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rows, setRows] = useState(2);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);


    const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/posts");
      const data = await res.json();
      if (!res.ok) addError(data.message || "Failed to fetch posts.");
      setPosts(data);
    } catch (err) {
      console.error(err);
      addError("Cannot reach server.");
    } finally {
      setLoading(false);
    }
  }, [] );
  
useEffect(() => {
  fetchPosts();
}, [fetchPosts]);



  const addError = (msg) => {
    setErrors((prev) => (prev.includes(msg) ? prev : [...prev, msg]));
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    const newlineCount = (val.match(/\n/g) || []).length;
    setRows(Math.max(2, 1 + newlineCount));
  };

const formatTimestamp = (post) => {
  // Use contentUpdatedAt if available, otherwise fallback to updatedAt
  const referenceTime = post.contentUpdatedAt ? new Date(post.contentUpdatedAt) : new Date(post.updatedAt);
  const createdTime = new Date(post.createdAt);

  const diffMs = Date.now() - referenceTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  let timeStr;
  if (diffMins < 1) timeStr = "Just now";
  else if (diffMins < 60) timeStr = `${diffMins} mins ago`;
  else if (diffMins < 1440) timeStr = `${Math.floor(diffMins / 60)} hours ago`;
  else timeStr = referenceTime.toLocaleString();

  // Add "(edited)" if post was updated after creation
  const edited = referenceTime > createdTime ? " (edited)" : "";

  return `${timeStr}${edited}`;
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = [];
    if (!title.trim() || !content.trim()) newErrors.push("Title and content is required.");
    if (newErrors.length) {
      newErrors.forEach(addError);
      return;
    }

    try {
      let res, post;

      if (editingId) {
        res = await fetch(`http://localhost:5000/api/posts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        post = await res.json();
        if (!res.ok) { addError(post.message || "Failed to update post."); return; }
        // Move edited post to top
        setPosts([post, ...posts.filter((p) => p._id !== editingId)]);
        setEditingId(null);
      } else {
        res = await fetch("http://localhost:5000/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        post = await res.json();
        if (!res.ok) { addError(post.message || "Failed to create post."); return; }
        setPosts([post, ...posts]);
      }

      setTitle("");
      setContent("");
      setRows(2);
      setErrors([]);
    } catch (err) {
      console.error(err);
      addError("Cannot reach server.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { addError(data.message || "Failed to delete post."); return; }
      setPosts(posts.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
      addError("Cannot reach server.");
    }
  };

  const handleLike = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${id}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { addError(data.message || "Failed to like post."); return; }
      // Update post in place (don't move to top on like)
      setPosts(posts.map((p) => (p._id === id ? data : p)));
    } catch (err) {
      console.error(err);
      addError("Cannot reach server.");
    }
  };

  const handleEdit = (post) => {
    setTitle(post.title);
    setContent(post.content);
    setEditingId(post._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container">
      <h1>DevConnect Posts</h1>

      {errors.length > 0 &&
        errors.map((errMsg, index) => (
          <div key={index} className="error-message">{errMsg}</div>
        ))}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={50}
        />
        <div className="char-counter">{50 - title.length} characters left</div>

        <textarea
          placeholder="Content"
          value={content}
          onChange={handleContentChange}
          rows={rows}
          maxLength={500}
        />
        <div className="char-counter">{500 - content.length} characters left</div>

        <button type="submit">{editingId ? "Update Post" : "Add Post"}</button>
      </form>

      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="no-posts">No posts yet!</p>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post._id + "-" + post.updatedAt} className="post">
              <div className="post-header">
                <div className="avatar"></div>
                <h2>{post.title}</h2>
              </div>
              <p>{post.content}</p>
              <small>{formatTimestamp(post)}</small>
              <div className="post-actions">
                <button onClick={() => handleLike(post._id)}>👍 {post.likes || 0}</button>
                <button onClick={() => handleEdit(post)}>✏️ Edit</button>
                <button onClick={() => handleDelete(post._id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
