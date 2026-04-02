const state = {
  view: "home",
  songs: [],
  likes: [],
  playlists: [],
  artists: [],
  currentArtist: null,
  currentPlaylist: null,
  searchQuery: "",
  searchMode: "library",
  searchResults: []
};

const els = {
  content: document.getElementById("view-content"),
  title: document.getElementById("view-title"),
  status: document.getElementById("status"),
  player: document.getElementById("player"),
  nowPlayingTitle: document.getElementById("now-playing-title"),
  nowPlayingMeta: document.getElementById("now-playing-meta"),
  nowPlayingCover: document.getElementById("now-playing-cover"),
  navButtons: Array.from(document.querySelectorAll(".nav-btn")),
  playlistForm: document.getElementById("playlist-form"),
  playlistName: document.getElementById("playlist-name"),
  playlistDescription: document.getElementById("playlist-description"),
  search: document.getElementById("global-search")
};

function setStatus(message) {
  els.status.textContent = message;
}

function formatDuration(seconds) {
  const mins = Math.floor(Number(seconds || 0) / 60);
  const secs = Number(seconds || 0) % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function syncNav() {
  els.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function trackDataset(song) {
  return `
    data-song-id="${song.song_id || ""}"
    data-deezer-id="${song.deezer_id || song.deezer_track_id || ""}"
    data-title="${escapeHtml(song.title)}"
    data-artist-name="${escapeHtml(song.artist_name || "Unknown artist")}"
    data-deezer-artist-id="${song.deezer_artist_id || ""}"
    data-album-title="${escapeHtml(song.album_title || "")}" 
    data-deezer-album-id="${song.deezer_album_id || ""}"
    data-duration-seconds="${song.duration_seconds || 30}"
    data-plays-count="${song.plays_count || 0}"
    data-explicit="${song.explicit ? "1" : "0"}"
    data-cover-url="${escapeHtml(song.cover_url || song.album_cover || "")}" 
    data-preview-url="${escapeHtml(song.preview_url || song.audio_url || "")}"
    data-deezer-link="${escapeHtml(song.deezer_link || "")}" 
    data-imported="${song.song_id ? "1" : "0"}"
  `;
}

function songCard(song, options = {}) {
  const playlistOptions = state.playlists.length
    ? state.playlists.map((playlist) => `<option value="${playlist.playlist_id}">${escapeHtml(playlist.name)}</option>`).join("")
    : "";

  const imported = Boolean(song.song_id);
  const likeButton = `
    <button
      class="icon-btn ${song.liked ? "liked" : ""}"
      data-action="toggle-like"
      ${trackDataset(song)}
      data-liked="${song.liked ? "1" : "0"}"
      aria-label="${song.liked ? "Unlike" : imported ? "Like" : "Save and like"} ${escapeHtml(song.title)}"
      title="${song.liked ? "Unlike" : imported ? "Like" : "Save and like"}"
    >
      <i data-lucide="heart"></i>
    </button>
  `;

  return `
    <article class="song-card">
      <img src="${escapeHtml(song.cover_url || song.album_cover || "https://via.placeholder.com/200x200?text=Music")}" alt="${escapeHtml(song.title)}">
      <div class="song-meta">
        <h3>${escapeHtml(song.title)}</h3>
        <p>${escapeHtml(song.artist_name || "Unknown artist")}${song.album_title ? ` • ${escapeHtml(song.album_title)}` : ""}</p>
        <div class="badge-row">
          <span class="badge">${formatDuration(song.duration_seconds)}</span>
          <span class="badge">${formatNumber(song.plays_count)} plays</span>
          ${song.explicit ? '<span class="badge">Explicit</span>' : ""}
          ${song.source === "deezer" ? `<span class="badge">${imported ? "Saved to library" : "Deezer result"}</span>` : ""}
        </div>
      </div>
      <div class="song-actions">
        <button class="primary-btn" data-action="play-song" ${trackDataset(song)} data-source="${escapeHtml(options.source || state.view)}">Play preview</button>
        ${likeButton}
        ${song.artist_id ? `<button data-action="open-artist" data-artist-id="${song.artist_id}">Artist page</button>` : `<button data-action="save-and-open-artist" ${trackDataset(song)}>Save artist page</button>`}
        ${song.song_id ? "" : `<button data-action="import-track" ${trackDataset(song)}>Save to library</button>`}
        ${state.playlists.length ? `
          <select data-action="playlist-select" ${trackDataset(song)}>
            <option value="">${song.song_id ? "Add to playlist…" : "Save + add to playlist…"}</option>
            ${playlistOptions}
          </select>
        ` : ""}
        ${options.removableFromPlaylist ? `<button class="danger" data-action="remove-from-playlist" data-playlist-id="${options.removableFromPlaylist}" data-song-id="${song.song_id}">Remove</button>` : ""}
      </div>
    </article>
  `;
}

function renderHome() {
  const showingSearch = Boolean(state.searchQuery);
  els.title.textContent = showingSearch ? `Search: ${state.searchQuery}` : "Browse songs";

  const librarySection = showingSearch
    ? `
      <section class="panel">
        <p class="eyebrow">Library matches</p>
        <p class="search-results-note muted">These are songs already stored in your Postgres database.</p>
        ${state.songs.length ? `<div class="song-list">${state.songs.map((song) => songCard(song, { source: "home" })).join("")}</div>` : emptyState("No matching songs in the local library.")}
      </section>
      <section class="panel">
        <p class="eyebrow">Deezer results</p>
        <p class="search-results-note muted">Search results can now be saved directly into your database, then liked and added to playlists persistently.</p>
        ${state.searchResults.length ? `<div class="song-list">${state.searchResults.map((song) => songCard(song, { source: "search" })).join("")}</div>` : emptyState("No Deezer preview results found.")}
      </section>
    `
    : `
      <section class="stats-grid">
        <div class="stat-card"><p class="eyebrow">Songs</p><h3>${state.songs.length}</h3><p class="muted">Stored in PostgreSQL and playable with Deezer previews.</p></div>
        <div class="stat-card"><p class="eyebrow">Liked songs</p><h3>${state.likes.length}</h3><p class="muted">Saved by the demo user.</p></div>
        <div class="stat-card"><p class="eyebrow">Playlists</p><h3>${state.playlists.length}</h3><p class="muted">Personal collections.</p></div>
        <div class="stat-card"><p class="eyebrow">Artists</p><h3>${state.artists.length}</h3><p class="muted">Dedicated artist pages.</p></div>
      </section>
      <section class="panel">
        <p class="eyebrow">Library</p>
        <h3>All songs</h3>
        <div class="song-list">
          ${state.songs.map((song) => songCard(song, { source: "home" })).join("")}
        </div>
      </section>
    `;

  els.content.innerHTML = librarySection;
}

function renderLikes() {
  els.title.textContent = "Liked songs";
  els.content.innerHTML = state.likes.length
    ? `<section class="panel"><div class="song-list">${state.likes.map((song) => songCard(song, { source: "likes" })).join("")}</div></section>`
    : emptyState("No liked songs yet. Tap the heart on a track to save it here.");
}

function renderPlaylists() {
  els.title.textContent = state.currentPlaylist ? state.currentPlaylist.name : "Playlists";

  if (state.currentPlaylist) {
    const playlist = state.currentPlaylist;
    els.content.innerHTML = `
      <section class="detail-panel">
        <div class="detail-header">
          <img src="${escapeHtml(playlist.songs[0]?.cover_url || "https://via.placeholder.com/300x300?text=Playlist")}" alt="${escapeHtml(playlist.name)}">
          <div>
            <p class="eyebrow">Playlist</p>
            <h3>${escapeHtml(playlist.name)}</h3>
            <p class="muted">${escapeHtml(playlist.description || "No description yet.")}</p>
            <div class="badge-row">
              <span class="badge">${playlist.songs.length} songs</span>
            </div>
            <div class="actions">
              <button class="inline-btn" data-action="back-to-playlists">Back to playlists</button>
            </div>
          </div>
        </div>
        ${playlist.songs.length ? `<div class="song-list">${playlist.songs.map((song) => songCard(song, { source: "playlist", removableFromPlaylist: playlist.playlist_id })).join("")}</div>` : emptyState("This playlist is empty. Add songs from Home or Artist pages.")}
      </section>
    `;
    return;
  }

  els.content.innerHTML = state.playlists.length
    ? `<section class="playlist-grid">${state.playlists.map((playlist) => `
        <article class="playlist-card">
          <img src="${escapeHtml(playlist.cover_url || "https://via.placeholder.com/500x500?text=Playlist")}" alt="${escapeHtml(playlist.name)}">
          <p class="eyebrow">Playlist</p>
          <h3>${escapeHtml(playlist.name)}</h3>
          <p class="muted">${escapeHtml(playlist.description || "No description")}</p>
          <div class="badge-row">
            <span class="badge">${playlist.songs_count} songs</span>
            <span class="badge">${formatDuration(playlist.total_duration_seconds || 0)}</span>
          </div>
          <button data-action="open-playlist" data-playlist-id="${playlist.playlist_id}">Open playlist</button>
        </article>
      `).join("")}</section>`
    : emptyState("You do not have any playlists yet. Create one from the sidebar.");
}

function renderArtists() {
  els.title.textContent = state.currentArtist ? state.currentArtist.name : "Artists";

  if (state.currentArtist) {
    const artist = state.currentArtist;
    els.content.innerHTML = `
      <section class="detail-panel">
        <div class="detail-header">
          <img src="${escapeHtml(artist.image_url || "https://via.placeholder.com/400x400?text=Artist")}" alt="${escapeHtml(artist.name)}">
          <div>
            <p class="eyebrow">Artist</p>
            <h3>${escapeHtml(artist.name)}</h3>
            <p class="muted">${escapeHtml(artist.bio || "No bio available.")}</p>
            <div class="badge-row">
              <span class="badge">${escapeHtml(artist.country || "Unknown country")}</span>
              <span class="badge">${formatNumber(artist.monthly_listeners)} monthly listeners</span>
              <span class="badge">${formatNumber(artist.followers_count)} followers</span>
            </div>
            <div class="actions">
              <button class="inline-btn" data-action="back-to-artists">Back to artists</button>
            </div>
          </div>
        </div>
        <div class="song-list">
          ${artist.songs.map((song) => songCard({ ...song, artist_name: artist.name, artist_id: artist.artist_id }, { source: "artist" })).join("")}
        </div>
      </section>
    `;
    return;
  }

  els.content.innerHTML = state.artists.length
    ? `<section class="artist-grid">${state.artists.map((artist) => `
        <article class="artist-card">
          <img src="${escapeHtml(artist.image_url || "https://via.placeholder.com/500x500?text=Artist")}" alt="${escapeHtml(artist.name)}">
          <p class="eyebrow">Artist</p>
          <h3>${escapeHtml(artist.name)}</h3>
          <p class="muted">${escapeHtml(artist.bio || "No bio available.")}</p>
          <div class="badge-row">
            <span class="badge">${formatNumber(artist.monthly_listeners)} monthly listeners</span>
            <span class="badge">${artist.songs_count} songs</span>
          </div>
          <button data-action="open-artist" data-artist-id="${artist.artist_id}">Open artist page</button>
        </article>
      `).join("")}</section>`
    : emptyState("No artists available.");
}

function renderView() {
  syncNav();
  if (state.view === "home") renderHome();
  if (state.view === "likes") renderLikes();
  if (state.view === "playlists") renderPlaylists();
  if (state.view === "artists") renderArtists();
  renderIcons();
}

function mergeSongLike(songId, liked) {
  state.songs = state.songs.map((song) => song.song_id === songId ? { ...song, liked } : song);
  state.searchResults = state.searchResults.map((song) => song.song_id === songId ? { ...song, liked, imported: true } : song);
  if (state.currentArtist) {
    state.currentArtist.songs = state.currentArtist.songs.map((song) => song.song_id === songId ? { ...song, liked } : song);
  }
  if (state.currentPlaylist) {
    state.currentPlaylist.songs = state.currentPlaylist.songs.map((song) => song.song_id === songId ? { ...song, liked } : song);
  }
}

function mergeImportedSong(importedSong, trackDeezerId) {
  state.songs = state.songs.some((song) => Number(song.song_id) === Number(importedSong.song_id))
    ? state.songs.map((song) => Number(song.song_id) === Number(importedSong.song_id) ? { ...song, ...importedSong } : song)
    : [importedSong, ...state.songs];

  state.searchResults = state.searchResults.map((song) => {
    const sameTrack = Number(song.deezer_id || song.deezer_track_id || 0) === Number(trackDeezerId || importedSong.deezer_track_id || 0);
    return sameTrack ? { ...song, ...importedSong, source: "deezer", imported: true, deezer_id: song.deezer_id || importedSong.deezer_track_id } : song;
  });
}

function trackFromElement(element) {
  return {
    song_id: element.dataset.songId ? Number(element.dataset.songId) : null,
    deezer_id: element.dataset.deezerId ? Number(element.dataset.deezerId) : null,
    title: element.dataset.title || "",
    artist_name: element.dataset.artistName || "Unknown artist",
    deezer_artist_id: element.dataset.deezerArtistId ? Number(element.dataset.deezerArtistId) : null,
    album_title: element.dataset.albumTitle || null,
    deezer_album_id: element.dataset.deezerAlbumId ? Number(element.dataset.deezerAlbumId) : null,
    duration_seconds: element.dataset.durationSeconds ? Number(element.dataset.durationSeconds) : 30,
    plays_count: element.dataset.playsCount ? Number(element.dataset.playsCount) : 0,
    explicit: element.dataset.explicit === "1",
    cover_url: element.dataset.coverUrl || null,
    preview_url: element.dataset.previewUrl || null,
    deezer_link: element.dataset.deezerLink || null
  };
}

async function ensureImportedFromElement(element) {
  const track = trackFromElement(element);
  if (track.song_id) {
    return track.song_id;
  }

  setStatus("Saving song to library…");
  const importedSong = await importTrack(track);
  mergeImportedSong(importedSong, track.deezer_id);
  return importedSong.song_id;
}

async function refreshData() {
  const [songs, likes, playlists, artists] = await Promise.all([
    getSongs(state.searchMode === "library" ? state.searchQuery : ""),
    getLikes(),
    getPlaylists(),
    getArtists()
  ]);

  state.songs = songs;
  state.likes = likes.map((song) => ({ ...song, liked: true }));
  state.playlists = playlists;
  state.artists = artists;
}

async function runSearch(query) {
  state.searchQuery = query.trim();
  state.currentArtist = null;
  state.currentPlaylist = null;
  state.view = "home";

  try {
    setStatus(state.searchQuery ? "Searching…" : "Loading library…");
    if (state.searchQuery) {
      const [librarySongs, deezerResults] = await Promise.all([
        getSongs(state.searchQuery),
        searchTracks(state.searchQuery)
      ]);
      state.songs = librarySongs;
      state.searchResults = deezerResults;
    } else {
      state.searchResults = [];
      await refreshData();
    }
    renderView();
    setStatus("Ready");
  } catch (error) {
    setStatus(error.message);
  }
}

async function init() {
  try {
    setStatus("Loading library…");
    await refreshData();
    renderView();
    setStatus("Ready");
  } catch (error) {
    setStatus(error.message);
    els.content.innerHTML = emptyState(error.message);
  }
}

async function playSongFromPreviewData(target) {
  const previewUrl = target.dataset.previewUrl;
  if (!previewUrl) {
    throw new Error("No preview available for this result.");
  }

  els.player.src = previewUrl;
  await els.player.play();
  els.nowPlayingTitle.textContent = target.dataset.title || "Unknown title";
  els.nowPlayingMeta.textContent = `${target.dataset.artistName || "Unknown artist"} • 30 second preview`;
  if (target.dataset.coverUrl) {
    els.nowPlayingCover.src = target.dataset.coverUrl;
    els.nowPlayingCover.classList.remove("hidden");
  }
  setStatus("Playing preview");
}

async function playSong(songId, source, target) {
  try {
    setStatus("Loading preview…");

    if (!songId && target?.dataset.previewUrl) {
      return await playSongFromPreviewData(target);
    }

    const preview = await getSongPreview(songId);
    if (!preview.preview_url) {
      throw new Error("No preview available for this song.");
    }

    els.player.src = preview.preview_url;
    await els.player.play();
    els.nowPlayingTitle.textContent = preview.title;
    els.nowPlayingMeta.textContent = `${preview.artist_name || "Unknown artist"} • 30 second preview`;
    if (preview.album_cover) {
      els.nowPlayingCover.src = preview.album_cover;
      els.nowPlayingCover.classList.remove("hidden");
    }
    await registerListen(songId, source || state.view);
    setStatus("Playing preview");
  } catch (error) {
    setStatus(error.message);
  }
}

async function toggleLikeFromElement(element) {
  try {
    const liked = element.dataset.liked === "1";
    const songId = await ensureImportedFromElement(element);
    setStatus(liked ? "Removing like…" : "Saving like…");
    if (liked) {
      await unlikeSong(songId);
    } else {
      await likeSong(songId);
    }
    mergeSongLike(songId, !liked);
    state.likes = (await getLikes()).map((song) => ({ ...song, liked: true }));
    renderView();
    setStatus("Saved");
  } catch (error) {
    setStatus(error.message);
  }
}

async function openArtist(artistId) {
  try {
    setStatus("Loading artist…");
    state.currentArtist = await getArtist(artistId);
    state.view = "artists";
    renderView();
    setStatus("Ready");
  } catch (error) {
    setStatus(error.message);
  }
}

async function openPlaylist(playlistId) {
  try {
    setStatus("Loading playlist…");
    state.currentPlaylist = await getPlaylist(playlistId);
    state.view = "playlists";
    renderView();
    setStatus("Ready");
  } catch (error) {
    setStatus(error.message);
  }
}

async function addSelectedSongToPlaylistFromElement(element, playlistId) {
  if (!playlistId) return;
  try {
    const songId = await ensureImportedFromElement(element);
    setStatus("Adding to playlist…");
    await addSongToPlaylist(playlistId, songId);
    state.playlists = await getPlaylists();
    if (state.currentPlaylist && Number(state.currentPlaylist.playlist_id) === Number(playlistId)) {
      state.currentPlaylist = await getPlaylist(playlistId);
    }
    renderView();
    setStatus("Song added to playlist");
  } catch (error) {
    setStatus(error.message);
  }
}

async function removeFromPlaylist(playlistId, songId) {
  try {
    setStatus("Removing song…");
    await removeSongFromPlaylist(playlistId, songId);
    state.playlists = await getPlaylists();
    state.currentPlaylist = await getPlaylist(playlistId);
    renderView();
    setStatus("Song removed");
  } catch (error) {
    setStatus(error.message);
  }
}

async function saveTrackFromElement(element) {
  try {
    await ensureImportedFromElement(element);
    state.artists = await getArtists();
    renderView();
    setStatus("Saved to library");
  } catch (error) {
    setStatus(error.message);
  }
}

async function saveAndOpenArtistFromElement(element) {
  try {
    const songId = await ensureImportedFromElement(element);
    const importedSong = state.songs.find((song) => Number(song.song_id) === Number(songId));
    state.artists = await getArtists();
    renderView();
    if (importedSong?.artist_id) {
      await openArtist(importedSong.artist_id);
    } else {
      setStatus("Artist was saved, but the artist page is not available yet.");
    }
  } catch (error) {
    setStatus(error.message);
  }
}

els.navButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    state.view = button.dataset.view;
    state.currentArtist = null;
    state.currentPlaylist = null;
    renderView();
    setStatus("Ready");
  });
});

