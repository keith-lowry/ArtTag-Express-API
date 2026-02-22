import { Route, Routes } from 'react-router'
import './App.css'
import GalleryPage from './components/gallery-page/GalleryPage'

function App() {

  return (
    <div>
        <Routes>
          <Route path="/"  element={<GalleryPage />}/>
        </Routes>
    </div>
  )
}

export default App
