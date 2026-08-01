import express from "express";
import { handleUploadParsing } from "./middleware/multer-parser.mjs";
import {handleValidationCheck} from "./middleware/validation-check.mjs";
import { asyncHandler } from "./utils/async-wrapper.mjs";
import bodyParser from "body-parser";
import validators from "./middleware/validators.mjs";
import config from "../config.json" with { type: 'json' };
import { startUp } from "./utils/startup.mjs";
import * as proxyController from "./features/image-scraping/proxy-controller.mjs";
import cors from "cors";
import { logRoute } from "./middleware/route-logging.mjs";
import { errorHandler } from "./middleware/error-handler.mjs";
import { createArtists, getArtists } from "./features/artists/artists-controller.mjs";
import { createTags, getTags } from "./features/tags/tags-controller.mjs";
import { getSimilarImages, newImage } from "./features/image-store/images-controller.mjs";


const app = express();
const port = 3000;

app.use(cors({
    origin: "http://localhost:5173"
}));

// const errorFormatter: ErrorFormatter<string> = (error: ValidationError): string => {
//     return "TODO";
// }


app.use(logRoute);
app.use(bodyParser.json())
app.use('/images/get', express.static(config.imagesFolder))


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


// use a global error handler
app.use(errorHandler);

app.listen(port, () => {
    startUp(port);
});