els.search.addEventListener("input", async (event) => {
  await runSearch(event.target.value);
});

els.playlistForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus("Creating playlist…");
    await createPlaylist({
      name: els.playlistName.value,
      description: els.playlistDescription.value
    });
    els.playlistForm.reset();
    state.playlists = await getPlaylists();
    if (state.view === "playlists" || state.view === "home") {
      renderView();
    }
    setStatus("Playlist created");
  } catch (error) {
    setStatus(error.message);
  }
});

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  if (action === "play-song") return playSong(target.dataset.songId, target.dataset.source, target);
  if (action === "toggle-like") return toggleLikeFromElement(target);
  if (action === "open-artist") return openArtist(target.dataset.artistId);
  if (action === "save-and-open-artist") return saveAndOpenArtistFromElement(target);
  if (action === "import-track") return saveTrackFromElement(target);
  if (action === "open-playlist") return openPlaylist(target.dataset.playlistId);
  if (action === "back-to-artists") {
    state.currentArtist = null;
    renderView();
    return;
  }
  if (action === "back-to-playlists") {
    state.currentPlaylist = null;
    renderView();
    return;
  }
  if (action === "remove-from-playlist") return removeFromPlaylist(target.dataset.playlistId, target.dataset.songId);
});

document.addEventListener("change", (event) => {
  const select = event.target.closest("select[data-action='playlist-select']");
  if (!select) return;
  addSelectedSongToPlaylistFromElement(select, select.value);
  select.value = "";
});

init();
