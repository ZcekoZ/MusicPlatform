
const API_BASE = "http://localhost:5000/api";

async function getSongs() {
  const res = await fetch(API_BASE + "/songs");
  return await res.json();
}
