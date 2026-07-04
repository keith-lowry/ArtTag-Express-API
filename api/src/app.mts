import express from "express";
import type { RequestHandler, ErrorRequestHandler } from "express";
import { repo } from "./db/repository.mjs";
import { handleUploadParsing, handleValidationCheck, asyncHandler  } from "./helpers.mjs";
import bodyParser from "body-parser";
import { query, body, validationResult, type ErrorFormatter, type ValidationError } from "express-validator";
import validators from "./validators.mjs";
import config from "../config.json" with { type: 'json' };
import fs from "fs";
import { error, time } from "console";
import type { NextFunction, Response } from 'express-serve-static-core';
import { HttpError, isHttpError} from "./types.mjs";
import * as proxyController from "./controllers/proxy-controller.mjs";
import cors from "cors";
import { dbSetup } from "./db/pool.mjs"


const app = express();
const port = 3000;

app.use(cors({
    origin: "http://localhost:5173"
}));

// const errorFormatter: ErrorFormatter<string> = (error: ValidationError): string => {
//     return "TODO";
// }

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


// GET /tags/list: get a list of tags in DB
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

// app.put("/tags/create", 
//     validators.taglist("tags", config.maxArrLen), 
//     handleValidationCheck, 
//     async (req, res) => {

//     try {
//         await repo.insertTags(req.body.tags)
//         res.status(200).send()
//     }
//     catch (error) {
//         res.statusCode = 500
//         res.send("Something went wrong");
//         console.error("[ERROR] /tags/create:", error)
//     }
// })


// GET /artists/list: get a list of artists in DB
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

// app.put("/artists/create", 
//     validators.artistlist("artists", config.maxArrLen), 
//     handleValidationCheck, 
//     async (req, res) => {

//     try {
//         // const result = validationResult(req);

//         // // artist name failed validation or does not exist
//         // if (!result.isEmpty()) {
//         //     console.log(result)
//         //     res.statusCode = 400;
//         //     res.send(result)
//         //     return
//         // }
//         // console.log(req.body.artists)
        
//         await repo.insertArtists(req.body.artists)
//         res.status(200).send()
//     }
//     catch (error) {
//         res.statusCode = 500
//         res.send("Something went wrong");
//         console.error("[ERROR] /artists/create:", error)
//     }
// })

app.post("/images/create", 
    asyncHandler(handleUploadParsing),
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

// GET /proxy/post: get list of image urls from a bsky or
// X post
app.get(
    "/proxy/post", 
    validators.stringQuery("url"), 
    handleValidationCheck, 
    asyncHandler(proxyController.getImagesFromPost)
);

// GET /proxy/image: get image data from an image URL that CORS
// policy would otherwise deny
app.get(
    "/proxy/image",
    validators.stringQuery("url"),
    handleValidationCheck,
    asyncHandler(proxyController.getImageFromURL)
)

/**
 * Global error handler for errors thrown by (possibly asynchronous)
 * middleware.
 * 
 * @param err Error, ideally an instance of HttpError
 * @param req The Request
 * @param res The API's Response
 * @param next Next middleware in the chain
 * @returns 
 */
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    // handle case when request was already responded to by api
    if (res.headersSent) {
        console.log("HEADERS SENT ALREADY ERR");
        return next(err);
    }

    // log timestamp, request method, and url
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}]`, req.method + " " + req.originalUrl, err);

    // generic error, just respond with 500
    if (!isHttpError(err)) {
        console.log("IS NOT HTTP ERROR", err);
        res.status(500).json({"error" : "Internal server error"});
        return;
    }

    // http error - send response with details and status code
    const httperr = err as HttpError;
    // NOTE: if status is not in error range, just use 500 as a catch-all
    const statusCode = (httperr.status >= 400 && httperr.status <= 511)? httperr.status : 500;
    res.status(statusCode).json({
        "error" : httperr.message,
        "details" : httperr.details
    })
}

// use a global error handler
app.use(errorHandler);

app.listen(port, async () => {
    // set up images folder
    if (!fs.existsSync(config.imagesFolder)) {
        fs.mkdirSync(config.imagesFolder);
        const time = new Date().toISOString();
        console.info(`[${time}] STARTUP: Made images folder ${config.imagesFolder}`)
    }
    else {
        const time = new Date().toISOString();
        console.info(`[${time}] STARTUP: Using images folder ${config.imagesFolder}`)
    }

    // set up db connection
    await dbSetup();
    

    const start = new Date().toISOString();
    console.info(`[${start}] READY: API listening on port ${port}`);
})