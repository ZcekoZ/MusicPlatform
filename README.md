# Musicify

Simple music platform with:
- local Postgres-backed song library
- Deezer 30-second preview search
- persistent import of Deezer tracks into your DB
- likes, playlists, artist pages
- user accounts with token-based persistent sessions

## Demo login
Seed users all use:
- password: `password123`

Example:
- email: `ivan@mail.com`
- password: `password123`

## Setup
1. Load `db/schema.sql`
2. Load `db/seed.sql`
3. In `server/`, install dependencies:
   - `npm install`
4. Create `.env` from `.env.example`
5. Start backend:
   - `npm run dev`
6. Serve/deploy the client as before

## Auth flow
- Register or log in from the client sidebar
- The backend issues a random session token
- The client stores that token in `localStorage`
- Sessions stay active across refreshes until logout or expiry

## Important DB note
This version adds a new `user_sessions` table, so you should rerun the updated schema and seed files.
