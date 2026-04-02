const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "*";
const DEMO_USER_ID = 1;

app.use(cors({ origin: CLIENT_URL === "*" ? true : CLIENT_URL }));
app.use(express.json());

async function query(text, params = []) {
  return pool.query(text, params);
}

async function getDeezerPreview(title, artistName) {
  const q = encodeURIComponent(`${title} ${artistName}`.trim());
  const response = await fetch(`https://api.deezer.com/search?q=${q}`);
  if (!response.ok) {
    throw new Error(`Deezer request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const exactish = (payload.data || []).find((track) => {
    const trackTitle = String(track.title || "").toLowerCase();
    const trackArtist = String(track.artist?.name || "").toLowerCase();
    return track.preview && trackTitle.includes(String(title).toLowerCase()) && trackArtist.includes(String(artistName).toLowerCase());
  });

  const fallback = (payload.data || []).find((track) => track.preview);
  return exactish || fallback || null;
}

app.get("/", (req, res) => {
  res.json({ message: "Music Platform API running" });
});

app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true, service: "Music Platform API" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/songs", async (req, res) => {
  try {
    const result = await query(
      `SELECT
        s.song_id,
        s.title,
        s.duration_seconds,
        s.cover_url,
        s.explicit,
        s.plays_count,
        s.audio_url,
        a.album_id,
        a.title AS album_title,
        ar.artist_id,
        ar.name AS artist_name,
        ar.image_url AS artist_image,
        EXISTS (
          SELECT 1 FROM liked_songs ls
          WHERE ls.song_id = s.song_id AND ls.user_id = $1
        ) AS liked
      FROM songs s
      LEFT JOIN albums a ON a.album_id = s.album_id
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id AND sa.is_primary = TRUE
      LEFT JOIN artists ar ON ar.artist_id = sa.artist_id
      ORDER BY s.song_id`,
      [DEMO_USER_ID]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/songs/:songId/preview", async (req, res) => {
  try {
    const result = await query(
      `SELECT s.song_id, s.title, s.audio_url, ar.name AS artist_name
       FROM songs s
       LEFT JOIN song_artists sa ON sa.song_id = s.song_id AND sa.is_primary = TRUE
       LEFT JOIN artists ar ON ar.artist_id = sa.artist_id
       WHERE s.song_id = $1`,
      [req.params.songId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Song not found" });
    }

    const song = result.rows[0];
    let preview = null;

    try {
      preview = await getDeezerPreview(song.title, song.artist_name || "");
    } catch (deezerError) {
      console.error("Deezer preview lookup failed:", deezerError.message);
    }

    res.json({
      song_id: song.song_id,
      title: song.title,
      artist_name: song.artist_name,
      preview_url: preview?.preview || song.audio_url || null,
      deezer_track_id: preview?.id || null,
      deezer_link: preview?.link || null,
      album_cover: preview?.album?.cover_medium || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/artists", async (req, res) => {
  try {
    const result = await query(
      `SELECT
        ar.artist_id,
        ar.name,
        ar.country,
        ar.image_url,
        ar.bio,
        ar.monthly_listeners,
        COUNT(DISTINCT sa.song_id) AS songs_count,
        COUNT(DISTINCT af.user_id) AS followers_count
      FROM artists ar
      LEFT JOIN song_artists sa ON sa.artist_id = ar.artist_id
      LEFT JOIN artist_followers af ON af.artist_id = ar.artist_id
      GROUP BY ar.artist_id
      ORDER BY ar.monthly_listeners DESC, ar.name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/artists/:artistId", async (req, res) => {
  try {
    const artistResult = await query(
      `SELECT
        ar.artist_id,
        ar.name,
        ar.country,
        ar.image_url,
        ar.bio,
        ar.monthly_listeners,
        COUNT(DISTINCT af.user_id) AS followers_count
      FROM artists ar
      LEFT JOIN artist_followers af ON af.artist_id = ar.artist_id
      WHERE ar.artist_id = $1
      GROUP BY ar.artist_id`,
      [req.params.artistId]
    );

    if (!artistResult.rows.length) {
      return res.status(404).json({ error: "Artist not found" });
    }

    const songsResult = await query(
      `SELECT
        s.song_id,
        s.title,
        s.duration_seconds,
        s.cover_url,
        s.plays_count,
        a.title AS album_title,
        EXISTS (
          SELECT 1 FROM liked_songs ls
          WHERE ls.song_id = s.song_id AND ls.user_id = $2
        ) AS liked
      FROM song_artists sa
      INNER JOIN songs s ON s.song_id = sa.song_id
      LEFT JOIN albums a ON a.album_id = s.album_id
      WHERE sa.artist_id = $1
      ORDER BY s.plays_count DESC, s.song_id ASC`,
      [req.params.artistId, DEMO_USER_ID]
    );

    res.json({ ...artistResult.rows[0], songs: songsResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/likes", async (req, res) => {
  try {
    const result = await query(
      `SELECT
        s.song_id,
        s.title,
        s.duration_seconds,
        s.cover_url,
        s.plays_count,
        ar.artist_id,
        ar.name AS artist_name,
        ls.liked_at
      FROM liked_songs ls
      INNER JOIN songs s ON s.song_id = ls.song_id
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id AND sa.is_primary = TRUE
      LEFT JOIN artists ar ON ar.artist_id = sa.artist_id
      WHERE ls.user_id = $1
      ORDER BY ls.liked_at DESC`,
      [DEMO_USER_ID]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/likes/:songId", async (req, res) => {
  try {
    await query(
      `INSERT INTO liked_songs (user_id, song_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, song_id) DO NOTHING`,
      [DEMO_USER_ID, req.params.songId]
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/likes/:songId", async (req, res) => {
  try {
    await query(
      `DELETE FROM liked_songs WHERE user_id = $1 AND song_id = $2`,
      [DEMO_USER_ID, req.params.songId]
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/playlists", async (req, res) => {
  try {
    const result = await query(
      `SELECT
        p.playlist_id,
        p.name,
        p.description,
        p.created_at,
        COUNT(ps.song_id) AS songs_count,
        COALESCE(SUM(s.duration_seconds), 0) AS total_duration_seconds,
        MIN(s.cover_url) AS cover_url
      FROM playlists p
      LEFT JOIN playlist_songs ps ON ps.playlist_id = p.playlist_id
      LEFT JOIN songs s ON s.song_id = ps.song_id
      WHERE p.user_id = $1
      GROUP BY p.playlist_id
      ORDER BY p.created_at DESC, p.playlist_id DESC`,
      [DEMO_USER_ID]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/playlists", async (req, res) => {
  const { name, description } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Playlist name is required" });
  }

  try {
    const result = await query(
      `INSERT INTO playlists (name, description, user_id)
       VALUES ($1, $2, $3)
       RETURNING playlist_id, name, description, created_at`,
      [String(name).trim(), String(description || "").trim(), DEMO_USER_ID]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/playlists/:playlistId", async (req, res) => {
  try {
    const playlistResult = await query(
      `SELECT playlist_id, name, description, created_at
       FROM playlists
       WHERE playlist_id = $1 AND user_id = $2`,
      [req.params.playlistId, DEMO_USER_ID]
    );

    if (!playlistResult.rows.length) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const songsResult = await query(
      `SELECT
        s.song_id,
        s.title,
        s.duration_seconds,
        s.cover_url,
        s.plays_count,
        ps.position,
        ar.artist_id,
        ar.name AS artist_name,
        EXISTS (
          SELECT 1 FROM liked_songs ls
          WHERE ls.song_id = s.song_id AND ls.user_id = $2
        ) AS liked
      FROM playlist_songs ps
      INNER JOIN songs s ON s.song_id = ps.song_id
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id AND sa.is_primary = TRUE
      LEFT JOIN artists ar ON ar.artist_id = sa.artist_id
      WHERE ps.playlist_id = $1
      ORDER BY ps.position ASC`,
      [req.params.playlistId, DEMO_USER_ID]
    );

    res.json({ ...playlistResult.rows[0], songs: songsResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/playlists/:playlistId/songs", async (req, res) => {
  const { songId } = req.body;
  if (!songId) {
    return res.status(400).json({ error: "songId is required" });
  }

  try {
    const playlistResult = await query(
      `SELECT playlist_id FROM playlists WHERE playlist_id = $1 AND user_id = $2`,
      [req.params.playlistId, DEMO_USER_ID]
    );

    if (!playlistResult.rows.length) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const positionResult = await query(
      `SELECT COALESCE(MAX(position), 0) + 1 AS next_position
       FROM playlist_songs
       WHERE playlist_id = $1`,
      [req.params.playlistId]
    );

    await query(
      `INSERT INTO playlist_songs (playlist_id, song_id, position)
       VALUES ($1, $2, $3)
       ON CONFLICT (playlist_id, song_id) DO NOTHING`,
      [req.params.playlistId, songId, positionResult.rows[0].next_position]
    );

    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/playlists/:playlistId/songs/:songId", async (req, res) => {
  try {
    await query(
      `DELETE FROM playlist_songs
       WHERE playlist_id = $1
         AND song_id = $2
         AND EXISTS (
           SELECT 1 FROM playlists p
           WHERE p.playlist_id = $1 AND p.user_id = $3
         )`,
      [req.params.playlistId, req.params.songId, DEMO_USER_ID]
    );

    await query(
      `WITH ordered AS (
         SELECT song_id, ROW_NUMBER() OVER (ORDER BY position ASC) AS new_position
         FROM playlist_songs
         WHERE playlist_id = $1
       )
       UPDATE playlist_songs ps
       SET position = ordered.new_position
       FROM ordered
       WHERE ps.playlist_id = $1 AND ps.song_id = ordered.song_id`,
      [req.params.playlistId]
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/listens/:songId", async (req, res) => {
  try {
    await query(
      `INSERT INTO listening_history (user_id, song_id, source)
       VALUES ($1, $2, $3)`,
      [DEMO_USER_ID, req.params.songId, req.body.source || "player"]
    );

    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Unexpected server error" });
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
