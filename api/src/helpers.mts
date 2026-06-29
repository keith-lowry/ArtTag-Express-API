import { type Request, type Response, type NextFunction, type RequestHandler } from "express";
import multer from "multer";
import config from "../config.json" with { type: 'json' };
import { query, body, validationResult, type ErrorFormatter, type ValidationError } from "express-validator";
import { HttpError } from "./types.mjs";



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
        // call handler, catch any errors and pass to the next
        // error handler in the chain
        Promise.resolve(fn(req, res, next)).catch(next);
    }
}


const imageStorage = multer.memoryStorage()
const imageUpload = multer({storage : imageStorage, limits : {
    fileSize: config.maxFileSizeMB * 1000000,
    files: 1
}}).single("image")

/**
 * Handles the parsing of a single image multipart form data request body using
 * multer. Breaks the chain and throws an HttpError 
 * if something goes wrong.
 * 
 * @param req Request
 * @param res Response
 * @param next Next middleware in chain
 */
export const handleUploadParsing:RequestHandler = (req, res, next) => {
    // pass request to multer middleware
    imageUpload(req, res, (err) => {
        // NOT OK: something went wrong with img upload and MulterError was thrown
        if (err instanceof multer.MulterError) {
            const multerErr = err as multer.MulterError
            if (multerErr.code === 'LIMIT_FILE_SIZE') {
                // console.info(`[INFO] Rejected file greater than ${config.maxFileSizeMB}MB in size`)
                // res.status(413).send(`Your file was larger than the max file size of ${config.maxFileSizeMB}MB`)
                // return
                throw new HttpError(413, `Your file was larger than the max file size of ${config.maxFileSizeMB}MB`, multerErr);
            }
            else if (multerErr.code === 'LIMIT_FILE_COUNT') {
                // console.info('[INFO] Received request with more than one file')
                // res.status(400).send('Only one image file is expected')
                // return
                throw new HttpError(400, 'Only one image file is expected', multerErr);
            }
            else {
                console.error(err)
                // res.status(500).send("Oops! Something unexpected happened")
                // return
                throw new HttpError(500, "Something unexpected happened", multerErr);
            }
        }
        // Some other error object was thrown
        else if (err) {
            // res.status(500).send("Oops! Something unexpected happened")
            console.error(err)
            // return
            throw new HttpError(500, "Something unexpected happened", err);

        }

        // TODO: uh shouldn't we always get an error object in this callback? double check
        // OK: go to next middleware
        next();
    })
}


/**
 * Middleware to check if validation result is not empty. Stops
 * chain and sends 400 to client if true.
 * @param req Request
 * @param res Response
 * @param next Next middleware in chain
 */
export const handleValidationCheck:RequestHandler = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        // console.log(result)
        // const msg:string = result.formatWith<string>(errorFormatter);
        // https://express-validator.github.io/docs/api/validation-result/#mapped
        // NOTE: can check which type of error it is by checking "type" property
        // console.log("VALIDATION ARRAY", result.array());
        // console.log("VALIDATION MAPPED", result.mapped());
        // TODO: should be json?
        throw new HttpError(400, "invalid request", result.array({onlyFirstError: true}));
        // TODO: use formatter for result to format as a string
    }
    else {
        next();
    }
}