import { type Request, type Response } from "express";
import { HttpError } from "../types.mjs";

import * as proxyService from '../services/proxy-service.mjs';

// regex for matching x post link
const X_POST_URL_RE = /^https:\/\/(fixupx|x).com\/[\w]+\/status\/\d+$/

// regex for matching bsky post link
const BSKY_POST_URL_RE = /^https:\/\/bsky.app\/profile\/[\w.]+\/post\/\w+$/

/**
 * Fetch and respond with an array of scraped images from the given
 * social media url present on the request's params.
 * 
 * Assumes that req.query.url is present and is a string.
 * 
 * @param req Request
 * @param res Response
 */
export async function getImagesFromPost(req: Request, res: Response) {
    let url = req.query.url as string;

    // chop off query params that may be on url so regex works
    url = url.split("?")[0]; 
    let images = [];

    switch (true) {
        case X_POST_URL_RE.test(url):
            images = await proxyService.getXPostImageURLs(url);
            res.status(200).json(images);
            break;
        case BSKY_POST_URL_RE.test(url):
            images = await proxyService.getBskyPostImageURLs(url);
            res.status(200).json(images); 
            break;
        default:
            throw new HttpError(400, "invalid social media url in request");
    }
}