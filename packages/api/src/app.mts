import express from "express";
import { asyncHandler } from "./utils/async-wrapper.mjs";
import bodyParser from "body-parser";
import config from "../config.json" with { type: 'json' };
import { startUp } from "./utils/startup.mjs";
import * as proxyController from "./features/image-scraping/proxy-controller.mjs";
import cors from "cors";
import {logRoute, errorHandler, handleUploadParsing, handleValidationCheck , validators } from "./middleware/index.mjs";
import { createArtists, getArtists } from "./features/artists/artists-controller.mjs";
import { createTags, getTags } from "./features/tags/tags-controller.mjs";
import { getSimilarImages, newImage } from "./features/image-store/images-controller.mjs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * The string path to this module file.
 */
const __filename = fileURLToPath(import.meta.url);

/**
 * The directory this module file is within.
 */
const __dirname = path.dirname(__filename);

/**
 * Build folder for the React app the api will serve.
 */
export const siteBuildPath = path.normalize(path.join(__dirname, '../../site/dist'));

const app = express();
const port = 3000;

// api will be running on port 3000 from localhost
app.use(cors({
    origin: "http://192.168.1.240:3000",
}));

// const errorFormatter: ErrorFormatter<string> = (error: ValidationError): string => {
//     return "TODO";
// }

app.use(logRoute);
app.use(bodyParser.json())
app.use('/images/get', express.static(config.imagesFolder))


// serve static site files
app.use(express.static(siteBuildPath));


app.get("/tags/list", 
    validators.epoch("created_after"), 
    handleValidationCheck, 
    asyncHandler(getTags));

app.put("/tags/create", 
    validators.taglist("tags", config.maxArrLen), 
    handleValidationCheck, 
    asyncHandler(createTags));

app.get("/artists/list",
    validators.epoch("created_after"), 
    handleValidationCheck,
    asyncHandler(getArtists));

app.put("/artists/create", 
    validators.artistlist("artists", config.maxArrLen), 
    handleValidationCheck, 
    asyncHandler(createArtists));

/**
 * POST images/create: Store a new image with tags and metadata
 * 
 * Expects multipart/form-data with:
 * - "artist": string
 * - "tags": list of strings separated by tag separator. can also be multiple
 *   fields with the name "tags".
 * - "src": string url
 * - "nsfw": string - 'true' or 'false'
 * - "image": file with mimetype of image/*
 * 
 * Responds with the newly stored image and its associated tags on success.
 */
app.post("/images/create", 
    // parse multipart form data
    asyncHandler(handleUploadParsing),
    // validate request content
    validators.artist("artist", true), 
    validators.taglist("tags", config.maxArrLen, true), 
    validators.srcUrl("src", true),
    validators.bool("nsfw", false),
    handleValidationCheck,
    asyncHandler(newImage)
);

app.get("/images/similar", asyncHandler(getSimilarImages));

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

// for any site routing, serve the react app.
// react will handle routing.
app.get("/site*",
    (req, res, next) => {
        res.sendFile(path.join(siteBuildPath, 'index.html'));
    }
)

// use a global error handler
app.use(errorHandler);

app.listen(port, () => {
    startUp(port);
});