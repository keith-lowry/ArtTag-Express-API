import express from "express";
import config from './config.json';
const app = express();
const port = 3000;


app.get("/", (req, res) => {
    res.send("Hello world!");
})

app.listen(port, () => {
    console.log(`API: listening on port ${port}`);
    console.log(config["postgres"]);
})