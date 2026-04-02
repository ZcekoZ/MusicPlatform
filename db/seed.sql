INSERT INTO users (username, display_name, email, password_hash) VALUES
('ivan123', 'Ivan', 'ivan@mail.com', 'scrypt$8394d791869bc97c502ebad5e427ba13$734649ed2af0e77b9971f73ee6bc5cbea75ccac5a52fe6b1501112657e1fd803e8183c112d7710693f74482f496ed691064a0da90f59da7bd401474e7a7e829a'),
('maria_music', 'Maria', 'maria@mail.com', 'scrypt$95a2737dca5555f8d7c19a17ff6f8fc5$a5fffe0f21a45bdd6b1c8a748f015ce957546c8254997ab5ccac13dd25d349659185d8fa6a2b650a873b491e8e21af0bf2af49bdb091750ec308e04ccaa1186e'),
('geo_sound', 'Geo', 'geo@mail.com', 'scrypt$28c844639f3e7f7bf96f374cfe118a2e$791c1d3141a102dc10ee8fdc742a063c0fbd122a378f834a44c3efaebc0edb4da2e6d925d723a1971e3cb1280dbf5606866c82b5ebf0299b961ff8f7999de7bb'),
('niki_beats', 'Niki', 'niki@mail.com', 'scrypt$0d2192e2acf1eb8c5de891d4a070c148$95d7336e3b92a3341f0fb19d21b2ecc9098afffbe480330109466acd6629cab0c30bbc838cfb425d8e6b3706a5b0eb9d6872d106ba58507f92e6d37142dd1694'),
('alex_pop', 'Alex', 'alex@mail.com', 'scrypt$be505d68e3263e030d221832bdc4ee79$3b114fd899c1f94d8bbe55644657ce1037837059ef32c85cfd399b2d443005aab5683a4ac6a4da4a17fc5c6d2bf3ab88c4b299927442577be2effddef91fb3dc'),
('desi_vibes', 'Desi', 'desi@mail.com', 'scrypt$9d0134ace7d9f5254582790ec54a775c$2d06f423f5f79ae40ac7b95fbb7ea62ddb08d84b83a7116866a6312bca4ac32988512f94156b7ce337da5856a0dc1a5c9d6a7542ed1c8fa26c852f89e80a215f');

INSERT INTO artists (name, country, image_url, bio, monthly_listeners) VALUES
('Drake', 'Canada', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f', 'Canadian rapper and singer.', 52000000),
('Adele', 'UK', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a', 'Award-winning British singer.', 43000000),
('The Weeknd', 'Canada', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'R&B superstar.', 61000000),
('Ed Sheeran', 'UK', 'https://images.unsplash.com/photo-1504593811423-6dd665756598', 'Singer-songwriter from the UK.', 48000000),
('Billie Eilish', 'USA', 'https://images.unsplash.com/photo-1487180144351-b8472da7d491', 'Pop artist known for unique style.', 39000000),
('Dua Lipa', 'UK', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81', 'British-Albanian pop singer.', 45000000);

INSERT INTO albums (title, release_date, artist_id, cover_url) VALUES
('Scorpion', '2018-06-29', 1, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f'),
('25', '2015-11-20', 2, 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a'),
('After Hours', '2020-03-20', 3, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'),
('Divide', '2017-03-03', 4, 'https://images.unsplash.com/photo-1504593811423-6dd665756598'),
('Happier Than Ever', '2021-07-30', 5, 'https://images.unsplash.com/photo-1487180144351-b8472da7d491'),
('Future Nostalgia', '2020-03-27', 6, 'https://images.unsplash.com/photo-1516280440614-37939bbacd81');

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

INSERT INTO playlists (name, description, user_id) VALUES
('My Favorites', 'My personal favorite songs.', 1),
('Chill Music', 'Relax and unwind.', 2),
('Top Hits', 'Trending songs right now.', 3),
('Workout Mix', 'Songs for the gym.', 4),
('Pop Essentials', 'Must-have pop tracks.', 5),
('Late Night', 'Late night mood songs.', 6);

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

INSERT INTO genres (name) VALUES
('Pop'),
('Hip-Hop'),
('R&B'),
('Dance'),
('Electronic');

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

INSERT INTO artist_followers (user_id, artist_id) VALUES
(1, 1),
(1, 3),
(2, 2),
(3, 1),
(4, 6),
(5, 4),
(6, 5);

INSERT INTO liked_songs (user_id, song_id) VALUES
(1, 1),
(1, 5),
(2, 3),
(3, 7),
(4, 9),
(5, 11),
(6, 10);

INSERT INTO listening_history (user_id, song_id, source) VALUES
(1, 1, 'playlist'),
(1, 5, 'search'),
(2, 3, 'album'),
(3, 7, 'artist'),
(4, 9, 'home'),
(5, 11, 'playlist'),
(6, 10, 'search');
