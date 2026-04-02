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

async function getDeezerJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Deezer request failed with status ${response.status}`);
  }
  return response.json();
}

async function getDeezerPreview(title, artistName) {
  const q = encodeURIComponent(`${title} ${artistName}`.trim());
  const payload = await getDeezerJson(`https://api.deezer.com/search?q=${q}`);
  const exactish = (payload.data || []).find((track) => {
    const trackTitle = String(track.title || "").toLowerCase();
    const trackArtist = String(track.artist?.name || "").toLowerCase();
    return track.preview && trackTitle.includes(String(title).toLowerCase()) && trackArtist.includes(String(artistName).toLowerCase());
  });

  const fallback = (payload.data || []).find((track) => track.preview);
  return exactish || fallback || null;
}

async function normalizeSearchResults(tracks) {
  const deezerIds = tracks.map((track) => Number(track.id)).filter(Boolean);
  const importedMap = new Map();

  if (deezerIds.length) {
    const imported = await query(
      `SELECT
        s.song_id,
        s.deezer_track_id,
        s.title,
        ar.artist_id,
        ar.name AS artist_name,
        EXISTS (
          SELECT 1 FROM liked_songs ls
          WHERE ls.song_id = s.song_id AND ls.user_id = $2
        ) AS liked
      FROM songs s
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id AND sa.is_primary = TRUE
      LEFT JOIN artists ar ON ar.artist_id = sa.artist_id
      WHERE s.deezer_track_id = ANY($1::bigint[])`,
      [deezerIds, DEMO_USER_ID]
    );

    imported.rows.forEach((row) => {
      importedMap.set(Number(row.deezer_track_id), row);
    });
  }

  return tracks
    .filter((track) => track.preview)
    .slice(0, 20)
    .map((track) => {
      const imported = importedMap.get(Number(track.id));
      return {
        source: "deezer",
        deezer_id: track.id,
        song_id: imported?.song_id || null,
        title: track.title,
        artist_name: track.artist?.name || "Unknown artist",
        artist_id: imported?.artist_id || null,
        deezer_artist_id: track.artist?.id || null,
        album_title: track.album?.title || null,
        deezer_album_id: track.album?.id || null,
        duration_seconds: track.duration || 30,
        plays_count: track.rank || 0,
        explicit: Boolean(track.explicit_lyrics),
        cover_url: track.album?.cover_medium || track.album?.cover || null,
        preview_url: track.preview,
        deezer_link: track.link || null,
        liked: Boolean(imported?.liked),
        imported: Boolean(imported)
      };
    });
}

