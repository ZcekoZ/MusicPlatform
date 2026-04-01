
const r=require("express").Router();
const c=require("../controllers");
r.get("/search",c.search);
module.exports=r;
