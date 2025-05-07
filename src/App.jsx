import React from 'react'
import { Routes, Route, BrowserRouter } from 'react-router-dom'
import MainPage from './MainPage.jsx'
import PaperDetail from './PaperDetail.jsx'

function App () {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/paper/:id" element={<PaperDetail />} />
      </Routes></BrowserRouter>
  )
}

export default App
