/**
 * @module types/bsky
 * @description File with interface definitions and type guards for types
 * used when proxying and scraping Bsky post content.
 */

import { isObject, isString } from "./basic.mjs";

/**
 * Object containing DID for a particular Bsky account/identity.
 */
export interface BskyProfileInfo {
    did : string
}

/**
 * Type guard for BskyProfileInfo
 * @param o Unknown object
 * @returns True if o is of type BskyProfileInfo
 */
export function isBskyProfileInfo(o: unknown): o is BskyProfileInfo {
    return o !== null 
        && typeof o === "object" 
        && Object.keys(o).includes("did") 
        && isString((o as BskyProfileInfo).did);
}

/**
 * Object containing information about a particular
 * Bsky post.
 */
export interface BskyPostInfo {
    thread : {
        post : object
    }
}

/**
 * Type guard for BskyPostInfo
 * @param o Unknown object
 * @returns True if o is of type BskyPostInfo
 */
export function isBskyPostInfo(o: unknown): o is BskyPostInfo {
    if (!(isObject(o) && Object.keys(o).includes("thread"))) {
        return false;
    }
    const thread = (o as any).thread;

    if (typeof thread !== "object" || !Object.keys(thread).includes("post")) {
        return false;
    }

    const post = (thread as any).post;

    if (typeof post !== "object") {
        return false;
    }

    return true;

}

/**
 * Object containing a list of images attached to a Bsky post.
 */
export interface BskyImagePost {
    embed : {
        images : Array<object>
    }
}

/**
 * Type guard for BskyImagePost
 * @param o Unknown object
 * @returns True if o is of type BskyImagePost
 */
export function isBskyImagePost(o: unknown): o is BskyImagePost {
    if (!isObject(o) || !Object.keys(o).includes("embed")) {
        return false;
    }

    const embed = (o as any).embed;

    if (!isObject(embed) || !Object.keys(embed).includes("images")) {
        return false;
    }

    const images = (embed as any).images;

    return Array.isArray(images);
}

/**
 * Object containing image content attached to a Bsky post.
 */
export interface BskyImage {
    thumb: string,
    fullsize: string,
    alt: string,
    aspectRatio: { height: number, width: number}
}

/**
 * Type guard for BskyImage
 * @param o Unknown object
 * @returns True if o is of type BskyImage
 */
export function isBskyImage(o: unknown): o is BskyImage {
    if (!isObject(o)) {
        return false;
    }

    const keys = Object.keys(o);

    if (!(keys.includes("thumb")
        && keys.includes("fullsize")
        && keys.includes("alt")
        && keys.includes("aspectRatio"))) {
        return false;
    }

    const image = o as BskyImage;

    if (!(typeof image.alt === "string"
            && typeof image.aspectRatio === "object"
            && typeof image.fullsize === "string"
            && typeof image.thumb === "string"
            && typeof image.aspectRatio.height === "number"
            && typeof image.aspectRatio.width === "number")) {
        return false;
    }

    return true;
}