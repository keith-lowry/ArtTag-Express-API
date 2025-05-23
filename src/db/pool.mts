import { type QueryResult } from "pg"
import config from "../../config.json" with { type: 'json' };
import Pool from "pg-pool"



const pool = Object.freeze(new Pool(config.dbInfo))

// export const query = (text: string, params: any, callback: (err: Error, result: QueryResult<any>) => void) => {
//     return pool.query(text, params,callback)
// }

export const query = async (text: string, params: any = []):Promise<QueryResult<any>> => {
    return await pool.query(text, params)
}