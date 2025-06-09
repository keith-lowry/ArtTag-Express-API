import { type Tag, type Image, type Artist } from "../types.mjs"
import { query } from "./pool.mjs"
import config from "../../config.json" with {type : 'json'}
import format from 'pg-format';
import type { QueryResult } from "pg";
import fs from "fs/promises";
import path from "path";

const schema = config.schema

/**
 * "Dumb" class meant for interacting with persistent DB.
 * No checks are made on any of the parameters to the public functions. 
 * Encase any calls in a try-catch block.
 */
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

    async insertTags(tags: string[]): Promise<QueryResult<any>> {
        const prepped = tags.map((el, _) => {
            return `(\'${el}\')`
        })
        // TODO: can use `RETURNING *` to get back rows inserted
        const sql = format('INSERT INTO %I.tags (tag) VALUES %s ON CONFLICT DO NOTHING', schema, prepped.join(", "))
        // console.log(sql);
        return await query(sql);
        // console.log(res);
    }

    async hasTags(tags: string[]): Promise<boolean> {
        const prepped = tags.map((el, _) => {
            return `\'${el}\'`
        })
        const sql = format('SELECT COUNT(tag) FROM %I.tags WHERE tag in (%s)', schema, prepped.join(", "));
        // console.log(sql);
        const qres = await query(sql);
        // console.log(typeof qres.rows[0].count);
        const count = Number(qres.rows[0].count);
        return count === tags.length;
    }

    async hasArtist(artist: string): Promise<boolean> {
        const sql = format('SELECT COUNT(name) FROM %I.artists WHERE name=\'%s\'', schema, artist);
        const qres = await query(sql);
        const count = Number(qres.rows[0].count);
        return count === 1;
    }

    async insertArtists(artists: string[]): Promise<QueryResult<any>> {
        const prepped = artists.map((el, _) => {
            return `(\'${el}\')`
        })
        const sql = format('INSERT INTO %I.artists (name) VALUES %s ON CONFLICT DO NOTHING', schema, prepped.join(", "))
        return await query(sql);
    }

    async insertImage(file: Buffer, 
            filetype: string, 
            tags:String[], 
            hash: String, 
            artist: string | undefined = undefined, 
            url: string | undefined = undefined,
            nsfw: boolean | undefined = false): Promise<Array<string>> {
        try {
            if (!url) {
                url = "NULL";
            }
            else {
                url = `'${url}'`
            }

            if (!artist) {
                artist = "NULL";
            }
            else {
                artist = `'${artist}'`
            }

            if (nsfw === undefined) {
                nsfw = false
            }

            const args = [
                schema,
                url,
                artist,
                hash,
                hash.substring(0, 16),
                hash.substring(16, 32),
                hash.substring(32, 48),
                hash.substring(48, 64),
                filetype,
                String(nsfw)
            ]

            // begin transaction
            await query("BEGIN");


            // Step 1: insert row to images table
            let template = `INSERT INTO %I.images 
                    (src_url, artist, hash, hash_slice_1, hash_slice_2, hash_slice_3, hash_slice_4, file_type, nsfw) 
                    VALUES (%s, %s, '%s', '%s', '%s', '%s', '%s', '%s', %s) RETURNING *`
            let sql = format.withArray(template, args)
            // console.log(sql)
            const imageRes = await query(sql);
            const row = imageRes.rows[0]
            // const id = row.image_id
            // console.log(qres)
            
            // Step 2: add rows to tagged_images table
            template = `INSERT INTO %I.tagged_images (tag, image_id) VALUES %s`
            const new_rows = tags.map((tag, _) => {
                return `('${tag}', ${row.image_id})`
            })
            sql = format(template, schema, new_rows.join(", "))
            // console.log(sql)
            await query(sql);


            // Step 3: try to save file to disk
            const filePath = path.join(config.imagesFolder, row.filename)
            await fs.writeFile(filePath, file)
            console.info(`[INFO] Successfully wrote ${filePath}`)

            // complete transaction
            await query("COMMIT");
            return imageRes.rows[0];
        }
        catch (error) {
           await query("ROLLBACK");
           throw new Error("insertImage: " + error);
        }

    }
}

export const repo = Object.freeze(new ArtTagRepository())