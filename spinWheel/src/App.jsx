import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter ,Route , Routes } from 'react-router-dom';
import HomePage from './components/HomePage'
import SpinWheel from './SpinWheel'
import Register from './components/Register';
import Login from './components/loginCmp';


function App() {
 //basename="/wheel"
  return (
     <BrowserRouter >
    <Routes>
    <Route path="/" element={<Login/>}> </Route>
    <Route path="/home" element={<HomePage/>}> </Route>
    <Route path="/spinwheel" element={<SpinWheel />} />
    <Route path="/register" element={<Register />} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
