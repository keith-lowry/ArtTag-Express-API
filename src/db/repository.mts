import { type Tag, type Image, type Artist } from "../types.mjs"
import { query } from "./pool.mjs"
import config from "../../config.json" with {type : 'json'}
import format from 'pg-format';

const schema = config.schema
const TAG_SEPARATOR = " ";

class ArtTagRepository {

    /**
     * Checks if a given string is a valid tag name that can be stored.
     * @param tag string
     * @returns True if tag is a valid tag name.
     */
    validTag(tag:string):boolean {
        return (tag.length <= 50 && !tag.includes(TAG_SEPARATOR));
    }

    /**
     * Checks if a given string is a valid artist name that can be stored.
     * @param artist string
     * @returns True if artist is a valid artist name.
     */
    validArtist(artist:string):boolean{
        return (artist.length <= 50);
    }

    // handle logging within here
    async getTags():Promise<Tag[]> {
        // NOTE: limit size? meh
        const sql = format('SELECT tag, EXTRACT(epoch from time_created) as time_created FROM %I.tags ORDER BY time_created ASC', schema);
        const result = await query(sql)
        return result.rows
    }

    async getTagsCreatedAfter(epoch:number):Promise<Tag[]> {
        const sql = format('SELECT tag, EXTRACT(epoch from time_created) as time_created FROM %I.tags WHERE EXTRACT(epoch from time_created) > %s ORDER BY time_created ASC', schema, epoch);
        const result = await query(sql);
        return result.rows;
    }

    async getArtists():Promise<Artist[]> {
        const sql = format('SELECT name as artist, EXTRACT(epoch from time_created) as time_created FROM %I.artists ORDER BY time_created ASC', schema);
        const result = await query(sql);
        return result.rows;
    }

    async getArtistsCreatedAfter(epoch:number):Promise<Artist[]> {
        const sql = format('SELECT name as artist, EXTRACT(epoch from time_created) as time_created FROM %I.artists WHERE EXTRACT(epoch from time_created) > %s ORDER BY time_created ASC', schema, epoch);
        const result = await query(sql);
        return result.rows;
    }

    async insertTag(name: string): Promise<boolean> {
        const sql = format('INSERT INTO %I.tags (tag_name) VALUES (\'%s\') ON CONFLICT DO NOTHING', schema, name)
        const res = await query(sql);
        // console.log(res);
        return true;
    }

    getImagesWithTags(tags:Array<string>):Array<Image> {
        return []
    }

    insertImage(filename: string, hash: string): boolean {
        // assert hash is 64 chars long and only contains 0's and 1's
        return false;
    }
}

export const repo = Object.freeze(new ArtTagRepository())