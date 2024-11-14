import {} from "pg";
import config from "../../config.json" assert { type: 'json' };
import Pool from "pg-pool";
const pool = new Pool(config.dbInfo);
// export const query = (text: string, params: any, callback: (err: Error, result: QueryResult<any>) => void) => {
//     return pool.query(text, params,callback)
// }
export const query = async (text, params = []) => {
    return await pool.query(text, params);
};
