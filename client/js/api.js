
const API_BASE = "https://musicplatformserver.onrender.com/api";

async function getSongs() {
  const res = await fetch(API_BASE + "/songs");
  return await res.json();
}
