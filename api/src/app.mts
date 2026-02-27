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
import type { Response } from 'express-serve-static-core';
import { isBskyImage, isBskyImagePost, isBskyPostInfo, isBskyProfileInfo, isString, isTweetTombstone, isXPostInfo, type XPostInfo } from "./types.mjs";

// TODO: use proper express error handling
// https://expressjs.com/en/guide/error-handling.html


const app = express();
const port = 3000;

if (!fs.existsSync(config.imagesFolder)) {
    fs.mkdirSync(config.imagesFolder);
    const time = new Date().toISOString();
    console.info(`[${time}] STARTUP Made images folder ${config.imagesFolder}`)
}
else {
    const time = new Date().toISOString();
    console.info(`[${time}] STARTUP: Using images folder ${config.imagesFolder}`)
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

/**
 * Route logging middleware
 * 
 * Log the 
 * - UTC time
 * - request method
 * - response status code
 * - url
 * - time to respond
 * for every endpoint response
 */
app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const timestamp = new Date().toISOString();
        const duration = Date.now() - start;
        console.log(
            `[${timestamp}] ${res.statusCode} ${req.method} ${req.originalUrl} (${duration} ms)`
        );
    })
    next();
})
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
    validators.taglist("tags", config.maxArrLen), 
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
        const data = await repo.getArtists();
        res.send(data);
    }
    catch (error) {
        res.statusCode = 500;
        res.send("Something went wrong");
        console.error(error);
    }
})

app.put("/artists/create", 
    validators.artistlist("artists", config.maxArrLen), 
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
    validators.taglist("tags", config.maxArrLen, true), 
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

/**
 * Send an array of urls for the images attached to
 * the given bsky post url.
 * @param url Valid url for bsky post that may have images
 */
function getBskyPostImageURLs(url:string, res: Response<any, Record<string, any>, number>) {

    const getProfileEndpoint = "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile";
    const getPostEndpoint = "https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread";

    const path = url.substring("https://bsky.app/".length);
    const pathBits = path.split("/");
    const userHandle = pathBits[1];
    const postId = pathBits[3];

    const getDIDEndpoint = getProfileEndpoint + "?actor=" + userHandle;

    fetch(getDIDEndpoint).then(data => data.json()).then((json) => {
        // console.log(json);
        if (!isBskyProfileInfo(json)) {
            res.status(500).json({"error" : "got unexpected data"});
            return;
        }
        const userDID = json.did;

        const atURI = `at://${userDID}/app.bsky.feed.post/${postId}`
        const getPostImagesEndpoint = getPostEndpoint + "?uri=" + atURI + "&depth=0";

        fetch(getPostImagesEndpoint).then(data => data.json()).then((json) => {
            console.log(json);
            if (!isBskyPostInfo(json)) {
                res.status(500).json({"error" : "got unexpected data"});
                return;
            }

            const post = json.thread.post;
            if (!isBskyImagePost(post)) {
                // no embedded images in post
                res.json([]);
                return;
            }

            const images = post.embed.images;

            if (images.length > 0 && !isBskyImage(images[0])) {
                res.status(500).json({"error" : "got unexpected data"});
                return;
            }
            
            res.json(images);
        })
    })

}

/**
 * Send an array of urls for the images attached to
 * the given X post url.
 * @param url Valid url for X post that may have images
 */
function getXPostImageURLs(url:string, res: Response<any, Record<string, any>, number>) {
    const postId = url.split("status/")[1];
    const infoUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${postId}&token=a`


    // TODO: add type checking for json data 
    // https://medium.com/@AlexanderObregon/making-typescript-work-with-json-data-you-dont-fully-control-7ede3d4c0828
    // TODO: what if no photos?
    fetch(infoUrl).then((data) => data.json()).then((json) => {
        if (isTweetTombstone(json)) {
            res.statusCode = 500;
            res.json({error: "got tombstone instead of tweet content"});
            console.info("/proxy/post 500 got tweet tombstone");
            return;
        }

        if (!isXPostInfo(json)) {
            res.statusCode = 500;
            res.json({ error: "got unexpected response from image api"});
            console.warn("/proxy/post 500 got unexepected response from image api :");
            console.log(json);
            return;
        }
        const info = json as XPostInfo;

        const photosArr = info.photos;
        let urls = photosArr.flatMap((val) => {
            const link = val["url"];
            let filename = link.split("/").pop();
            if (typeof  filename !== 'string') {
                filename = "failedToGetFilename!!!";
            }

            return {
                "url" : link,
                "filename": filename
            };
        })

        res.json(urls);
    }).catch((err) => {
        res.statusCode = 500;
        res.json({error: "something went wrong"});
        console.warn("/proxy/post 500 " + err);
    });
}

const xPostLinkRe = /^https:\/\/(fixupx|x).com\/[\w]+\/status\/\d+$/ // verify x post link
const bskyPostLinkRe = /^https:\/\/bsky.app\/profile\/[\w.]+\/post\/\w+$/ // verify bsky link
// const s:

app.get("/proxy/post", (req, res) => {
    if (req.query?.url && isString(req.query.url)) {
        let url = req.query.url;
        url = url.split("?")[0]; // chop off query params
        switch (true) {
            case xPostLinkRe.test(url):
                getXPostImageURLs(url, res)
                // TODO: might want to make the get functions async
                // and just await them here so we can wrap everything 
                // in a try catch for fun?

                // yes - functions can throw error and we can handle logging them in this single
                // endpoint
                // research what makes sense for error logging in express
                break;
            case bskyPostLinkRe.test(url):
                getBskyPostImageURLs(url, res);
                break;
            default:
                res.statusCode = 400;
                res.send("Invalid social media url in request");
        }
        // console.log(`get-image-urls: ${req.query.url}`);
    }
    else {
        res.statusCode = 400;
        res.send("Missing url parameter in request");
    }
})

app.listen(port, () => {
    const start = new Date().toISOString();
    console.info(`[${start}] READY: API listening on port ${port}`);
})