import React from 'react'
import { Routes, Route, BrowserRouter } from 'react-router-dom'
import PaperList from './PaperList.jsx'
import PaperDetail from './PaperDetail.jsx'

function App () {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaperList />} />
        <Route path="/paper/:id" element={<PaperDetail />} />
      </Routes></BrowserRouter>
  )
}

export default App
