
const pool = require("../db");
const axios = require("axios");

exports.getSongs = async (req,res)=>{
  const r = await pool.query("SELECT * FROM songs LIMIT 50");
  res.json(r.rows);
};

exports.saveSong = async (req,res)=>{
  const {title,artist,audio_url,cover_url} = req.body;

  let a = await pool.query("SELECT * FROM artists WHERE name=$1",[artist]);
  let artist_id;
  if(a.rows.length===0){
    const ins = await pool.query("INSERT INTO artists(name) VALUES($1) RETURNING artist_id",[artist]);
    artist_id = ins.rows[0].artist_id;
  } else artist_id = a.rows[0].artist_id;

  const s = await pool.query(
    "INSERT INTO songs(title,duration_seconds,audio_url,cover_url) VALUES($1,30,$2,$3) RETURNING song_id",
    [title,audio_url,cover_url]
  );

  await pool.query(
    "INSERT INTO song_artists(song_id,artist_id,is_primary) VALUES($1,$2,true)",
    [s.rows[0].song_id,artist_id]
  );

  res.json({ok:true});
};

exports.likeSong = async (req,res)=>{
  await pool.query("INSERT INTO liked_songs(user_id,song_id) VALUES(1,$1) ON CONFLICT DO NOTHING",[req.params.id]);
  res.json({ok:true});
};

exports.getPlaylists = async (req,res)=>{
  const r = await pool.query("SELECT * FROM playlists");
  res.json(r.rows);
};

exports.addToPlaylist = async (req,res)=>{
  await pool.query(
    "INSERT INTO playlist_songs(playlist_id,song_id,position) VALUES($1,$2,1) ON CONFLICT DO NOTHING",
    [req.params.id, req.body.song_id]
  );
  res.json({ok:true});
};

exports.searchDeezer = async (req,res)=>{
  const r = await axios.get("https://api.deezer.com/search?q="+req.query.q);
  res.json(r.data.data.map(x=>({
    title:x.title,
    artist:x.artist.name,
    preview:x.preview,
    cover:x.album.cover_medium
  })));
};
