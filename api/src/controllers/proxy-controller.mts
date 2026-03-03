import { type Request, type Response, type NextFunction, type RequestHandler } from "express";
import { HttpError, isBskyImage, isBskyImagePost, isBskyPostInfo, isBskyProfileInfo, isString, isTweetTombstone, isXPostInfo, type BskyImage, type ScrapedImage, type XPostInfo } from "../types.mjs";


const xPostLinkRe = /^https:\/\/(fixupx|x).com\/[\w]+\/status\/\d+$/ // verify x post link
const bskyPostLinkRe = /^https:\/\/bsky.app\/profile\/[\w.]+\/post\/\w+$/ // verify bsky link

/**
 * Send an array of urls for the images attached to
 * the given bsky post url.
 * @param url Valid url for bsky post that may have images
 */
async function getBskyPostImageURLs(url:string): Promise<ScrapedImage[]> {

    const getProfileEndpoint = "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile";
    const getPostEndpoint = "https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread";

    const path = url.substring("https://bsky.app/".length);
    const pathBits = path.split("/");
    const userHandle = pathBits[1];
    const postId = pathBits[3];

    const getDIDEndpoint = getProfileEndpoint + "?actor=" + userHandle;

    let data = await fetch(getDIDEndpoint);
    let json = await data.json();

    if (!isBskyProfileInfo(json)) {
        throw new HttpError(500, "got unexpected data from bsky profile api");
    }

    const userDID = json.did;

    const atURI = `at://${userDID}/app.bsky.feed.post/${postId}`
    const getPostImagesEndpoint = getPostEndpoint + "?uri=" + atURI + "&depth=0";

    data = await fetch(getPostImagesEndpoint);
    json = await data.json();

    if (!isBskyPostInfo(json)) {
        throw new HttpError(500, "got unexpected data from bsky post api");
    }


    const post = json.thread.post;
    if (!isBskyImagePost(post)) {
        // no embedded images in post
        return [];
    }

    const images = post.embed.images as BskyImage[];

    if (images.length > 0 && !isBskyImage(images[0])) {
        throw new HttpError(500, "got unexpected image data bsky post api");
    }

    console.log(images);
    return images.map((val) => {
        return {
            postUrl: url,
            imgUrl: val.fullsize,
            // TODO: get post author
            postAuthor: "TODO",
            // TODO: get image filename
            filename: "TODO"
        }
    });
}

/**
 * Send an array of urls for the images attached to
 * the given X post url.
 * @param url Valid url for X post that may have images
 */
async function getXPostImageURLs(url:string): Promise<ScrapedImage[]> {
    const postId = url.split("status/")[1];
    const infoUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${postId}&token=a`

    const data = await fetch(infoUrl);
    const json = await data.json();
    
    if (isTweetTombstone(json)) {
        throw new HttpError(500, "got tombstone instead of tweet content");
    }

    if (!isXPostInfo(json)) {
        throw new HttpError(500, "got unexpected response from twitter image api");
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
            "postUrl" : url,
            "imgUrl" : link,
            // TODO: get twitter handle from url
            "postAuthor" : "TODO",
            "filename": filename
        };
    })

    return urls;
}

// TODO: move business logic to a services file

export async function getImagesFromPost(req: Request, res: Response) {
    if (req.query?.url && isString(req.query.url)) {
        let url = req.query.url;
        url = url.split("?")[0]; // chop off query params
        let images = [];
        switch (true) {
            case xPostLinkRe.test(url):
                images = await getXPostImageURLs(url);
                res.status(200).json(images);
                break;
            case bskyPostLinkRe.test(url):
                images = await getBskyPostImageURLs(url);
                res.status(200).json(images); 
                break;
            default:
                throw new HttpError(400, "invalid social media url in request");
        }
    }
    else {
        throw new HttpError(400, "missing url parameter in request");
    }
}