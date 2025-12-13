require("dotenv").config({ path: "./.env" });

const express=require("express");

const cors=require("cors");
const connectDB=require("./db/mongo");
const chatRoutes=require("./routes/chat");
const documentRoutes = require("./routes/documents");

const app=express();

app.use(cors());
app.use(express.json());

app.use("/public", express.static("public"));


connectDB();

app.use("/api/chat",chatRoutes);
app.use("/api/documents", documentRoutes);
app.use("/public", express.static("public"));


app.get("/health",(req,res)=>{
    res.status(200).json({status:"ok"});
});

const PORT=process.env.PORT || 3000;

app.listen(PORT, () =>{
    console.log(`Server running on PORT ${PORT}`);
})