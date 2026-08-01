import { type Request, type Response } from "express";
import {repo} from "../../db/repository.mjs";

/**
 * Attempts to send a list of tags stored in the database. If
 * an epoch time is specified in the query, gets all tags stored
 * after that timestamp.
 */
export async function getTags(req: Request, res:Response): Promise<void> {
    if (req.query?.created_after) {
        const epoch:number = Number(req.query.created_after);
        const data = await repo.getTagsCreatedAfter(epoch);
        res.send(data);
        return;
    }
    const data = await repo.getTags();
    res.send(data);
}

/**
 * Attempts to store the list of tags attached to the request body.
 */
export async function createTags(req: Request, res:Response): Promise<void> {
    await repo.insertTags(req.body.tags)
    res.status(200).send()
}