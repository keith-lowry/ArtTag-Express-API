import express from "express";
import config from './config.json';
const app = express();
const port = 3000;

// art-tag route for 

app.get("/api/help", (req, res) => {
    res.send("Help! me!");
})

app.use("/images", express.static("public"))

app.listen(port, () => {
    console.log(`API: listening on port ${port}`);
    // console.log(config["postgres"]);
})