import { Route, Routes } from 'react-router'
import './App.css'
import GalleryPage from './components/gallery-page/GalleryPage'
import PreviewPage from './components/Preview'

function App() {

  return (
    <div>
        <Routes>
          <Route path=""  element={<GalleryPage />}/>
          <Route path="preview" element={<PreviewPage />} />
        </Routes>
    </div>
  )
}

export default App
