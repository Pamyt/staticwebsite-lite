import React from 'react'
import { Routes, Route, BrowserRouter } from 'react-router-dom'
import MainPage from './MainPage.jsx'
import AuthCard from './LoginPage.jsx'
import PostPage from './PostPage.jsx'
import MainLayout from './MainLayout.jsx'
import { Navigate } from 'react-router-dom'
import { APIProvider } from '@vis.gl/react-google-maps'
function App () {
  return (
    
      <BrowserRouter>
        <Routes>
          {/* 独立路由（无布局） */}
          <Route path="/login" element={<AuthCard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 需要布局的嵌套路由 */}
          <Route element={<MainLayout />}>
            <Route path="/mainpage" element={<MainPage />} />
            <Route path="/postpage" element={<PostPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
  )
}

export default App
