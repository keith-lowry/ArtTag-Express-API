import { type Tag, type Image } from "../types.js"

import { query } from "./pool.mjs"

class ArtTagRepository {
    // handle logging within here
    getTags():Array<Tag> {
        // TODO
        return []
    }

    insertTag(name: string): boolean {
        // TODO
        return false
    }

    getImagesWithTags(tags:Array<string>):Array<Image> {
        return []
    }

    insertImage(filename: string, hash: string): boolean {
        // assert hash is 64 chars long and only contains 0's and 1's
        return false
    }
}

export const repo = Object.freeze(new ArtTagRepository())