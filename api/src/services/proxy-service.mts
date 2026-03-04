import { HttpError, isBskyImage, isBskyImagePost, isBskyPostInfo, isBskyProfileInfo, isTweetTombstone, isXPostInfo, type BskyImage, type ScrapedImage, type XPostInfo } from "../types.mjs";

const GET_PROFILE_ENDPOINT = "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile";
const GET_POST_ENDPOINT = "https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread";

/**
 * Returns an array of urls for the images attached to
 * the given bsky post url.
 * @param url Valid url for bsky post that may have images
 */
export async function getBskyPostImageURLs(url:string): Promise<ScrapedImage[]> {
    const path = url.substring("https://bsky.app/".length);
    const pathBits = path.split("/");
    const userHandle = pathBits[1];
    const postId = pathBits[3];

    const getDIDEndpoint = GET_PROFILE_ENDPOINT + "?actor=" + userHandle;

    let data = await fetch(getDIDEndpoint);
    let json = await data.json();

    if (!isBskyProfileInfo(json)) {
        throw new HttpError(500, "got invalid response from bsky profile api");
    }

    const userDID = json.did;

    const atURI = `at://${userDID}/app.bsky.feed.post/${postId}`
    const getPostImagesEndpoint = GET_POST_ENDPOINT + "?uri=" + atURI + "&depth=0";

    data = await fetch(getPostImagesEndpoint);
    json = await data.json();

    if (!isBskyPostInfo(json)) {
        throw new HttpError(500, "got invalid response from bsky post api");
    }

    const post = json.thread.post;
    if (!isBskyImagePost(post)) {
        // no embedded images in post
        return [];
    }

    const images = post.embed.images as BskyImage[];

    if (images.length > 0 && !isBskyImage(images[0])) {
        throw new HttpError(500, "got invalid image data from bsky post api");
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
 * Returns array of urls for the images attached to
 * the given X post url.
 * @param url Valid url for X post that may have images
 */
export async function getXPostImageURLs(url:string): Promise<ScrapedImage[]> {
    const postId = url.split("status/")[1];
    const infoUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${postId}&token=a`

    const data = await fetch(infoUrl);
    const json = await data.json();
    
    if (isTweetTombstone(json)) {
        throw new HttpError(500, "got tombstone instead of tweet content");
    }

    if (!isXPostInfo(json)) {
        throw new HttpError(500, "got invalid response from twitter image api");
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