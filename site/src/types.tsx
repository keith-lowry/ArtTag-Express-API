export interface ScrapedImage {
    /**
     * URL for the post this image came from
     */
    postUrl: string,
    /**
     * URL for the image content
     */
    imgUrl: string,
    /**
     * Social media handle for the post author
     */
    postAuthor: string,
    /**
     * Filename of the image
     */
    filename: string
}