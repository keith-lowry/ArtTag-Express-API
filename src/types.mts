export interface Image {
    image_id: BigInt,
    filename: string,
    hash: string,
}

export interface Tag {
    tag : string,
    time_created: string // ms since epoch
}

export interface Artist {
    artist: string,
    time_created: string // ms since epoch
}