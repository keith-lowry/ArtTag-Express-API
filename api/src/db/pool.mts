import { Client, type QueryResult } from "pg"
import config from "../../config.json" with { type: 'json' };
import Pool from "pg-pool"

let pool:Pool<Client>;

/**
 * Create Pool object.
 */
export const dbSetup = async () => {
    pool = new Pool(config.dbInfo);
    
    // test db connection with a dummy query
    try {
        await pool.query("SELECT 1");
        const time = new Date().toISOString();
        console.info(`[${time}] STARTUP: Connected to database`)
    }
    // if DB connection is unsuccessful, log error
    catch {
        const time = new Date().toISOString();
        console.error(`[${time}] ERROR: Failed to connect to database. Please make sure DB parameters in config file are correct.`);
    }
}

export const query = async (text: string, params: any = []):Promise<QueryResult<any>> => {
    return await pool.query(text, params)
}