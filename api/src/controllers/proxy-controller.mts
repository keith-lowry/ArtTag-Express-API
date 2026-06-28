import { type Request, type Response } from "express";
import { HttpError } from "../types.mjs";
import config from "../../config.json" with { type: 'json' };


import * as proxyService from '../services/proxy-service.mjs';

// regex for matching x post link
const X_POST_URL_RE = /^https:\/\/(fixupx|x|twitter|fxtwitter)\.com\/[\w]+\/status\/\d+$/

// regex for matching bsky post link
const BSKY_POST_URL_RE = /^https:\/\/bsky\.app\/profile\/[\w\.]+\/post\/\w+$/

// regex for matching twitter image URLS
const TWIT_IMG_URL_RE = /^https:\/\/pbs\.twimg\.com\/media\/[\w\.]+$/


// https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:lkffzw3n5t2haffclh4jo4nj/bafkreie6hu5zzmf65amb7hyobokkjttsn227qydrtndls5dlkeksm4gdxq@jpeg
const BSKY_IMG_URL_RE = /^https:\/\/cdn\.bsky\.app\/img\/feed_fullsize\/plain\/did:plc:[\w]+\/[\w]+@[\w]+$/

/**
 * Fetch and respond with an array of scraped image URLs from the given
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


/**
 * Get the image content from a URL that would otherwise be rejected
 * by the browser's CORS policy.
 * 
 * @param req Request - should have url as query string
 * @param res Response - piped image content from the provided url, if possible
 */
export async function getImageFromURL(req: Request, res: Response) {
    const url = req.query.url as string;
    // https://pbs.twimg.com/media/HBhZbR4a0AAuO0I.jpg

    if (!(TWIT_IMG_URL_RE.test(url) || BSKY_IMG_URL_RE.test(url))) {
        throw new HttpError(400, "invalid image url in request");
    }

    // get headers of the client provided url
    const data = await fetch(url, {
        "method" : "head"
    });

    if (!data.ok) {
        throw new HttpError(500, "failed to fetch headers from image url");
    }

    const contentType = data.headers.get("content-type");
    if (contentType === null) {
        throw new HttpError(500, "failed to get content type of requested proxy");
    }
    if (!contentType?.startsWith("image/")) {
        throw new HttpError(400, "requested proxy is not for an image");
    }

    const imgSizeStr = data.headers.get("content-length");
    if (imgSizeStr === null) {
        throw new HttpError(500, "failed to get content length of requested proxy");
    }
    const imgSizeBytes = Number(imgSizeStr);
    if (imgSizeBytes > (config.maxFileSizeMB * 1000000)) {
        throw new HttpError(400, "requested image to proxy is too large");
    }

    const bodyData = await fetch(url);
    if (!bodyData.ok) {
        throw new HttpError(500, "failed to fetch data from image url");
    }

    const bytes = await bodyData.bytes()
    
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", imgSizeBytes);
    res.end(bytes);
}