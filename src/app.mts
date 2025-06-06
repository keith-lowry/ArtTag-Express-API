import express from "express";
import { repo } from "./db/repository.mjs";
import { isValidArtistName, isValidTagName } from "./types.mjs";
import bodyParser from "body-parser";
import { query, body, validationResult } from "express-validator";
// TODO: use multer for handling image uploads


const app = express();
const port = 3000;

app.use(bodyParser.json())

/**
 * Get ValidationChain for Tag id query param.
 * @param paramName Name of query param that is a tag id
 * @returns ValidationChain
 */
// const createTagIdValidator = (paramName:string) => {
//     return query(paramName)
//         .optional()
//         .notEmpty()
//         .trim()
//         .isInt()
//         .bail() // fail if not int type
//         .customSanitizer(value => BigInt(value)) // convert to bigint
//         .custom(value => value >= 0)
// }

const createEpochValidator = (paramName:string) => {
    return query(paramName).optional().notEmpty().trim().isFloat().bail().toFloat().custom(value => value >= 0)
}

const createTagListValidator = (bodyParamName: string) => {
    return body(bodyParamName)
        .isArray({min: 1, max: 10})
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


app.get("/tags/list", createEpochValidator("created_after"), async (req, res) => {
    try {
        if (req.query?.created_after) {
            const result = validationResult(req)

            // created_after query value is ok
            if (result.isEmpty()){
                const epoch:number = req.query.created_after
                const data = await repo.getTagsCreatedAfter(epoch)
                res.send(data)
                return
            }
            
            // query value not ok: bad request
            console.log(result)
            res.statusCode = 400;
            res.send(result)
            return
        }
        const data = await repo.getTags()
        res.send(data)
    }
    catch (error) {
        res.statusCode = 500
        res.send("Something went wrong");
        console.error("[ERROR] /tags/list:",error);
    }
})

app.put("/tags/create", createTagListValidator("tags"),async (req, res) => {
    try {
        const result = validationResult(req);

        // tag name failed validation or does not exist
        if (!result.isEmpty()) {
            console.log(result)
            res.statusCode = 400;
            res.send(result)
            return
        }
        await repo.insertTags(req.body.tags)
        res.status(200).send()
    }
    catch (error) {
        res.statusCode = 500
        res.send("Something went wrong");
        console.error("[ERROR] /tags/create:", error)
    }
})

app.get("/artists/list", createEpochValidator("created_after"), async (req, res) => {
    try {
        if (req.query?.created_after) {
            const result = validationResult(req)

            // created_after query value is ok
            if (result.isEmpty()){
                const epoch:number = req.query.created_after
                const data = await repo.getArtistsCreatedAfter(epoch)
                res.send(data)
                return
            }
            
            // query value not ok: bad request
            console.log(result)
            res.statusCode = 400;
            res.send(result)
            return
        }
        const data = await repo.getArtists()
        res.send(data)
    }
    catch (error) {
        res.statusCode = 500
        res.send("Something went wrong");
        console.error(error);
    }
})

app.put("/artists/create", createArtistListValidator("artists"), async (req, res) => {
    try {
        const result = validationResult(req);

        // artist name failed validation or does not exist
        if (!result.isEmpty()) {
            console.log(result)
            res.statusCode = 400;
            res.send(result)
            return
        }
        
        await repo.insertArtists(req.body.artists)
        res.status(200).send()
    }
    catch (error) {
        res.statusCode = 500
        res.send("Something went wrong");
        console.error("[ERROR] /artists/create:", error)
    }
})


app.post("/images", async (req, res) => {
    if (req.body.image) {
        console.log(req.body.image)
        // validate image
            // use HEAD to get mime type, make sure its image

    }
    res.send("TODO: POST images endpoint")
})
// TODO: lock POST/PUT/DELETE access behind token

app.get("/images/similar", (req, res) => {
    res.send("TODO: GET similar endpoint");
    // get filenames of images within certain hamming distance of provided image url
    // default: very very close distance (<= 2) to find duplicates
    // user can provide max distance as query param or in body
})

app.use("/images", express.static("public"))

app.listen(port, () => {
    console.log(`API: listening on port ${port}`);
    // console.log(config["postgres"]);
})