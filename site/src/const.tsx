export const pubImages = [
    "1.jpg",
    "2.jpg",
    "3.png",
    "4.jpg",
    "5.jpg"
]

/**
 * Stop the propagation of onClick event to
 * ancestor elements.
 * @param e onClick Event
 */
export const captureOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
}