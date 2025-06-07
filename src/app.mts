import express from "express";
import { repo } from "./db/repository.mjs";
// import { isValidArtistName, isValidTagName } from "./types.mjs";
import multer from "multer";
import bodyParser from "body-parser";
import { query, body, validationResult } from "express-validator";
import validators from "./validators.mjs";
import config from "../config.json" with { type: 'json' };
import fs from "fs";

// TODO: use proper express error handling
// https://expressjs.com/en/guide/error-handling.html


const app = express();
const port = 3000;

if (!fs.existsSync(config.imagesFolder)) {
    fs.mkdirSync(config.imagesFolder);
    console.info(`[INFO] Made images folder ${config.imagesFolder}`)
}
else {
    console.info(`[INFO] Using images folder ${config.imagesFolder}`)
}

const imageStorage = multer.memoryStorage()
const imageUpload = multer({storage : imageStorage, limits : {
    fileSize: config.maxFileSizeMB * 1000000,
    files: 1
}})

app.use(bodyParser.json())
app.use('/images/get', express.static(config.imagesFolder))


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
        console.log(req.body.artists)
        
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
        // File validations
        if (!req.file) {
            res.status(400).send("no file attached");
            return;
        }
        if (!req.file.mimetype.startsWith("image/", 0)) {
            res.status(400).send("file must be an image")
            return
        }

        // Check text params are valid
        const result = validationResult(req);
        if (!result.isEmpty()) {
            console.log(result)
            res.statusCode = 400;
            res.send(result)
            return
        }

        // console.log(req.body.tags)
        // console.log(req.file.mimetype)

        // vvv TODO: move this check to tags list validator vvv
        const tagsExist = await repo.hasTags(req.body.tags)
        if (!tagsExist) {
            res.status(400)
                .send("at least one provided tag does not exist");
            return
        }
        
        if (req.body.artist) {
            const artistExists = await repo.hasArtist(req.body.artist)
            if (!artistExists) {
                res.status(400)
                .send(`provided artist does not exist`)
                return
            }
        }

        const filetype = req.file.mimetype.split("/")[1].toLowerCase()

        // TODO: replace with call to phash
        const hash = "1111111111111111111111111111111111111111111111111111111111111111"

        const qres = await repo.insertImage(req.file.buffer, filetype, req.body.tags, hash, req.body.artist, req.body.src)
        // console.log(qres)
        res.status(200).send(qres)
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
    console.info(`[INFO] API listening on port ${port}`);
})