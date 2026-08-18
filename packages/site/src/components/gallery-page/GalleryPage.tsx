import { useEffect, useRef, useState } from 'react'
// TODO: make separate css file
import { captureOnClick, pubImages } from '../../const';
import IconButton from '@mui/material/IconButton';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';


function GalleryPage() {
  const [focusedImage, setFocusedImage] = useState(-1);

  // NOTE:
  // will have to fetch thumbnails first, do not fetch full images -> uh yeah just get links for both
  // and only show thumbnail in gallery page yeah
  //    -> thumbnails should be center cropped to 320 x 256 pixels
  //    ? what if the image is smaller than that or has weird dimensions, what if its less than 160x128.
  //      |-> just leave as is
  //
  // when overlay is opened, fetch full image by changing link to not pull thumbnail?
  // 

  // handle keyboard navigation when overlay is open
  function handleKeyDown(this:Document, e:KeyboardEvent) {
    // console.log("key down ", e.key);
    switch (e.key) {
        case 'ArrowRight':
          toNextImage();
          break;
        case 'ArrowLeft':
          toPrevImage();
          break;
        case 'Escape':
          closeOverlay();
          break;
        default:
          break;
    }
  }
  const keydownhandler = useRef(handleKeyDown);

  useEffect(() => {
    return () => {
      document.removeEventListener("keydown", keydownhandler.current);
    }
  }, []);

  function toNextImage() {
    setFocusedImage((prevIndex) => {
      if (prevIndex === pubImages.length - 1) {
        return prevIndex;
      }
      return (prevIndex + 1) % pubImages.length;
    });
  }

  function toPrevImage() {
    setFocusedImage((prevIndex) => {
      if (prevIndex === 0) {
        return prevIndex;
      }
      return (prevIndex - 1) % pubImages.length;
    });
  }

  function openOverlay(index: number) {
    setFocusedImage(index);
    document.addEventListener("keydown", keydownhandler.current);
  }

  function closeOverlay() {
    console.log("Closing overlay");
    document.removeEventListener("keydown", keydownhandler.current);
    setFocusedImage(-1);
    // TODO: remove listener when component is unmounted as well to be safer. should only
    // be listening when overlay is open
  }

  return (
    <>
     <div>
      <div className='photogrid'>
        {/* TODO: crop images to be 320 x 256 */}
        {pubImages.map((val, index, _) => {
          return (
          <a key={index} onClick={() => {openOverlay(index)}}>
            <img className='thumbnail' src={val} width='160px' height='128px' loading='lazy' />
          </a>
        )})}
        {/*  TODO: crop images for thumbnail */}
      </div>
      {/* photo overlay */}
      {focusedImage !== -1 && (
        <div className='img-overlay' onClick={closeOverlay}>
          <IconButton size='large' className={'prev-button' + (focusedImage === 0? ' disabled-button' : '')} onClick={(e) => {toPrevImage(); captureOnClick(e);}}>
            <ChevronLeftIcon className='button-icon' />
          </IconButton>
          <span className='centering-helper'/> {/*let's us center the focused-image vertically*/}
          <img className='focused-image' src={pubImages[focusedImage]} onClick={captureOnClick} loading='lazy'/>
          <IconButton size='large' className={'next-button' + (focusedImage === pubImages.length - 1 ? ' disabled-button' : '')} onClick={(e) => {toNextImage(); captureOnClick(e);}}>
            <ChevronRightIcon className='button-icon'/>
          </IconButton>
        </div>
      )}
      </div>
    </>
  )
}

export default GalleryPage
