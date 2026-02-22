import sharp from "sharp";
// import phash from "sharp-phash";
import type { ResizeOptions } from "sharp";
import phash from "sharp-phash";
// .mts to specify this as an es module and use top level await

const input = "./goopomancer1.png"
const output = "./hash.jpg"
const get_hash = phash.default
// TODO: use phash lib instead
const opts:ResizeOptions = {
    fit: "fill" // ignore aspect ratio when resizing
}

const buffer:Uint8Array = await sharp(input)
                            .grayscale()
                            .resize(9, 8, opts)
                            .raw()
                            .toBuffer()


let hash = BigInt(0)
let hash_bin = ""

for (let i = 0; i < 8; i++) { // traverse rows
    for (let j = 1; j < 9; j++) { // traverse columns
        const curr = i * 8 + j
        const prev = curr - 1

        // console.log(prev)

        if (buffer[prev] > buffer[curr]) {
            // console.log(prev)
            // hash = hash + Math.pow(2, prev)
            const addthis = BigInt(Math.pow(2, prev))
            // console.log(`Added 2 to the power of ${prev} = ${addthis}`)
            hash += addthis
            hash_bin = "1" + hash_bin
        }
        else {
            hash_bin = "0" + hash_bin
        }
    }
}


// problem i had was that the javascript number type is a floating point
// with all the issues that includes. leads to wrong hash number after adding such big powers of 2.
// use BigInt instead.
const hash_hex = hash.toString(16)
console.log(hash_bin, hash, hash_hex)

// NOTES: as observed with infernal nasus example
// hamming distance of >20 when image is rotated or flipped
// hamming distance of <5 when image is shrunk/resized or colors are slightly played with
// honestly should be fine for our application. not expecting similar images to be rotated
// or flipped, at least for storing.

// for storing: be very STRICT about what counts as a duplicate, very tight bound on hamming
// distance.
// TODO: check with different file types

// for finding similar stored photos: less strict, perhaps take into account possibilities of rotation
// or uh other stuff idk. erm at that point just use AI? or if you're looking for art by same person just
// store artist names


// use this to check if we already have an image stored before  adding it to db
// maybe use other library tho, or do it yourself