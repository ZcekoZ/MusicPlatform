
const express=require("express");
const cors=require("cors");
require("dotenv").config();
const app=express();
app.use(cors());
app.use(express.json());
app.get("/",(req,res)=>res.json({ok:true}));
app.use("/api",require("./routes"));
app.listen(process.env.PORT||5000);
