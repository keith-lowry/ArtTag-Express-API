import { useState } from 'react';
import './UploadFormModal.css';
import { isObject, isString } from '@arttag/types';
import { Dialog, DialogContent, DialogTitle, Modal, TextField } from '@mui/material';
import { useFilePicker } from 'use-file-picker';

class StoreFormData {
    readonly src_url: string = "";
    readonly artist: string = "unknown";
    readonly nsfw: boolean = false;
    readonly tags: string[] = [];

    constructor(
        src_url?:string,
        artist?:string,
        nsfw?: boolean,
        tags?: string[]
    ) {
        if (src_url !== undefined) {
            this.src_url = src_url;
        }

        if (artist !== undefined) {
            this.artist = artist;
        }

        if (nsfw !== undefined) {
            this.nsfw = nsfw;
        }

        if (tags !== undefined) {
            this.tags = tags;
        }
    }

    /**
     * Type guard for StoreFormData type
     * @param o Unknown object
     * @returns True if o is of type StoreFormData
     */
    public static isStoreFormData(o:unknown): o is StoreFormData {
        if (!isObject(o)) {
            return false;
        }

        // check o has all the necessary fields
        if (!(Object.hasOwn(o, "src_url")
        && Object.hasOwn(o, "artist")
        && Object.hasOwn(o, "nsfw")
        && Object.hasOwn(o, "tags"))) 
        {
            return false;
        }

        const data = o as StoreFormData;

        // check typing of o's fields
        if (!(isString(data.src_url)
            && isString(data.artist)
            && typeof(data.nsfw) === "boolean")) {
                return false;
        }

        // make sure tags array contains only strings
        // if it is not empty
        if (data.tags.length > 0) {
            for (let i = 0; i < data.tags.length; i++) {
                if (!isString(data.tags[i])) {
                    return false;
                }
            }
        };

        return true;
    }
}

interface UploadFormProps {
    active: boolean,
    onClose: (event: {}, reason: "backdropClick" | "escapeKeyDown") => void | undefined
}

function UploadFormModal({active, onClose} : UploadFormProps) {
    // const [displayMode, setDisplayMode] = useState<string>("block");
    const [formData, setFormData] = useState<StoreFormData>(new StoreFormData());
    const { openFilePicker, filesContent, loading } = useFilePicker({
        accept: ".png",
        multiple: false,
        // NOTE: can read into an array buffer if desired
        // TODO: probably want to read as array buffer? and then
        // turn to blob and get data url for img preview
        readAs:  'DataURL'
        
    });

    new Blob()

    return (
        // reference https://v7.mui.com/material-ui/react-dialog/
        <Dialog open={active} onClose={onClose}>
            <DialogTitle>
                Upload Image
            </DialogTitle>
            <DialogContent>
                <form className='store-image-form'>
                    {/* <img src="?" style={{width:"320px", height:"256px", background:"lightslategray"}}>
                        
                    </img> */}
                    <button onClick={() => openFilePicker()}>
                        Pick File
                    </button>
                    {
                        filesContent.map((file, index) => (
                            // TODO: properly resize img
                            <img key={index} src={file.content} style={{width:"320px", height:"256px"}}></img>
                        )) 
                    }
                    <TextField autoFocus required id="src_url" name="url" label="Source URL" type="url" fullWidth variant="standard" />
                    {/* TODO: file input field */}
                </form>
            </DialogContent>
        </Dialog>
        // </div>
    )
}

export default UploadFormModal;