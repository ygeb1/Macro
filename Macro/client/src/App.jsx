import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Header from './components/header/header.jsx'
import Module from './components/module/module.jsx'
import Radio from './components/radio/radio.jsx'
import Login from './pages/login/login.jsx'
import Profile from './pages/profile/profile.jsx'
import UserProfile from './pages/profile/UserProfile.jsx'
import MyProfile from './pages/profile/MyProfile.jsx'
import Game from './pages/game/game.jsx'
import Search from './pages/search/Search.jsx'
import { onAuthChange } from './auth'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen text-white">
      Loading...
    </div>
  )

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/users/:id" element={<UserProfile user={user} />} />

          <Route path="/profile" element={
            user ? <MyProfile /> : <Navigate to="/login" replace />
          } />
          
          <Route path="/" element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }/>

          <Route path="/games/:id" element={<Game />} />
          <Route path="/search" element={<Search />} />
          <Route path="/dashboard" element={
            user ? (
              <div className="bg">
                <Header radio={<Radio/>} user={user}/>
                <div className="flex justify-center items-center min-h-screen">
                  <Module/>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }/>

          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          }/>

          <Route path="/profile" element={
            user ? <Profile user={user}/> : <Navigate to="/login" replace />
          }/>

        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App