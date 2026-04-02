-- USERS
INSERT INTO users (username, display_name, email, password_hash) VALUES
('ivan123', 'Ivan', 'ivan@mail.com', '$2b$10$demoHash1'),
('maria_music', 'Maria', 'maria@mail.com', '$2b$10$demoHash2'),
('geo_sound', 'Geo', 'geo@mail.com', '$2b$10$demoHash3'),
('niki_beats', 'Niki', 'niki@mail.com', '$2b$10$demoHash4'),
('alex_pop', 'Alex', 'alex@mail.com', '$2b$10$demoHash5'),
('desi_vibes', 'Desi', 'desi@mail.com', '$2b$10$demoHash6');

-- ARTISTS
INSERT INTO artists (name, country, image_url, bio, monthly_listeners) VALUES
('Drake', 'Canada', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f', 'Canadian rapper and singer.', 52000000),
('Adele', 'UK', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a', 'Award-winning British singer.', 43000000),
('The Weeknd', 'Canada', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'R&B superstar.', 61000000),
('Ed Sheeran', 'UK', 'https://images.unsplash.com/photo-1504593811423-6dd665756598', 'Singer-songwriter from the UK.', 48000000),
('Billie Eilish', 'USA', 'https://images.unsplash.com/photo-1487180144351-b8472da7d491', 'Pop artist known for unique style.', 39000000),
('Dua Lipa', 'UK', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81', 'British-Albanian pop singer.', 45000000);

-- ALBUMS
INSERT INTO albums (title, release_date, artist_id, cover_url) VALUES
('Scorpion', '2018-06-29', 1, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f'),
('25', '2015-11-20', 2, 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a'),
('After Hours', '2020-03-20', 3, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'),
('Divide', '2017-03-03', 4, 'https://images.unsplash.com/photo-1504593811423-6dd665756598'),
('Happier Than Ever', '2021-07-30', 5, 'https://images.unsplash.com/photo-1487180144351-b8472da7d491'),
('Future Nostalgia', '2020-03-27', 6, 'https://images.unsplash.com/photo-1516280440614-37939bbacd81');

-- SONGS
INSERT INTO songs (title, duration_seconds, album_id, audio_url, cover_url, explicit) VALUES
('Gods Plan', 198, 1, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f', FALSE),
('In My Feelings', 217, 1, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f', FALSE),
('Hello', 295, 2, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a', FALSE),
('Rolling in the Deep', 228, 2, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a', FALSE),
('Blinding Lights', 200, 3, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', FALSE),
('Save Your Tears', 215, 3, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', FALSE),
('Shape of You', 233, 4, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', 'https://images.unsplash.com/photo-1504593811423-6dd665756598', FALSE),
('Perfect', 263, 4, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', 'https://images.unsplash.com/photo-1504593811423-6dd665756598', FALSE),
('Bad Guy', 194, 5, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', 'https://images.unsplash.com/photo-1487180144351-b8472da7d491', TRUE),
('Happier Than Ever', 298, 5, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', 'https://images.unsplash.com/photo-1487180144351-b8472da7d491', FALSE),
('Levitating', 203, 6, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81', FALSE),
('Don''t Start Now', 183, 6, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81', FALSE);

-- SONG_ARTISTS
INSERT INTO song_artists (song_id, artist_id, is_primary) VALUES
(1, 1, TRUE),
(2, 1, TRUE),
(3, 2, TRUE),
(4, 2, TRUE),
(5, 3, TRUE),
(6, 3, TRUE),
(7, 4, TRUE),
(8, 4, TRUE),
(9, 5, TRUE),
(10, 5, TRUE),
(11, 6, TRUE),
(12, 6, TRUE);

-- PLAYLISTS
INSERT INTO playlists (name, description, user_id) VALUES
('My Favorites', 'My personal favorite songs.', 1),
('Chill Music', 'Relax and unwind.', 2),
('Top Hits', 'Trending songs right now.', 3),
('Workout Mix', 'Songs for the gym.', 4),
('Pop Essentials', 'Must-have pop tracks.', 5),
('Late Night', 'Late night mood songs.', 6);

-- PLAYLIST_SONGS
INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES
(1, 1, 1),
(1, 3, 2),
(1, 5, 3),
(2, 4, 1),
(2, 6, 2),
(3, 2, 1),
(3, 5, 2),
(4, 7, 1),
(4, 9, 2),
(5, 11, 1),
(5, 12, 2),
(6, 8, 1),
(6, 10, 2);

-- GENRES
INSERT INTO genres (name) VALUES
('Pop'),
('Hip-Hop'),
('R&B'),
('Dance'),
('Electronic');

-- SONG_GENRES
INSERT INTO song_genres (song_id, genre_id) VALUES
(1, 2),
(2, 2),
(3, 1),
(4, 1),
(5, 3),
(6, 3),
(7, 1),
(7, 4),
(9, 2),
(11, 1),
(12, 4);

-- ARTIST_FOLLOWERS
INSERT INTO artist_followers (user_id, artist_id) VALUES
(1, 1),
(1, 3),
(2, 2),
(3, 1),
(4, 6),
(5, 4),
(6, 5);

-- LIKED SONGS
INSERT INTO liked_songs (user_id, song_id) VALUES
(1, 1),
(1, 5),
(2, 3),
(3, 7),
(4, 9),
(5, 11),
(6, 10);

-- LISTENING HISTORY
INSERT INTO listening_history (user_id, song_id, source) VALUES
(1, 1, 'playlist'),
(1, 5, 'search'),
(2, 3, 'album'),
(3, 7, 'artist'),
(4, 9, 'home'),
(5, 11, 'playlist'),
(6, 10, 'search');