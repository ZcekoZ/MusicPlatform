DROP TABLE IF EXISTS listening_history CASCADE;
DROP TABLE IF EXISTS liked_songs CASCADE;
DROP TABLE IF EXISTS playlist_songs CASCADE;
DROP TABLE IF EXISTS song_genres CASCADE;
DROP TABLE IF EXISTS song_artists CASCADE;
DROP TABLE IF EXISTS artist_followers CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS albums CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP VIEW IF EXISTS top_songs;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artists (
    artist_id SERIAL PRIMARY KEY,
    deezer_artist_id BIGINT UNIQUE,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    image_url TEXT,
    bio TEXT,
    monthly_listeners INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE albums (
    album_id SERIAL PRIMARY KEY,
    deezer_album_id BIGINT UNIQUE,
    title VARCHAR(150) NOT NULL,
    release_date DATE,
    cover_url TEXT,
    artist_id INT NOT NULL REFERENCES artists(artist_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE songs (
    song_id SERIAL PRIMARY KEY,
    deezer_track_id BIGINT UNIQUE,
    title VARCHAR(150) NOT NULL,
    duration_seconds INT NOT NULL CHECK (duration_seconds > 0),
    plays_count INT DEFAULT 0,
    album_id INT REFERENCES albums(album_id) ON DELETE CASCADE,
    audio_url TEXT,
    cover_url TEXT,
    lyrics TEXT,
    explicit BOOLEAN DEFAULT FALSE,
    deezer_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE song_artists (
    song_id INT REFERENCES songs(song_id) ON DELETE CASCADE,
    artist_id INT REFERENCES artists(artist_id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (song_id, artist_id)
);

CREATE TABLE playlists (
    playlist_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cover_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE playlist_songs (
    playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    song_id INT REFERENCES songs(song_id) ON DELETE CASCADE,
    position INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, song_id),
    UNIQUE (playlist_id, position)
);

CREATE TABLE genres (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE song_genres (
    song_id INT REFERENCES songs(song_id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (song_id, genre_id)
);

CREATE TABLE artist_followers (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    artist_id INT REFERENCES artists(artist_id) ON DELETE CASCADE,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, artist_id)
);

CREATE TABLE user_follows (
    follower_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    following_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
);

CREATE TABLE liked_songs (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    song_id INT REFERENCES songs(song_id) ON DELETE CASCADE,
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, song_id)
);

CREATE TABLE listening_history (
    history_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    song_id INT REFERENCES songs(song_id) ON DELETE CASCADE,
    listened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'player'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_deezer_track_id ON songs(deezer_track_id);
CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_albums_title ON albums(title);
CREATE INDEX idx_listening_history_user ON listening_history(user_id);
CREATE INDEX idx_playlist_songs_playlist ON playlist_songs(playlist_id);

CREATE OR REPLACE FUNCTION increment_song_play_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE songs
    SET plays_count = plays_count + 1
    WHERE song_id = NEW.song_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_song_listened
AFTER INSERT ON listening_history
FOR EACH ROW
EXECUTE FUNCTION increment_song_play_count();

CREATE VIEW top_songs AS
SELECT
    s.song_id,
    s.title,
    s.plays_count,
    a.title AS album_title
FROM songs s
LEFT JOIN albums a ON s.album_id = a.album_id
ORDER BY s.plays_count DESC
LIMIT 10;
