import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Header from './components/header/header.jsx'
import Module from './components/module/module.jsx'
import Radio from './components/radio/radio.jsx'
import Login from './pages/login/login.jsx'
import { onAuthChange } from './auth'
import Profile from './pages/profile/profile.jsx'
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

          <Route path="/" element={
            <div>
              <nav>
                <Link to="/dashboard">GO TO DASHBOARD</Link>
              </nav>
            </div>}/>
            {/*Main Page: 
              - reroute logged in user to dashboard
              - reroute new user to login page
              */}
           

          {/* Dashboard — redirect to login if not authenticated */}
          <Route path="/dashboard" element={
            user ? (
              <div className="bg">
                <nav>
                  <Link to="/login">Login</Link>
                </nav>
                <Header radio={<Radio/>}  user={user}/>
                <div className="flex justify-center items-center min-h-screen">
                  <Module/>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }/>

          {/* Login — redirect to dashboard if already authenticated */}
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          }/>

        </Routes>
      </BrowserRouter>
            {/*Profile Page 
              - will router to /profile/*username* in the future
              - will be the route for both your own profile and other users
            */}
              <Route path="/profile" element={<Profile />} />
          
    </div>
  )
}

export default App