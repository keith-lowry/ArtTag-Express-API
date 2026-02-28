export interface Image {
    image_id: BigInt,
    filename: string,
    hash: string,
}

export interface Tag {
    name : string,
    time_created: string // ms since epoch
}

export interface Artist {
    artist: string,
    time_created: string // ms since epoch
}

export interface XPostInfo {
    photos: Array<XImageInfo>
}

/**
 * Type guard for XPostInfo type
 * @param o Unkown object
 * @returns True if o is of type XPostInfo
 */
export function isXPostInfo(o: unknown): o is XPostInfo {
    if (o === null 
        || typeof o !== "object" 
        || !Object.keys(o).includes("photos")) {
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

    return true;
}

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
 * Type guard for object
 * @param o Unknown object
 * @returns True if o is of type object
 */
export function isObject(o:unknown): o is object {
    return o !== null && typeof o == "object";
}

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

const TAG_SEPARATOR = " ";

/**
 * Error class with an HTTP Status Code
 * and an associated error message.
 */
export class HttpError extends Error {
    public status: number;

    constructor(
        status: number,
        message: string
    ) {
        super(message);
        this.status = status;
    }
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

    const keys = Object.keys(o);

    if (!(keys.includes("status") 
        && keys.includes("message"))) {
        return false;
    }
    const err = o as HttpError;

    return (typeof err.message === "string" 
        && typeof err.status === "number");
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
 * Checks if a given string is a valid artist name that can be stored.
 * @param artist string
 * @returns True if artist is a valid artist name.
 */
export function isValidArtistName(artist:String):boolean{
    return (artist.length <= 50 && artist.length > 0);
}

/**
 * Type guard for string type
 * @param value 
 * @returns  boolean
 */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}