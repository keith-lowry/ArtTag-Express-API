import { type Request, type Response } from "express";
import { HttpError, type StoredImage } from "@arttag/types";
import config from "../../config.json" with { type: 'json' };
import { storeArtist, storeImage, storeTags } from "../services/store-service.mjs";
import { getImageHash64 } from "../services/hashing-service.mjs";


/**
 * Store an image.
 * 
 * @param req Request
 * @param res Resposne
 */
export async function newImage(req: Request, res: Response) {
    // TODO:  the blanket request object makes it difficult to tell
    // what the expected input is here (what params?). Construct
    // object with params? idk

    // File validations
    if (!req.file) {
        throw new HttpError(400, "request is missing a file");
    }
    if (!req.file.mimetype.startsWith("image/", 0)) {
        throw new HttpError(400, "request file is not an image");
    }

    const body = req.body;

    // default to "unknown" if artist is not provided
    const artist:string = (body.artist)? body.artist : "unknown";

    // NOTE: possibly undefined, which is OK for service layer
    const srcUrl:string = (body.src)? body.src : "NULL";

    const hash = await getImageHash64(req.file!.buffer);

    const filetype:string = req.file!.mimetype.split("/")[1].toLowerCase()
    // console.log("got params")

    // store tags
    await storeTags(body.tags);
    // console.log("stored tags")

    // store artist
    await storeArtist(artist);
    // console.log("stored artist")


    // store image with params
    const newImage: StoredImage = await storeImage(
        req.file!.buffer,
        filetype,
        req.body.tags,
        hash,
        req.body.artist,
        srcUrl,
        req.body.nsfw
    );
    // console.log("stored image")

    
    res.status(200).json(newImage);
}