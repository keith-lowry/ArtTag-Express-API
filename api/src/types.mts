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
export interface XImageInfo {
    backgroundColor: Object,
    cropCandidates: Array<Object>,
    expandedUrl: string,
    url: string,
    width: number,
    height: number
}

export interface TweetTombstone {
    __typename: 'TweetTombstone'
}

const TAG_SEPARATOR = " ";

export function isTweetTombstone(o: unknown): o is TweetTombstone {
    return o !== null && 
        typeof o === "object" && 
        Object.keys(o).includes("__typename") && 
        (o as TweetTombstone).__typename === "TweetTombstone";
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