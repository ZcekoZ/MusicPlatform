
(async function() {
  const songs = await getSongs();
  const container = document.getElementById("songs");
  const player = document.getElementById("player");

  songs.forEach(s => {
    const div = document.createElement("div");
    div.className = "song";
    div.innerHTML = `<b>${s.title}</b> <button>Play</button>`;
    div.querySelector("button").onclick = () => {
      player.src = s.audio_url || "";
      player.play();
    };
    container.appendChild(div);
  });
})();
