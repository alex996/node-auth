import "express-async-errors";
import express from "express";

const app = express();

app.get("/", (req, res) => res.json("test"));

app.listen(3000, () => console.log("http://localhost:3000"));
