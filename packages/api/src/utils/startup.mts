import { dbSetup } from "../db/pool.mjs"
import fs from "fs";
import config from "../../config.json" with { type: 'json' };
import { siteBuildPath } from "../app.mjs";

/**
 * Startup function called after the Express app starts
 * listening for connections
 * @param port Port the API listens on
 */
export async function startUp(port:number){
    // set up images folder
    if (!fs.existsSync(config.imagesFolder)) {
        fs.mkdirSync(config.imagesFolder);
        const time = new Date().toISOString();
        console.info(`[${time}] STARTUP: Made images folder ${config.imagesFolder}`)
    }
    else {
        const time = new Date().toISOString();
        console.info(`[${time}] STARTUP: Using images folder ${config.imagesFolder}`)
    }

    // set up db connection
    await dbSetup();

    if (!fs.existsSync(siteBuildPath)) {
        const time = new Date().toISOString();
        console.warn(`[${time}] WARN: Site build folder ${siteBuildPath} does not exist. Please make sure the React app has been built.`);
    }
    else if (fs.readdirSync(siteBuildPath).length === 0) {
        const time = new Date().toISOString();
        console.warn(`[${time}] WARN: Site build folder ${siteBuildPath} is empty. Please make sure the React app has been built.`);
    }

    const start = new Date().toISOString();
    console.info(`[${start}] READY: API listening on port ${port}`);
}