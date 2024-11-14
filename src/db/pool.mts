import { type QueryResult } from "pg"
import Pool from "pg-pool"



const pool = new Pool()

export const query = (text: string, params: any, callback: (err: Error, result: QueryResult<any>) => void) => {
    return pool.query(text, params,callback)
}