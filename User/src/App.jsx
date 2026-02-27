import React from 'react'
import Navbar from './Components/Navbar/Navbar'
import HeroSection from './Components/Herosection/Herosection'
import NewArrivals from './Components/Newarrivals/Newarrivals'

const App = () => {
  return (
    <div>
      <Navbar/>
      <HeroSection/>
      <NewArrivals />
    </div>
  )
}

export default App