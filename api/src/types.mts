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

const TAG_SEPARATOR = " ";

export function isXPostInfo(json: unknown): json is XPostInfo {
    return json !== null && 
        typeof json === "object" && 
            Object.keys(json).includes("photos") 
            // TODO: figure out how to type check photos entry
            //&&
            // isXImageInfo(json["photos"]);
}

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