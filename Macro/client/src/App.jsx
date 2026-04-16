import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Header from './components/header/header.jsx'
import Module from './components/module/module.jsx'
import Radio from './components/radio/radio.jsx'
import Login from './pages/login/login.jsx'
import Profile from './pages/profile/profile.jsx'
import './App.css'

function App() {
  return (
    <div>
      <BrowserRouter>
          <Routes>

            {/*Main Page: 
              - reroute logged in user to dashboard
              - reroute new user to login page
              */}
            <Route path="/" element={<Navigate to="/dashboard" />}/>

            {/*Dashboard Page*/}
            <Route path="/dashboard" element={
              <div className="bg">
                <Header radio={<Radio/>}/>
                <div className="flex justify-center items-center min-h-screen">
                  <Module/>  
                </div>
              </div>}/>

            {/*Login Page*/}
            <Route path="/login" element={<Login />} />

            {/*Profile Page 
              - will router to /profile/*username* in the future
              - will be the route for both your own profile and other users
            */}
              <Route path="/profile" element={<Profile />} />
          </Routes>
        </BrowserRouter>
    </div>
  )
}

export default App
