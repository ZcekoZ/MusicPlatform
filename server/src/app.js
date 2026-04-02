
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Music Platform API running" });
});

app.get("/api/songs", async (req, res) => {
  const pool = require("./db");
  const result = await pool.query("SELECT * FROM songs LIMIT 20");
  res.json(result.rows);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

app.use('/api/deezer', require('./routes/deezer'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/playlists', require('./routes/playlists'));