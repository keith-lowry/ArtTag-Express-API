import { type Request, type Response, type NextFunction, type RequestHandler } from "express";
import { isBskyImage, isBskyImagePost, isBskyPostInfo, isBskyProfileInfo, isString, isTweetTombstone, isXPostInfo, type XPostInfo } from "../types.mjs";


const xPostLinkRe = /^https:\/\/(fixupx|x).com\/[\w]+\/status\/\d+$/ // verify x post link
const bskyPostLinkRe = /^https:\/\/bsky.app\/profile\/[\w.]+\/post\/\w+$/ // verify bsky link

/**
 * Send an array of urls for the images attached to
 * the given bsky post url.
 * @param url Valid url for bsky post that may have images
 */
function getBskyPostImageURLs(url:string, res: Response) {

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
            
            // TODO: standardize what this returns... should be same as
            // X post scraper
            res.json(images);
        })
    })

}

// TODO: these functions should return an array of scraped images

/**
 * Send an array of urls for the images attached to
 * the given X post url.
 * @param url Valid url for X post that may have images
 */
function getXPostImageURLs(url:string, res: Response) {
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

// TODO: move business logic to a services file
// TODO: add ScrapedImage type so endpoint sends array of scraped images

export function getImagesFromPost(req: Request, res: Response) {
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
}