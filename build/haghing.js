"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const image_hash_1 = require("image-hash");
(0, image_hash_1.imageHash)('E:\Documents\VSCode Projects\ArtTag-Express-API\public\art-tag\images\tj_holds.jpg', 16, true, (error, data) => {
    if (error)
        console.log(error);
    console.log(data);
});
//# sourceMappingURL=haghing.js.map