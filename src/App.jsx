import React from 'react'
import { Routes, Route, BrowserRouter } from 'react-router-dom'
import MainPage from './MainPage.jsx'
import PaperDetail from './PaperDetail.jsx'
import LoginPage from './LoginPage.jsx'
import { APIProvider } from '@vis.gl/react-google-maps'
function App () {
  return (
    <APIProvider apiKey={'AIzaSyD8kz0EW1KKo8B3I8GU7nAy19R8S6X6RVE'}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/paper/:id" element={<PaperDetail />} />
        </Routes></BrowserRouter></APIProvider>
  )
}

export default App
