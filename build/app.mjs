import express from "express";
import { repo } from "./db/repository.mjs";
import bodyParser from "body-parser";
import assert from "node:assert";
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.get("/tags", async (req, res) => {
    try {
        if (req.query.afterid) {
            let id = 0n;
            try {
                assert.ok(typeof req.query.afterid === 'string');
                id = BigInt(req.query.afterid);
                assert.ok(id >= 0, "afterid is less than 0");
            }
            catch (error) {
                console.log("error");
                res.statusCode = 400;
                res.send("afterid must be a positive integer");
                return;
            }
            const tags = await repo.getTagsAfterId(id);
            res.send(tags);
            return;
        }
        res.send(repo.getTags());
    }
    catch (error) {
        res.statusCode = 500;
        res.send("Something went wrong");
        console.error(error);
    }
});
app.put("/tags", (req, res) => {
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
app.get("/images", (req, res) => {
    res.send("TODO: GET images endpoint");
});
// TODO: do not need to suport both put and post; decide architecture!!!!
app.post("/images", (req, res) => {
    res.send("TODO: POST images endpoint");
});
app.put("/images", (req, res) => {
    res.send("TODO: PUT images endpoint");
    // update image that is already in store, add tags
});
// TODO: lock POST/PUT/DELETE access behind token
app.get("/images/similar", (req, res) => {
    res.send("TODO: GET similar endpoint");
    // get filenames of images within certain hamming distance of provided image url
    // default: very very close distance (<= 2) to find duplicates
    // user can provide max distance as query param or in body
});
// serve
app.use("/images", express.static("public"));
app.listen(port, () => {
    console.log(`API: listening on port ${port}`);
    // console.log(config["postgres"]);
});
