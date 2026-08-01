import { type Request, type Response } from "express";
import {repo} from "../../db/repository.mjs";

/**
 * Attempts to send a list of artists stored in the database. If
 * an epoch time is specified in the query, gets all artists stored
 * after that timestamp.
 */
export async function getArtists(req: Request, res:Response): Promise<void> {
    if (req.query?.created_after) {
        const epoch:number = Number(req.query.created_after)
        const data = await repo.getArtistsCreatedAfter(epoch)
        res.send(data)
        return
    }

    const data = await repo.getArtists();
    res.send(data);
}

/**
 * Attempts to store a list of artist names on the request body.
 */
export async function createArtists(req: Request, res:Response): Promise<void> {
    await repo.insertArtists(req.body.artists);
    res.status(200).send();
}