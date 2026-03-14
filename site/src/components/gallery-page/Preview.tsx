import { useEffect, useState } from "react";
import type { ScrapedImage } from "../../types";

function isUrl(s:string): boolean {
    try {
        new URL(s);
        return true;
    }
    catch {
        return false;
    }
}

function PreviewPage() {
    const [postURL, setPostURL] = useState("");
    const [textInput, setTextInput] = useState("");
    const [displayText, setDisplayText] = useState("");
    const [images, setImages] = useState<Array<string>>([]);

    useEffect(() => {
        if (postURL === "") {
            // setDisplayText("nothing yet");
            return;
        }

        if (!isUrl(postURL)) {
            // setDisplayText("not a valid url");
            return;
        }

        fetch(`http://localhost:3000/proxy/post?url=${encodeURIComponent(postURL)}`)
            .then(res => {
                if (!res.ok) {
                    res.json().then(json => {
                        console.error(json);
                    })
                    // throw new Error(`Fetch error ${res.status}: ${res.statusText}`);
                    return;
                }
                return res.json();
            }) 
            .then(json => {
                console.log(json)
                if (!Array.isArray(json)) {
                    throw new Error("Got invalid response from post proxy endpoint " + json);
                }
                const arr = json as Array<object>;
                setDisplayText(JSON.stringify(json, null, 2));
                const scrapedImageUrls = new Array<string>();
                arr.forEach((val) => {
                    // TODO: use type guard for scrapedimage; probably move types.tsx from api to project root
                    if (!Object.keys(val).includes("imgUrl")) {
                        throw new Error("Got invalid data from post proxy endpoint " + val);
                    }
                    const imgObj = val as ScrapedImage;
                    scrapedImageUrls.push(imgObj.imgUrl);
                })
                setImages(scrapedImageUrls);
            })
            .catch((e:Error) => {
                console.error(e);
            });
    }, [postURL]);

    return (
        <div style={{display:"flex", flexDirection: "column", alignItems: "center"}}>
            <h2>Debug Image Preview</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                setPostURL(textInput)
            }}>
                <input 
                    type="text"
                    value={textInput}
                    onChange={(e) => {setTextInput(e.target.value)}}
                    placeholder="Enter post url here"
                />

                <button type="submit">Submit</button>
            </form>
            {displayText.length > 0 && <pre style={{textAlign: "left", backgroundColor:"#444242", padding:"2em"}}>{displayText}</pre>}
            {images.length === 0 && <p>Nothing yet</p>}
            <div style={{display:"flex", flexDirection: "column"}}>
                {images.map((url, index) => {
                    return (<img key={index} src={url} height={"auto"} width={"500"}/>)
                })}
            </div>
            
        </div>
    )
}

export default PreviewPage;