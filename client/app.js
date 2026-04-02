
const API="http://localhost:5000/api";

async function load(){
  const r=await fetch(API+"/songs");
  const d=await r.json();
  const div=document.getElementById("songs");
  div.innerHTML="";
  d.forEach(s=>{
    div.innerHTML+=`
    <div>
    ${s.title}
    <button onclick="play('${s.audio_url}')">Play</button>
    <button onclick="like(${s.song_id})">Like</button>
    </div>`;
  });
}

function play(u){
  const p=document.getElementById("p");
  p.src=u;
  p.play();
}

async function like(id){
  await fetch(API+"/songs/"+id+"/like",{method:"POST"});
}

async function search(){
  const q=document.getElementById("q").value;
  const r=await fetch(API+"/search?q="+q);
  const d=await r.json();
  const div=document.getElementById("res");
  div.innerHTML="";
  d.forEach(s=>{
    div.innerHTML+=`
    <div>
    ${s.title} - ${s.artist}
    <button onclick="play('${s.preview}')">Play</button>
    <button onclick="save('${s.title}','${s.artist}','${s.preview}','${s.cover}')">Save</button>
    </div>`;
  });
}

async function save(t,a,u,c){
  await fetch(API+"/songs/save",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({title:t,artist:a,audio_url:u,cover_url:c})
  });
  load();
}

load();
