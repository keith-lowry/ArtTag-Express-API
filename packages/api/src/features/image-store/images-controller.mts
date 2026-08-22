import { type Request, type Response } from "express";
import { HttpError, type StoredImage } from "@arttag/types";
import { listImages, storeArtist, storeImage, storeTags } from "./store-service.mjs";
import { getImageHash64 } from "./hashing-service.mjs";

/**
 * Get a list of images that are visually similar to that
 * attached to the body of the request in decreasing order of similarity.
 */
export async function getSimilarImages(req: Request, res:Response): Promise<void> {
    res.send("TODO");
}

export async function listImagesWithTags(req: Request, res: Response): Promise<void> {
    const data = await listImages();
    res.send(data);
}

/**
 * Store an image.
 * 
 * @param req Request
 * @param res Resposne
 */
export async function newImage(req: Request, res: Response) {
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

    // store tags
    await storeTags(body.tags);

    // store artist
    await storeArtist(artist);

    // store image with params
    const newImage: StoredImage = await storeImage(
        req.file.buffer,
        filetype,
        req.body.tags,
        hash,
        req.body.artist,
        srcUrl,
        req.body.nsfw
    );
    
    res.status(200).json(newImage);
}