import { type Tag, type Image, type Artist } from "../types.mjs"
import { query } from "./pool.mjs"
import config from "../../config.json" with {type : 'json'}
import format from 'pg-format';

const schema = config.schema

class ArtTagRepository {
    // handle logging within here
    async getTags():Promise<Tag[]> {
        // NOTE: limit size? meh
        const sql = format('SELECT tag as name, EXTRACT(epoch from time_created) as time_created FROM %I.tags ORDER BY time_created ASC', schema);
        const result = await query(sql)
        return result.rows
    }

    async getTagsCreatedAfter(epoch:number):Promise<Tag[]> {
        const sql = format('SELECT tag as name, EXTRACT(epoch from time_created) as time_created FROM %I.tags WHERE EXTRACT(epoch from time_created) > %s ORDER BY time_created ASC', schema, epoch);
        const result = await query(sql);
        return result.rows;
    }

    async getArtists():Promise<Artist[]> {
        const sql = format('SELECT name, EXTRACT(epoch from time_created) as time_created FROM %I.artists ORDER BY time_created ASC', schema);
        const result = await query(sql);
        return result.rows;
    }

    async getArtistsCreatedAfter(epoch:number):Promise<Artist[]> {
        const sql = format('SELECT name, EXTRACT(epoch from time_created) as time_created FROM %I.artists WHERE EXTRACT(epoch from time_created) > %s ORDER BY time_created ASC', schema, epoch);
        const result = await query(sql);
        return result.rows;
    }

    async insertTags(tags: string[]): Promise<boolean> {
        const prepped = tags.map((el, _) => {
            return `(\'${el}\')`
        })
        const sql = format('INSERT INTO %I.tags (tag) VALUES %s ON CONFLICT DO NOTHING', schema, prepped.join(", "))
        // console.log(sql);
        const res = await query(sql);
        // console.log(res);
        return true;
    }

    // async insertArtist(name: string): Promise<boolean> {
    //     try {

    //     }
    //     catch {
            
    //     }

    // }

    getImagesWithTags(tags:Array<string>):Array<Image> {
        return []
    }

    insertImage(filename: string, hash: string): boolean {
        // assert hash is 64 chars long and only contains 0's and 1's
        return false;
    }
}

export const repo = Object.freeze(new ArtTagRepository())