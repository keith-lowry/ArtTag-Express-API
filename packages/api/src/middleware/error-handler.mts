import type { ErrorRequestHandler } from "express";
import { isHttpError, HttpError } from "@arttag/types";

/**
 * Global error handler for errors thrown by (possibly asynchronous)
 * middleware.
 * 
 * @param err Error, ideally an instance of HttpError
 * @param req The Request
 * @param res The API's Response
 * @param next Next middleware in the chain
 * @returns 
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    // handle case when request was already responded to by api
    if (res.headersSent) {
        console.log("HEADERS SENT ALREADY ERR");
        return next(err);
    }

    // log timestamp, request method, and url
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}]`, req.method + " " + req.originalUrl, err);

    // generic error, just respond with 500
    if (!isHttpError(err)) {
        console.log("IS NOT HTTP ERROR", err);
        res.status(500).json({"error" : "Internal server error"});
        return;
    }

    // http error - send response with details and status code
    const httperr = err as HttpError;
    // NOTE: if status is not in error range, just use 500 as a catch-all
    const statusCode = (httperr.status >= 400 && httperr.status <= 511)? httperr.status : 500;
    res.status(statusCode).json({
        "error" : httperr.message,
        "details" : httperr.details
    })
}