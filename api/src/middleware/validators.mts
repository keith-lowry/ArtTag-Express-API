import { query, body, param } from "express-validator";
import { isValidArtistName, isValidTagName } from "@arttag/types";
import config from "../../config.json" with {type : 'json'}

const createEpochValidator = (paramName:string) => {
    return query(paramName)
        .optional()
        .notEmpty()
        .trim()
        .isFloat()
        .bail()
        .withMessage(`query parameter ${paramName} must be a float value`)
        .toFloat()
        .custom(value => value >= 0)
        .withMessage(`query parameter ${paramName} must be greater than or equal to 0`);
}

/**
 * Creates a validator that checks if the tags list param
 * provided in the request body exists, has at least 1 entry
 * and no more than maxSize entries, and contains all valid tag
 * names.
 * @param artistParamName Name of body param that should contain an artist name
 * @param optional Is the artist body param optional?
 * @param isForm
 * @returns Validator for checking tags list body param on request
 */
const createTagListValidator = (bodyParamName: string, maxSize: number, isForm: boolean = false) => {

    const chain = body(bodyParamName)
        .exists()
        .bail()
        .withMessage(`body parameter ${bodyParamName} is missing`);

    // handle different formats param can be passed in formData
    if (isForm) {
        chain.customSanitizer(value => {
            // Option 1: separate key value pairs with same key
            // -> parsed to array already by request parser
            if (Array.isArray(value)) {
                return value;
            }
            
            // Option 2: single key value pair with individual tags separated by TAG_SEPARATOR
            const val = value as String
            return val.split(config.tagSeparator)
        })
    }

    // NOTE: do not need to re-assign to chain variable
    // chain functions modify the chain object in-place
    
    chain.isArray({min: 1, max: maxSize})
        .withMessage(`body parameter ${bodyParamName} must be a non-empty array of 1 to 10 tags to insert`)
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

const createArtistListValidator = (bodyParamName:string, maxSize: number) => {
    return body(bodyParamName).exists()
        .isArray({min: 1, max: maxSize})
        .withMessage(`body parameter ${bodyParamName} must be a non-empty array of 1 to ${maxSize} artists to insert`)
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
        .withMessage(`body parameter ${urlParamName} should be a valid URL`);

    if (optional) {
        chain.optional()
    }
    return chain;
}

/**
 * Creates a validator that checks if the artist name
 * provided in the request body exists and is valid.
 * @param artistParamName Name of body param that should contain an artist name
 * @param optional Is the artist body param optional?
 * @returns Validator for checking arist name body param on request
 */
const createArtistValidator = (artistParamName:string, optional: boolean = false) => {
    const chain = body(artistParamName)
        .isString()
        .trim()
        .notEmpty()
        .bail()
        .withMessage(`body parameter ${artistParamName} should be a non-empty string`)
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
    const chain = body(bodyParamName)
        .isBoolean()
        .withMessage(`body parameter ${bodyParamName} should be a boolean`)
        .toBoolean();

    if (optional) {
        chain.optional();
    }
    return chain
}

const createStringQueryParamValidator = (queryParamName: string) => {
    return query(queryParamName)
        .exists()
        .bail()
        .withMessage(`missing query param \'${queryParamName}\'`)
        // .withMessage("param not present")
        .isString()
        .bail()
        .withMessage(`query param \'${queryParamName}\' should be a string`)
        .bail()
        .trim()
        .notEmpty()
        .withMessage(`query param \'${queryParamName}\' should be a nonempty string`);
}

const validators = Object.freeze({
    taglist : createTagListValidator,
    epoch : createEpochValidator,
    artist: createArtistValidator,
    artistlist: createArtistListValidator,
    srcUrl: createSourceUrlValidator,
    bool: createBoolValidator,
    stringQuery : createStringQueryParamValidator
})



export default validators;