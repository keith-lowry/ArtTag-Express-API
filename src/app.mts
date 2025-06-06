import express from "express";
import { repo } from "./db/repository.mjs";
// import { isValidArtistName, isValidTagName } from "./types.mjs";
import multer from "multer";
import bodyParser from "body-parser";
import { query, body, validationResult } from "express-validator";
import validators from "./validators.mjs";
import config from "../config.json" with { type: 'json' };

// TODO: use proper express error handling
// https://expressjs.com/en/guide/error-handling.html


const app = express();
const port = 3000;

const imageStorage = multer.memoryStorage()
const imageUpload = multer({storage : imageStorage, limits : {
    fileSize: config.maxFileSizeMB * 1000000,
    files: 1
}})

app.use(bodyParser.json())


app.get("/tags/list", validators.epoch("created_after"), async (req, res) => {
    try {
        if (req.query?.created_after) {
            const result = validationResult(req)

            // created_after query value is ok
            if (result.isEmpty()){
                const epoch:number = req.query.created_after
                const data = await repo.getTagsCreatedAfter(epoch)
                res.send(data)
                return
            }
            
            // query value not ok: bad request
            console.log(result)
            res.statusCode = 400;
            res.send(result)
            return
        }
        const data = await repo.getTags()
        res.send(data)
    }
    catch (error) {
        res.statusCode = 500
        res.send("Something went wrong");
        console.error("[ERROR] /tags/list:",error);
    }
})

app.put("/tags/create", validators.taglist("tags"),async (req, res) => {
    try {
        const result = validationResult(req);

        // tag name failed validation or does not exist
        if (!result.isEmpty()) {
            console.log(result)
            res.statusCode = 400;
            res.send(result)
            return
        }
        await repo.insertTags(req.body.tags)
        res.status(200).send()
    }
    catch (error) {
        res.statusCode = 500
        res.send("Something went wrong");
        console.error("[ERROR] /tags/create:", error)
    }
})

app.get("/artists/list", validators.epoch("created_after"), async (req, res) => {
    try {
        if (req.query?.created_after) {
            const result = validationResult(req)

            // created_after query value is ok
            if (result.isEmpty()){
                const epoch:number = req.query.created_after
                const data = await repo.getArtistsCreatedAfter(epoch)
                res.send(data)
                return
            }
            
            // query value not ok: bad request
            console.log(result)
            res.statusCode = 400;
            res.send(result)
            return
        }
        const data = await repo.getArtists()
        res.send(data)
    }
    catch (error) {
        res.statusCode = 500
        res.send("Something went wrong");
        console.error(error);
    }
})

app.put("/artists/create", validators.artistlist("artists"), async (req, res) => {
    try {
        const result = validationResult(req);

        // artist name failed validation or does not exist
        if (!result.isEmpty()) {
            console.log(result)
            res.statusCode = 400;
            res.send(result)
            return
        }
        
        await repo.insertArtists(req.body.artists)
        res.status(200).send()
    }
    catch (error) {
        res.statusCode = 500
        res.send("Something went wrong");
        console.error("[ERROR] /artists/create:", error)
    }
})


app.post("/images/create", 
    imageUpload.single("image"), 
    validators.artist("artist", true), 
    validators.taglist("tags", true), 
    validators.srcUrl("src", true),
    async (req, res) => {

    try {
        if (!req.file) {
            res.status(400).send("no file attached");
            return;
        }

        const result = validationResult(req);

        // params failed validation
        if (!result.isEmpty()) {
            console.log(result)
            res.statusCode = 400;
            res.send(result)
            return
        }

        res.status(200).send("TODO: POST images endpoint")
    }
    catch (error) {
        res.status(500).send("Something went wrong");
        console.error("[ERROR] /images/create:", error)
    }
})
// TODO: lock POST/PUT/DELETE access behind token

app.get("/images/similar", (req, res) => {
    res.send("TODO: GET similar endpoint");
    // get filenames of images within certain hamming distance of provided image url
    // default: very very close distance (<= 2) to find duplicates
    // user can provide max distance as query param or in body
})

app.use("/images", express.static("public"))

app.listen(port, () => {
    console.log(`API: listening on port ${port}`);
    // console.log(config["postgres"]);
})