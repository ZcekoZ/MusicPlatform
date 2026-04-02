# Musicify

A lightweight music platform demo with a vanilla frontend and Express/PostgreSQL backend.

## Added features
- 30-second song playback via Deezer previews
- Likes page backed by `liked_songs`
- Playlist creation and song management backed by `playlists` and `playlist_songs`
- Artist listing and dedicated artist detail pages
- Listening history inserts for play actions

## Folder structure
Unchanged:
- `client/`
- `server/`
- `db/`

## Database setup
Paste these into your PostgreSQL console in this order:
1. `db/schema.sql`
2. `db/seed.sql`

## Server setup
Inside `server/`:
```bash
npm install
npm run dev
```

Create `.env` from `.env.example` and set:
- `DATABASE_URL`
- `CLIENT_URL`
- `JWT_SECRET`

## Frontend API base
The frontend still uses the deployed backend by default:
- `https://musicplatformserver.onrender.com/api`

If you want a different API base without changing folder structure, define `window.API_BASE` before `api.js` loads.

## Notes
- The app uses demo user `user_id = 1` for likes, playlists, and listening history.
- Song playback tries Deezer first, then falls back to the stored `audio_url` if Deezer has no preview match.


## Deezer persistence

Search results from Deezer can now be saved into PostgreSQL. The schema adds nullable unique columns for `deezer_artist_id`, `deezer_album_id`, and `deezer_track_id`, so rerun `db/schema.sql` and `db/seed.sql` before starting the updated version.
