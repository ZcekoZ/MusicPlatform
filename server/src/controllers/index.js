
const axios=require("axios");
exports.search=async(req,res)=>{
 const r=await axios.get("https://api.deezer.com/search?q="+req.query.q);
 res.json(r.data.data.map(x=>({
  title:x.title,artist:x.artist.name,preview:x.preview,cover:x.album.cover_medium
 })));
};
