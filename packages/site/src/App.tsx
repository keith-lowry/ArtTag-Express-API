import { Route, Routes } from 'react-router'
import './App.css'
import GalleryPage from './components/gallery-page/GalleryPage'
import PreviewPage from './components/Preview'
import UploadFormModal from './components/upload-form/UploadFormModal'

function App() {

  return (
    <div>
        <Routes>
          <Route path=""  element={<GalleryPage />}/>
          <Route path="preview" element={<PreviewPage />} />
          <Route path="form" element={<UploadFormModal active={true} onClose={(e, reason) => {console.log("closing")}} />} />
        </Routes>
    </div>
  )
}

export default App
