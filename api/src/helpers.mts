import { type Request, type Response, type NextFunction, type RequestHandler } from "express";

/**
 * Wrapper for catching errors thrown by asynchronous
 * request handlers and passing them to the next error
 * handler in the chain.
 * 
 * @param fn RequestHandler that may contain asynchronous code that can throw an error
 * @returns A new RequestHandler
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    }
}