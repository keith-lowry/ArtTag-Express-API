import { query, body } from "express-validator";
import { isValidArtistName, isValidTagName } from "./types.mjs";

const createEpochValidator = (paramName:string) => {
    return query(paramName).optional().notEmpty().trim().isFloat().bail().toFloat().custom(value => value >= 0)
}

const createTagListValidator = (bodyParamName: string, coerce: boolean = false) => {

    const chain = body(bodyParamName)

    if (coerce) {
        chain.toArray()
    }

    chain.isArray({min: 1, max: 10})
        .withMessage("must be a non-empty array of 1 to 10 tags to insert")
        .bail()
        .customSanitizer(value => {
            const arr = value as Array<String>;
            return arr.map((el, _) => {
                return el.trim()
            })
        })
        .custom(value => {
            const arr = value as Array<String>;
            for (let i = 0; i < arr.length; i++) {
                if (!isValidTagName(arr[i])) {
                    return Promise.reject(`\'${arr[i]}\' is not a valid tag name`)
                }
            }
            return true;
        });
    return chain;
}

const createArtistListValidator = (bodyParamName:string) => {
    return body(bodyParamName)
        .isArray({min: 1, max: 10})
        .withMessage("must be a non-empty array of 1 to 10 artists to insert")
        .bail()
        .customSanitizer(value => {
            const arr = value as Array<String>;
            return arr.map((el, _) => {
                return el.trim()
            })
        })
        .custom(value => {
            const arr = value as Array<String>;
            for (let i = 0; i < arr.length; i++) {
                if (!isValidArtistName(arr[i])) {
                    return Promise.reject(`\'${arr[i]}\' is not a valid tag name`)
                }
            }
            return true;
        });
}

const createSourceUrlValidator= (urlParamName:string, optional: boolean = false) => {
    const chain = body(urlParamName)
        .isURL()
        .withMessage("invalid url")
        .bail()
        .customSanitizer(value => new URL(value));

    if (optional) {
        chain.optional()
    }
    return chain;
}

const createArtistValidator = (artistParamName:string, optional: boolean = false) => {
    const chain = body(artistParamName)
        .isString()
        .trim()
        .notEmpty()
        .bail()
        .custom(value => {
            if (!isValidArtistName(value)) {
                return Promise.reject(`${value} is not a valid artist name`)
            }
            return true;
        });

    if (optional) {
        chain.optional()
    }
    return chain;
}

const validators = Object.freeze({
    taglist : createTagListValidator,
    epoch : createEpochValidator,
    artist: createArtistValidator,
    artistlist: createArtistListValidator,
    srcUrl: createSourceUrlValidator
})



export default validators;