/**
 * @module types/x
 * @description File with interface definitions and type guards for types
 * used when proxying and scraping X post content.
 */

import { isString } from "./basic.mjs";

/**
 * Object containing fields related to a particular
 * X post.
 */
export interface XPostInfo {
    photos: Array<XImageInfo>,
    user: XPostUserInfo
}

/**
 * Object containing fields related to a particular
 * X user.
 */
export interface XPostUserInfo {
    id_str : string,
    name : string,
    screen_name: string,
    is_blue_verified: boolean,
    profile_image_shape: string,
    verified: boolean,
    profile_image_url_https: string
}

/**
 * Type guard for XPostUserInfo type
 * @param o Unkown object
 * @returns True if o is of type XPostUserInfo
 */
export function isXPostUserInfo(o:unknown): o is XPostUserInfo {
    if (o === null 
        || typeof o !== "object"
        || !Object.keys(o).includes("id_str")
        || !Object.keys(o).includes("name")
        || !Object.keys(o).includes("screen_name")
        || !Object.keys(o).includes("is_blue_verified")
        || !Object.keys(o).includes("profile_image_shape")
        || !Object.keys(o).includes("verified")
        || !Object.keys(o).includes("profile_image_url_https")) {
            return false;
    }

    const uinfo = o as XPostUserInfo;

    if (!isString(uinfo.id_str)
        || !isString(uinfo.name)
        || !isString(uinfo.screen_name)
        || typeof uinfo.is_blue_verified !== "boolean"
        || !isString(uinfo.profile_image_shape)
        || typeof uinfo.verified !== "boolean"
        || !isString(uinfo.profile_image_url_https)) {
            return false;
    }

    return true;
}

/**
 * Type guard for XPostInfo type
 * @param o Unkown object
 * @returns True if o is of type XPostInfo
 */
export function isXPostInfo(o: unknown): o is XPostInfo {
    if (o === null 
        || typeof o !== "object" 
        || !Object.keys(o).includes("photos")
        || !Object.keys(o).includes("user")) {
        return false;
    }
    const info = o as XPostInfo;

    if (!Array.isArray(info.photos)) {
        return false;
    }

    // only test 1st entry in photos array
    if (info.photos.length > 0 && !isXImageInfo(info.photos[0])) {
        return false;
    }

    // check that user info matches interface we expect
    if (!isXPostUserInfo(info.user)) {
        return false;
    }

    return true;
}

/**
 * Object containing metadata about an image attached to an X post.
 */
export interface XImageInfo {
    backgroundColor: Object,
    cropCandidates: Array<Object>,
    expandedUrl: string,
    url: string,
    width: number,
    height: number
}

/**
 * Type guard for XImageInfo type
 * @param o Unknown object
 * @returns True if o is of type XImageInfo
 */
export function isXImageInfo(o: unknown): o is XImageInfo {
    if (o === null || typeof o !== "object") {
        return false;
    }

    const keys = Object.keys(o);

    if (!(keys.includes("backgroundColor") && 
            keys.includes("cropCandidates") && 
            keys.includes("expandedUrl") && 
            keys.includes("url") &&
            keys.includes("width") &&
            keys.includes("height") )) 
    {
        return false;
    }

    const info = o as XImageInfo;

    if (!(
        typeof info.backgroundColor === "object" &&
        Array.isArray(info.cropCandidates) &&
        isString(info.expandedUrl) &&
        typeof info.height === "number" &&
        typeof info.width === "number" &&
        typeof isString(info.url) 
    )) {
        return false;
    }

    return true;
}

/**
 * Object returned from X API that indicates a Tweet/Post
 * has been "tombstoned" and we cannot get data for it.
 */
export interface TweetTombstone {
    __typename: 'TweetTombstone'
}

/**
 * Type guard for TweetTombstone
 * @param o Unknown object
 * @returns True if o is of type TweetTombstone
 */
export function isTweetTombstone(o: unknown): o is TweetTombstone {
    return o !== null && 
        typeof o === "object" && 
        Object.keys(o).includes("__typename") && 
        (o as TweetTombstone).__typename === "TweetTombstone";
}