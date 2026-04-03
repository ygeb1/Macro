import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import Header from './components/header/header.jsx'
import Module from './components/module/module.jsx'
import Radio from './components/radio/radio.jsx'
import './App.css'

function App() {
  return (
    <div>
      <div className="bg">
        <Header radio={<Radio/>}/>
        <div className="flex justify-center items-center min-h-screen">
          <Module/>  
        </div>
      </div>
    </div>
  )
}

export default App
