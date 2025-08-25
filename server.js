require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const mongoURI = process.env.mongoURI;
if (!mongoURI) {
  console.error("❌ Error: mongoURI is not defined in environment variables");
  process.exit(1); // stop the server
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  });

// API Routes
app.use("/api/authorize", require("./api/authorize"));
app.use("/api/user", require("./api/user"));
app.use("/api/stocks", require("./api/stocks"));
app.use("/api/iex", require("./api/iex"));
app.use("/api/email", require("./api/email"));

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "client", "build");
  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

// Start Server
const PORT = process.env.PORT || 5051;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
