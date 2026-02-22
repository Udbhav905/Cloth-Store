import React, { useEffect } from 'react'
import Navbar from './Components/Navbar'
import HeroSection from './Components/HeroSection'
import NewArrivals from './Components/NewArraivals'
import CategorySection from './Components/CategorySection'
import TrendingSection from './Components/TrendingSection'
import { useState } from 'react'
import SplashScreen from './Components/SplashScreen'
import Footer from './Components/Footer'

const App = () => {
    const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate data loading with timeout
    const loadData = setTimeout(() => {
      // Create dummy data
      const dummyData = {
        products: [
          { id: 1, name: 'Luxury Watch', price: 599 },
          { id: 2, name: 'Designer Bag', price: 899 },
          { id: 3, name: 'Silk Scarf', price: 199 }
        ],
        message: 'Data loaded successfully'
      };
      
      setData(dummyData);
      console.log('Data loaded:', dummyData);
    }, 5000); // 5 seconds to match splash screen duration

    return () => clearTimeout(loadData);
  }, []);

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }
  return (
    <div>
      <Navbar />
      <HeroSection/>
      <CategorySection />
      <NewArrivals />
      <TrendingSection />
      <Footer/>
    </div>
  )
}

export default App