import {} from "../types.js";
import { query } from "./pool.mjs";
import config from "../../config.json" assert { type: 'json' };
import format from 'pg-format';
const schema = config.schema;
class ArtTagRepository {
    // handle logging within here
    async getTags() {
        // NOTE: limit size? meh
        const sql = format('SELECT * FROM %I.tags', schema);
        const result = await query(sql);
        return result.rows;
    }
    async insertTag(name) {
        const sql = format('INSERT INTO %I.tags (tag_name) VALUES (\'%s\') ON CONFLICT DO NOTHING', schema, name);
        const res = await query(sql);
        console.log(res);
        return true;
    }
    getImagesWithTags(tags) {
        return [];
    }
    insertImage(filename, hash) {
        // assert hash is 64 chars long and only contains 0's and 1's
        return false;
    }
}
export const repo = Object.freeze(new ArtTagRepository());
