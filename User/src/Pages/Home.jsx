import { useEffect } from "react";
import useProductStore from "../store/useProductStore";

import HeroSection from "../Components/Herosection/Herosection";
import CategoryShowcase from "../Components/CategoryShowcase/CategoryShowcase";
import Trending from "../Components/Trending/Trending";
import NewArrivals from "../Components/Newarrivals/Newarrivals";
import ShopByCategory from "../Components/ShopByCategory/ShopByCategory";
import Footer from "../Components/Footer/Footer";

const Home = () => {
  // Use selector for better stability
  const fetchLandingPageData = useProductStore(state => state.fetchLandingPageData);

  useEffect(() => {
    if (fetchLandingPageData) {
      console.log("🚀 Initializing landing page data fetch...");
      fetchLandingPageData();
    }
  }, [fetchLandingPageData]);

  return (
    <>
      <HeroSection />
      <CategoryShowcase />
      <Trending />
      <NewArrivals />
      <ShopByCategory />
      <Footer />
    </>
  );
};

export default Home;