import React from 'react'
import HeroSection from '../Components/Herosection/Herosection'
import Trending from '../Components/Trending/Trending'
import NewArrivals from '../Components/Newarrivals/Newarrivals'
import ShopByCategory from '../Components/ShopByCategory/ShopByCategory'
import Footer from '../Components/Footer/Footer'

const Home = () => {
  return (
    <>
      <HeroSection />
      <Trending />
      <NewArrivals />
      <ShopByCategory />
      <Footer />
    </>
  )
}

export default Home