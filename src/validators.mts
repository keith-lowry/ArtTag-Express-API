import { query, body } from "express-validator";
import { isValidArtistName, isValidTagName } from "./types.mjs";
import config from "../config.json" with {type : 'json'}

const createEpochValidator = (paramName:string) => {
    return query(paramName).optional().notEmpty().trim().isFloat().bail().toFloat().custom(value => value >= 0)
}

const createTagListValidator = (bodyParamName: string, isForm: boolean = false) => {

    const chain = body(bodyParamName)
        .exists()
        .bail()
        .withMessage("tags list is missing")

    // handle different formats param can be passed in formData
    if (isForm) {
        chain.customSanitizer(value => {
            // Option 1: separate key value pairs with same key -> parsed to array alrdy
            if (Array.isArray(value)) {
                return value;
            }
            // Option 2: single key value pair with individual tags separated by TAG_SEPARATOR
            const val = value as String
            return val.split(config.tagSeparator)
        })
    }

    chain.isArray({min: 1, max: 10})
        .withMessage("must be a non-empty array of 1 to 10 tags to insert")
        .bail()
        .customSanitizer(value => {
            const set = new Set<String>();
            const newArr = new Array<String>();
            const arr = value as Array<String>;
            // trim each tag and remove duplicates
            arr.forEach((val, _) => {
                val = val.trim();
                if (!set.has(val)) {
                    set.add(val)
                    newArr.push(val)
                }
            })
            return newArr;
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
    return body(bodyParamName).exists()
        .isArray({min: 1, max: 10})
        .withMessage("must be a non-empty array of 1 to 10 artists to insert")
        .bail()
        .customSanitizer(value => {
            const set = new Set<String>();
            const newArr = new Array<String>();
            const arr = value as Array<String>;
            // trim each artist val and remove duplicates
            arr.forEach((val, _) => {
                val = val.trim();
                if (!set.has(val)) {
                    set.add(val)
                    newArr.push(val)
                }
            })
            return newArr;
            // const arr = value as Array<String>;
            // return arr.map((el, _) => {
            //     return el.trim()
            // })
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

const createBoolValidator = (bodyParamName: string, optional: boolean = false) => {
    const chain = body(bodyParamName).isBoolean().toBoolean()

    if (optional) {
        chain.optional()
    }
    return chain
}

const validators = Object.freeze({
    taglist : createTagListValidator,
    epoch : createEpochValidator,
    artist: createArtistValidator,
    artistlist: createArtistListValidator,
    srcUrl: createSourceUrlValidator,
    bool: createBoolValidator
})



export default validators;