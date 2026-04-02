
let currentAudio = new Audio();

async function search() {
  const q = document.getElementById('search').value;
  const res = await fetch(`/api/deezer/search?q=${q}`);
  const data = await res.json();

  const list = document.getElementById('results');
  list.innerHTML = '';

  data.forEach(track => {
    const div = document.createElement('div');
    div.innerHTML = `
      ${track.title} - ${track.artist.name}
      <button onclick="play('${track.preview}')">Play</button>
      <button onclick="like(${track.id})">❤️</button>
    `;
    list.appendChild(div);
  });
}

function play(url) {
  currentAudio.src = url;
  currentAudio.play();
}

async function like(id) {
  await fetch('/api/likes/' + id, { method: 'POST' });
  alert('Liked!');
}
