/**
 * @module types/api
 * @description File with interface definitions and type guards for types
 * used by the API.
 */

import { isObject, isString } from "./basic.mjs";

/**
 * Character that separates tags in a list.
 */
const TAG_SEPARATOR = " ";

/**
 * An Image entry stored in the database.
 */
export interface StoredImage {
    image_id: BigInt,
    filename: string,
    file_type: string
    src_url: string,
    artist: string,
    nsfw: boolean,
    hash: string,
    time_created: string,
    last_updated: string,
}
// TODO: this is different in site types

/**
 * A Tag entry stored in the database.
 */
export interface Tag {
    name : string,
    /**
     * Time created in ms since epoch.
     */
    time_created: string
}

/**
 * Checks if a given string is a valid tag name that can be stored.
 * @param tag string
 * @returns True if tag is a valid tag name.
 */
export function isValidTagName(tag:String):boolean {
    return (tag.length <= 50 && !tag.includes(TAG_SEPARATOR) && tag.length > 0);
}

/**
 * An Artist entry stored in the database.
 */
export interface Artist {
    artist: string,
    /**
     * Time created in ms since epoch.
     */
    time_created: string
}

/**
 * Checks if a given string is a valid artist name that can be stored.
 * @param artist string
 * @returns True if artist is a valid artist name.
 */
export function isValidArtistName(artist:String):boolean{
    return (artist.length <= 50 && artist.length > 0);
}

/**
 * Error class with an HTTP Status Code
 * and an associated error message.
 */
export class HttpError extends Error {
    public status: number;
    public details: object;

    constructor(
        status: number,
        message: string,
        details: object = {}
    ) {
        super(message);
        this.status = status;
        this.details = details;
    }
    // TODO: add json field or short version that can be sent to client
}

/**
 * Type guard for HttpError
 * @param o Unknown object
 * @returns True if o is of type HttpError
 */
export function isHttpError(o:unknown): o is HttpError {
    if (!isObject(o)) {
        return false;
    }

    // const keys = Object.keys(o);
    Object.keys
    // console.log(keys);
    if (!(Object.hasOwn(o, "status")
        && Object.hasOwn(o, "message"))) {
        return false;
    }
    const err = o as HttpError;

    return (typeof err.message === "string" 
        && typeof err.status === "number");
} 

/**
 * An object containing data for an image scraped
 * from a social media post.
 */
export interface ScrapedImage {
    /**
     * URL for the post this image came from
     */
    postUrl: string,
    /**
     * URL for the image content
     */
    imgUrl: string,
    /**
     * Social media handle for the post author
     */
    postAuthor: string,
    /**
     * Filename of the image
     * 
     * NOTE: commented out as it does not seem to be useful
     * for now, and we don't get this info for bsky post images.
     */
    // filename: string
}

/**
 * Type guard for ScrapedImage
 * @param o Unknown object
 * @returns True if o is of type ScrapedImage
 */
export function isScrapedImage(o:unknown): o is ScrapedImage {
    if (!isObject(o)) {
        return false;
    }

    if (!(Object.hasOwn(o, "postUrl")
        && Object.hasOwn(o, "imgUrl")
        && Object.hasOwn(o, "postAuthor")))
        // && Object.hasOwn(o, "filename"))) 
    {
        return false;
    }

    const scraped = o as ScrapedImage;

    if (!(isString(scraped.postUrl, true)
        && isString(scraped.imgUrl, true)
        && isString(scraped.postAuthor)))
        // && isString(scraped.filename))) 
    {
        return false;
    }

    // verify img url is a valid url
    try {
        new URL(scraped.imgUrl);
    }
    catch {
        return false;
    }

    return true;

}

