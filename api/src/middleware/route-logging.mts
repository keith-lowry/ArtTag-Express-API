import { type Request, type Response, type NextFunction, type RequestHandler } from "express";

/**
 * Route logging middleware
 * 
 * Log the 
 * - UTC time
 * - request method
 * - response status code
 * - url
 * - time to respond
 * for every endpoint response
 */
export const logRoute = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on("finish", () => {
        const timestamp = new Date().toISOString();
        const duration = Date.now() - start;
        console.log(
            `[${timestamp}] ${res.statusCode} ${req.method} ${req.originalUrl} (${duration} ms)`
        );
    })
    next();
}