async function importTrackToLibrary(trackInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const deezerTrackId = Number(trackInput.deezer_id || trackInput.id || 0) || null;
    const deezerArtistId = Number(trackInput.deezer_artist_id || trackInput.artist?.id || 0) || null;
    const deezerAlbumId = Number(trackInput.deezer_album_id || trackInput.album?.id || 0) || null;
    const artistName = String(trackInput.artist_name || trackInput.artist?.name || "Unknown artist").trim() || "Unknown artist";
    const albumTitle = String(trackInput.album_title || trackInput.album?.title || "Singles").trim() || "Singles";
    const title = String(trackInput.title || "Untitled track").trim() || "Untitled track";
    const previewUrl = String(trackInput.preview_url || trackInput.preview || "").trim() || null;
    const coverUrl = String(trackInput.cover_url || trackInput.album?.cover_medium || trackInput.album?.cover || "").trim() || null;
    const deezerLink = String(trackInput.deezer_link || trackInput.link || "").trim() || null;
    const durationSeconds = Math.max(1, Number(trackInput.duration_seconds || trackInput.duration || 30) || 30);
    const explicit = Boolean(trackInput.explicit);

    let existingSong = null;
    if (deezerTrackId) {
      const existingResult = await client.query(
        `SELECT s.song_id
         FROM songs s
         WHERE s.deezer_track_id = $1`,
        [deezerTrackId]
      );
      existingSong = existingResult.rows[0] || null;
    }

    let artistId = null;
    if (deezerArtistId) {
      const artistResult = await client.query(
        `INSERT INTO artists (deezer_artist_id, name, image_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (deezer_artist_id)
         DO UPDATE SET
           name = EXCLUDED.name,
           image_url = COALESCE(EXCLUDED.image_url, artists.image_url)
         RETURNING artist_id`,
        [deezerArtistId, artistName, coverUrl]
      );
      artistId = artistResult.rows[0].artist_id;
    } else {
      const artistLookup = await client.query(
        `SELECT artist_id
         FROM artists
         WHERE LOWER(name) = LOWER($1)
         LIMIT 1`,
        [artistName]
      );

      if (artistLookup.rows.length) {
        artistId = artistLookup.rows[0].artist_id;
      } else {
        const artistInsert = await client.query(
          `INSERT INTO artists (name, image_url)
           VALUES ($1, $2)
           RETURNING artist_id`,
          [artistName, coverUrl]
        );
        artistId = artistInsert.rows[0].artist_id;
      }
    }

    let albumId = null;
    if (deezerAlbumId) {
      const albumResult = await client.query(
        `INSERT INTO albums (deezer_album_id, title, cover_url, artist_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (deezer_album_id)
         DO UPDATE SET
           title = EXCLUDED.title,
           cover_url = COALESCE(EXCLUDED.cover_url, albums.cover_url),
           artist_id = EXCLUDED.artist_id
         RETURNING album_id`,
        [deezerAlbumId, albumTitle, coverUrl, artistId]
      );
      albumId = albumResult.rows[0].album_id;
    } else {
      const albumLookup = await client.query(
        `SELECT album_id
         FROM albums
         WHERE artist_id = $1 AND LOWER(title) = LOWER($2)
         LIMIT 1`,
        [artistId, albumTitle]
      );

      if (albumLookup.rows.length) {
        albumId = albumLookup.rows[0].album_id;
      } else {
        const albumInsert = await client.query(
          `INSERT INTO albums (title, cover_url, artist_id)
           VALUES ($1, $2, $3)
           RETURNING album_id`,
          [albumTitle, coverUrl, artistId]
        );
        albumId = albumInsert.rows[0].album_id;
      }
    }

    let songId = existingSong?.song_id || null;
    if (songId) {
      await client.query(
        `UPDATE songs
         SET title = $2,
             duration_seconds = $3,
             album_id = $4,
             audio_url = COALESCE($5, audio_url),
             cover_url = COALESCE($6, cover_url),
             explicit = $7,
             deezer_link = COALESCE($8, deezer_link)
         WHERE song_id = $1`,
        [songId, title, durationSeconds, albumId, previewUrl, coverUrl, explicit, deezerLink]
      );
    } else {
      const songInsert = await client.query(
        `INSERT INTO songs (
           title,
           duration_seconds,
           album_id,
           audio_url,
           cover_url,
           explicit,
           deezer_track_id,
           deezer_link
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING song_id`,
        [title, durationSeconds, albumId, previewUrl, coverUrl, explicit, deezerTrackId, deezerLink]
      );
      songId = songInsert.rows[0].song_id;
    }

    await client.query(
      `INSERT INTO song_artists (song_id, artist_id, is_primary)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (song_id, artist_id)
       DO UPDATE SET is_primary = TRUE`,
      [songId, artistId]
    );

    await client.query("COMMIT");

    const importedSong = await query(
      `SELECT
        s.song_id,
        s.title,
        s.duration_seconds,
        s.cover_url,
        s.explicit,
        s.plays_count,
        s.audio_url,
        s.deezer_track_id,
        a.album_id,
        a.title AS album_title,
        ar.artist_id,
        ar.name AS artist_name,
        ar.image_url AS artist_image,
        EXISTS (
          SELECT 1 FROM liked_songs ls
          WHERE ls.song_id = s.song_id AND ls.user_id = $2
        ) AS liked
      FROM songs s
      LEFT JOIN albums a ON a.album_id = s.album_id
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id AND sa.is_primary = TRUE
      LEFT JOIN artists ar ON ar.artist_id = sa.artist_id
      WHERE s.song_id = $1`,
      [songId, DEMO_USER_ID]
    );

    return importedSong.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
    const search = String(req.query.q || "").trim();
    const hasSearch = Boolean(search);
    const likePattern = hasSearch ? `%${search}%` : null;

    const result = await query(
      `SELECT
        s.song_id,
        s.title,
        s.duration_seconds,
        s.cover_url,
        s.explicit,
        s.plays_count,
        s.audio_url,
        s.deezer_track_id,
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
      WHERE (
        $2::text IS NULL
        OR s.title ILIKE $2
        OR COALESCE(ar.name, '') ILIKE $2
        OR COALESCE(a.title, '') ILIKE $2
      )
      ORDER BY s.plays_count DESC, s.song_id ASC`,
      [DEMO_USER_ID, likePattern]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.json([]);
    }

    const payload = await getDeezerJson(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`);
    const results = await normalizeSearchResults(payload.data || []);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/import-track", async (req, res) => {
  try {
    const track = req.body || {};
    if (!track.title || !(track.preview_url || track.preview)) {
      return res.status(400).json({ error: "Track title and preview URL are required" });
    }

    const importedSong = await importTrackToLibrary(track);
    res.status(201).json(importedSong);
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
      `SELECT playlist_id, name, description, cover_url, created_at
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
        ar.artist_id,
        ar.name AS artist_name,
        ps.position,
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
    const playlistCheck = await query(
      `SELECT playlist_id FROM playlists WHERE playlist_id = $1 AND user_id = $2`,
      [req.params.playlistId, DEMO_USER_ID]
    );

    if (!playlistCheck.rows.length) {
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
       WHERE playlist_id = $1 AND song_id = $2`,
      [req.params.playlistId, req.params.songId]
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
      [DEMO_USER_ID, req.params.songId, String(req.body.source || "player")]
    );

    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Music Platform API listening on port ${PORT}`);
});
