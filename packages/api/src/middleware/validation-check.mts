import { type RequestHandler } from "express";
import { validationResult} from "express-validator";
import { HttpError } from "@arttag/types";

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