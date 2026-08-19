import { HttpError, isBskyImage, isBskyImagePost, isBskyPostInfo, isBskyProfileInfo, isTweetTombstone, isXPostInfo, type BskyImage, type ScrapedImage, type XPostInfo } from "@arttag/types";

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

    // non-200 status from bsky profile endpoint
    if (!data.ok) {
        throw new HttpError(500, `got response status ${data.status} from bsky profile endpoint`);
    }
    let json = await data.json();

    if (!isBskyProfileInfo(json)) {
        throw new HttpError(500, "got invalid response from bsky profile api");
    }

    const userDID = json.did;

    const atURI = `at://${userDID}/app.bsky.feed.post/${postId}`
    const getPostImagesEndpoint = GET_POST_ENDPOINT + "?uri=" + atURI + "&depth=0";

    data = await fetch(getPostImagesEndpoint);

    // non-200 status from bsky api
    if (!data.ok) {
        throw new HttpError(500, `got response status ${data.status} from bsky post endpoint`);
    }
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

    // capture username inside post url
    const handleMatch = url.match(/bsky\.app\/profile\/([^/]+)/);
    const handle = handleMatch?.[1];
    const postAuthorUsername = (handle)? handle.split(".")[0] : "";

    // console.log(images);
    return images.map((val) => {
        return {
            postUrl: url,
            imgUrl: val.fullsize,
            postAuthor: postAuthorUsername,
            // NOTE: bsky image links don't include file extension
            // just leave blank, not really necessary
            // NOTE: commenting out as filename is not needed rn
            // filename: ""
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

    // non-200 status from twitter api
    if (!data.ok) {
        throw new HttpError(500, `got response status ${data.status} from twitter image api`);
    }
    const json = await data.json();

    // got OK response, but content is a tweet tombstone
    if (isTweetTombstone(json)) {
        throw new HttpError(500, "got tombstone instead of tweet content");
    }

    // got OK response, but data format is not something
    // the app can handle
    if (!isXPostInfo(json)) {
        throw new HttpError(500, "got invalid response data from twitter image api");
    }

    const info = json as XPostInfo;

    const photosArr = info.photos;
    let urls = photosArr.flatMap((val) => {
        const link = val["url"];
        // NOTE: commenting out as filename is not needed rn
        // let filename = link.split("/").pop();
        // if (typeof  filename !== 'string') {
        //     filename = "failedToGetFilename!!!";
        // }

        return {
            "postUrl" : url,
            "imgUrl" : link,
            "postAuthor" : json.user.screen_name,
            // "filename": filename
        };
    })

    return urls;
}