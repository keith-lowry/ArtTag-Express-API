import path = require("node:path");

// imageHash(path.join(__dirname, "..\\public\\art-tag\\images\\tj_holds.jpg"), 16, true, (error:object, data:object) => {
//     if (error) console.log(error);
//     console.log(data);
// })
// imageHash(path.join(__dirname, "..\\public\\art-tag\\images\\tj_holds_copy.jpg"), 16, true, (error:object, data:object) => {
//     if (error) console.log(error);
//     console.log(data);
// })
// imageHash("https://pbs.twimg.com/media/GQj-8-HWkAAg8i9.jpg", 16, true, (error:object, data:object) => {
//     if (error) console.log(error);
//     console.log(data);
// })

// use this to check if we already have an image stored before  adding it to db
// maybe use other library tho, or do it yourself