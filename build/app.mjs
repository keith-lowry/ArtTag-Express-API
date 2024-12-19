import express from "express";
import { repo } from "./db/repository.mjs";
import bodyParser from "body-parser";
import { query, validationResult } from "express-validator";
const app = express();
const port = 3000;
// expect bodies to be in json
app.use(bodyParser.json());
// TODO: add general error handler
// TODO: plan out stuff in diagram
/**
 * Get ValidationChain for Tag id query param.
 * @param paramName Name of query param that is a tag id
 * @returns ValidationChain
 */
const createTagIdValidator = (paramName) => {
    return query(paramName)
        .optional()
        .notEmpty()
        .trim()
        .isInt()
        .bail() // fail if not int type
        .customSanitizer(value => BigInt(value)) // convert to bigint
        .custom(value => value >= 0);
};
// OLD METHOD when tags had ids
// app.get("/tags", createTagIdValidator("after_id"), async (req, res) => {
//     try {
//         if (req.query?.after_id){
//             const result = validationResult(req);
//             if (result.isEmpty()){
//                 const id:bigint = req.query.after_id
//                 const data = await repo.getTagsAfterId(id)
//                 res.send(data)
//                 return
//             }
//             console.log(result)
//             res.statusCode = 400;
//             res.send(result)
//             return
//         }
//         const data = await repo.getTags()
//         res.send(data)
//     }
//     catch (error) {
//         res.statusCode = 500
//         res.send("Something went wrong");
//         console.error(error);
//     }
// })
app.get("/tags", async (req, res) => {
    try {
        const data = await repo.getTags();
        res.send(data);
    }
    catch (error) {
        res.statusCode = 500;
        res.send("Something went wrong");
        console.error(error);
    }
});
app.put("/tags", (req, res) => {
    // TODO: validate tag name
    if (req.body.name) {
        repo.insertTag(req.body.name)
            .then(data => {
            res.status(200);
            // TODO: send back name and id of newly created tag
            res.send("Success!");
        })
            .catch(err => {
            console.log(err);
            res.status(500);
            res.send("Something went wrong...");
        });
    }
    else {
        res.status(400);
        res.send("Missing 'name' in JSON body");
    }
});
// TODO: do not need to suport both put and post; decide architecture!!!!
app.post("/images", (req, res) => {
    if (req.body.url) {
        // validate url
        // use HEAD to get mime type, make sure its image
    }
    res.send("TODO: POST images endpoint");
});
// TODO: lock POST/PUT/DELETE access behind token
app.get("/images/similar", (req, res) => {
    res.send("TODO: GET similar endpoint");
    // get filenames of images within certain hamming distance of provided image url
    // default: very very close distance (<= 2) to find duplicates
    // user can provide max distance as query param or in body
});
app.use("/images", express.static("public"));
app.listen(port, () => {
    console.log(`API: listening on port ${port}`);
    // console.log(config["postgres"]);
});
