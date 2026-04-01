
const API="http://localhost:5000/api";
let queue=[],index=0;

async function search(){
 const q=document.getElementById("q").value;
 const r=await fetch(API+"/search?q="+q);
 const d=await r.json();
 queue=d; index=0;
 render(d);
}

function render(d){
 const g=document.getElementById("grid");
 g.innerHTML="";
 d.forEach((s,i)=>{
  g.innerHTML+=`
   <div class="card">
   <img src="${s.cover}" width="100%">
   <b>${s.title}</b><br>${s.artist}<br>
   <button onclick="playIndex(${i})">Play</button>
   </div>`;
 });
}

function playIndex(i){
 index=i;
 play(queue[i]);
}

function play(s){
 const a=document.getElementById("audio");
 document.getElementById("cover").src=s.cover;
 document.getElementById("info").innerText=s.title+" - "+s.artist;
 a.src=s.preview;
 a.play();
}

function toggle(){
 const a=document.getElementById("audio");
 if(a.paused)a.play();else a.pause();
}

function next(){
 if(index<queue.length-1)playIndex(index+1);
}

function prev(){
 if(index>0)playIndex(index-1);
}
