"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const image_hash_1 = require("image-hash");
const path = require("node:path");
(0, image_hash_1.imageHash)(path.join(__dirname, "..\\public\\art-tag\\images\\tj_holds.jpg"), 16, true, (error, data) => {
    if (error)
        console.log(error);
    console.log(data);
});
(0, image_hash_1.imageHash)(path.join(__dirname, "..\\public\\art-tag\\images\\tj_holds_copy.jpg"), 16, true, (error, data) => {
    if (error)
        console.log(error);
    console.log(data);
});
(0, image_hash_1.imageHash)(path.join(__dirname, "..\\public\\art-tag\\images\\tj_holds_copy.png"), 16, true, (error, data) => {
    if (error)
        console.log(error);
    console.log(data);
});
//# sourceMappingURL=hashing.js.map