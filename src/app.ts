import express from "express";
import config from './config.json';
const app = express();
const port = 3000;

// app.get("/api/help", (req, res) => {
//     res.send("Help! me!");
// })

// app.get("/api/tags") // list of tags and ids
// app.get("/api/tags/{id}/images") // list of image urls with given tag
// app.post("/api/tags") // add a new tag
// app.post("/api/images") // add a new image with tag
// app.get("/api/images?tags=tag1;tag2;tag3") // name
// app.post("/api/")

app.get("/tags")
app.post("/tags")

app.get("/images", (req, res) => {
    res.send("TODO: GET images endpoint");
    // get filenames of images with provided tags
    // user can provide list of tags as query param or in body
})

// TODO: do not need to suport both put and post; decide architecture!!!!
app.post("/images", (req, res) => {
    res.send("TODO: POST images endpoint")
})

app.put("/images", (req, res) => {
    res.send("TODO: PUT images endpoint")
    // update image that is already in store, add tags
})

// TODO: lock POST/PUT/DELETE access behind token

app.get("/images/similar", (req, res) => {
    res.send("TODO: GET similar endpoint");
    // get filenames of images within certain hamming distance of provided image url
    // default: very very close distance (<= 2) to find duplicates
    // user can provide max distance as query param or in body
})

// serve
app.use("/images", express.static("public"))

app.listen(port, () => {
    console.log(`API: listening on port ${port}`);
    // console.log(config["postgres"]);
})