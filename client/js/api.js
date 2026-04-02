const API_BASE = window.API_BASE || "https://musicplatformserver.onrender.com/api";
const TOKEN_KEY = "musicify_session_token";

function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

function setAuthToken(token) {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(API_BASE + path, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.error || payload.message || message;
    } catch (error) {
      // ignore parsing failure
    }

    if (response.status === 401) {
      clearAuthToken();
    }

    throw new Error(message);
  }

  return response.json();
}

function loginUser(body) {
  return request("/auth/login", { method: "POST", body: JSON.stringify(body) });
}

function registerUser(body) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(body) });
}

function getCurrentUser() {
  return request("/auth/me");
}

function logoutUser() {
  return request("/auth/logout", { method: "POST" });
}

function getSongs(query = "") {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  return request(`/songs${suffix}`);
}

function searchTracks(query) {
  return request(`/search?q=${encodeURIComponent(query)}`);
}

function importTrack(track) {
  return request("/import-track", {
    method: "POST",
    body: JSON.stringify(track)
  });
}

function getSongPreview(songId) {
  return request(`/songs/${songId}/preview`);
}

function getArtists() {
  return request("/artists");
}

function getArtist(artistId) {
  return request(`/artists/${artistId}`);
}

function getLikes() {
  return request("/likes");
}

function likeSong(songId) {
  return request(`/likes/${songId}`, { method: "POST" });
}

function unlikeSong(songId) {
  return request(`/likes/${songId}`, { method: "DELETE" });
}

function getPlaylists() {
  return request("/playlists");
}

function getPlaylist(playlistId) {
  return request(`/playlists/${playlistId}`);
}

function createPlaylist(body) {
  return request("/playlists", { method: "POST", body: JSON.stringify(body) });
}

function addSongToPlaylist(playlistId, songId) {
  return request(`/playlists/${playlistId}/songs`, {
    method: "POST",
    body: JSON.stringify({ songId })
  });
}

function removeSongFromPlaylist(playlistId, songId) {
  return request(`/playlists/${playlistId}/songs/${songId}`, { method: "DELETE" });
}

function registerListen(songId, source) {
  return request(`/listens/${songId}`, {
    method: "POST",
    body: JSON.stringify({ source })
  });
}
