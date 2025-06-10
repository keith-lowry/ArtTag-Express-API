import express from "express";
import type { RequestHandler, ErrorRequestHandler } from "express";
import { repo } from "./db/repository.mjs";
// import { isValidArtistName, isValidTagName } from "./types.mjs";
import multer from "multer";
import { MulterError } from "multer";
import bodyParser from "body-parser";
import { query, body, validationResult } from "express-validator";
import validators from "./validators.mjs";
import config from "../config.json" with { type: 'json' };
import fs from "fs";
import { error } from "console";

// TODO: use proper express error handling
// https://expressjs.com/en/guide/error-handling.html


const app = express();
const port = 3000;

if (!fs.existsSync(config.imagesFolder)) {
    fs.mkdirSync(config.imagesFolder);
    console.info(`[STARTUP] Made images folder ${config.imagesFolder}`)
}
else {
    console.info(`[STARTUP] Using images folder ${config.imagesFolder}`)
}

const imageStorage = multer.memoryStorage()
const imageUpload = multer({storage : imageStorage, limits : {
    fileSize: config.maxFileSizeMB * 1000000,
    files: 1
}}).single("image")

/**
 * Handles the parsing of a multipart form data request body using
 * multer. Breaks the chain and sends an error code to client 
 * if something goes wrong.
 * 
 * @param req Request
 * @param res Response
 * @param next Next middleware in chain
 */
const handleUploadParsing:RequestHandler = (req, res, next) => {
    imageUpload(req, res, (err) => {
        // NOT OK: something went wrong with img upload
        if (err instanceof multer.MulterError) {
            const e = err as multer.MulterError
            if (e.code === 'LIMIT_FILE_SIZE') {
                console.info(`[INFO] Rejected file greater than ${config.maxFileSizeMB}MB in size`)
                res.status(413).send(`Your file was larger than the max file size of ${config.maxFileSizeMB}MB`)
                return
            }
            if (e.code === 'LIMIT_FILE_COUNT') {
                console.info('[INFO] Received request with more than one file')
                res.status(400).send('Only one image file is expected')
                return
            }
            console.log(err)
            res.status(500).send("Oops! Something unexpected happened")
            return
        }
        else if (err) {
            res.status(500).send("Oops! Something unexpected happened")
            console.log(err)
            return
        }

        // OK: go to next middleware
        next();
    })
}

/**
 * Middleware to check if validation result is not empty. Stops
 * chain and sends 400 to client if true.
 * @param req Request
 * @param res Response
 * @param next Next middleware in chain
 */
const handleValidationCheck:RequestHandler = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        // console.log(result)
        res.statusCode = 400;
        res.send(result)
        return
    }
    next();
}

app.use(bodyParser.json())
app.use('/images/get', express.static(config.imagesFolder))


app.get("/tags/list", 
    validators.epoch("created_after"), 
    handleValidationCheck, 
    async (req, res) => {

    try {
        if (req.query?.created_after) {
            const epoch:number = Number(req.query.created_after)
            const data = await repo.getTagsCreatedAfter(epoch)
            res.send(data)
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

app.put("/tags/create", 
    validators.taglist("tags"), 
    handleValidationCheck, 
    async (req, res) => {

    try {
        await repo.insertTags(req.body.tags)
        res.status(200).send()
    }
    catch (error) {
        res.statusCode = 500
        res.send("Something went wrong");
        console.error("[ERROR] /tags/create:", error)
    }
})

app.get("/artists/list",
    validators.epoch("created_after"), 
    handleValidationCheck,
    async (req, res) => {

    try {
        if (req.query?.created_after) {
            const epoch:number = Number(req.query.created_after)
            const data = await repo.getArtistsCreatedAfter(epoch)
            res.send(data)
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

app.put("/artists/create", 
    validators.artistlist("artists"), 
    handleValidationCheck, 
    async (req, res) => {

    try {
        // const result = validationResult(req);

        // // artist name failed validation or does not exist
        // if (!result.isEmpty()) {
        //     console.log(result)
        //     res.statusCode = 400;
        //     res.send(result)
        //     return
        // }
        // console.log(req.body.artists)
        
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
    // imageUpload.single("image"), 
    handleUploadParsing,
    validators.artist("artist", true), 
    validators.taglist("tags", true), 
    validators.srcUrl("src", true),
    validators.bool("nsfw", true),
    handleValidationCheck,
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
        // const result = validationResult(req);
        // if (!result.isEmpty()) {
        //     console.log(result)
        //     res.statusCode = 400;
        //     res.send(result)
        //     return
        // }

        // vvv TODO: move this check to tags list validator vvv
        const tagsExist = await repo.hasTags(req.body.tags) // make sure provided tags are in DB
        if (!tagsExist) {
            res.status(400)
                .send("at least one provided tag does not exist");
            return
        }
        
        if (req.body.artist) {
            const artistExists = await repo.hasArtist(req.body.artist) // make sure provided artist is in DB
            if (!artistExists) {
                res.status(400)
                .send(`provided artist does not exist`)
                return
            }
        }

        const filetype = req.file.mimetype.split("/")[1].toLowerCase()

        // TODO: replace with call to phash
        const hash = "1111111111111111111111111111111111111111111111111111111111111111"

        const qres = await repo.insertImage(req.file.buffer, filetype, req.body.tags, hash, req.body.artist, req.body.src, req.body.nsfw)
        // console.log(qres)
        res.status(200).send(qres)
    }
    catch (error) {
        res.status(500).send("Something went wrong");
        console.error("[ERROR] /images/create:", error)
    }
})

app.get("/images/similar", (req, res) => {
    res.send("TODO: GET similar endpoint");
    // get filenames of images within certain hamming distance of provided image url
    // default: very very close distance (<= 2) to find duplicates
    // user can provide max distance as query param or in body
})

app.use("/images", express.static("public"))

app.listen(port, () => {
    console.info(`[READY] API listening on port ${port}`);
})