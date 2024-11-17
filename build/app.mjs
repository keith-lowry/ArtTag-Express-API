import express from "express";
import { repo } from "./db/repository.mjs";
import bodyParser from "body-parser";
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.get("/tags", async (req, res) => {
    try {
        if (req.query.afterid) {
            if (typeof req.query.afterid != 'string') {
                res.send(`Invalid query param: ${req.query.afterid}`);
                return;
            }
            let id = 0n;
            try {
                id = BigInt(req.query.afterid);
            }
            catch (error) {
                res.sendStatus(400);
                return;
            }
            const tags = await repo.getTagsAfterId(id);
            res.send(tags);
            return;
        }
        res.send(repo.getTags());
    }
    catch (error) {
        res.sendStatus(500);
        console.error(error);
    }
    // // query params: afterid, id
    // // req.query.queryparamname
    // if (req.query.afterid) {
    // //    console.log(req.query.afterid)
    //    res.send(req.query)
    //    return
    // }
    // repo.getTags().then(data => {
    //     // console.log(data)
    //     res.send(data)
    // })
    // .catch(err => {
    //     console.log(err)
    //     res.send("Server issue idk lol")
    // })
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
