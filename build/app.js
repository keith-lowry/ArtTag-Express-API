"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3000;
// art-tag route for 
app.get("/art-tag", (req, res) => {
    res.send("Help! me!");
});
app.use(express_1.default.static("public"));
app.listen(port, () => {
    console.log(`API: listening on port ${port}`);
    // console.log(config["postgres"]);
});
//# sourceMappingURL=app.js.map