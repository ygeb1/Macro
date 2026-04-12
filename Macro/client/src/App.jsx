import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Header from './components/header/header.jsx'
import Module from './components/module/module.jsx'
import Radio from './components/radio/radio.jsx'
import Login from './pages/login/login.jsx'
import './App.css'

function App() {
  return (
    <div>
      <BrowserRouter>
          <Routes>

            <Route path="/" element={
              <div>
                <nav>
                  <Link to="/dashboard">GO TO DASHBOARD</Link>
                </nav>
              </div>}/>

            {/*Dashboard Page*/}
            <Route path="/dashboard" element={
              <div className="bg">
                <nav>
                  <Link to="/login">Login</Link>
                </nav>
                <Header radio={<Radio/>}/>
                <div className="flex justify-center items-center min-h-screen">
                  <Module/>  
                </div>
              </div>}/>

            {/*Login Page*/}
            <Route path="/login" element={<Login />} />

          </Routes>
        </BrowserRouter>
    </div>
  )
}

export default App
