import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Layout
import Navbar from './Components/Navbar/Navbar'

// Pages
import Home from './Pages/Home'
import Collections from './Pages/Collections'
import CollectionDetail from './Pages/CollectionDetail'
import AuthModal from './Components/Authmodal/Authmodal'
import CategoryPage from './Pages/CategoryPage'
// import ProductDetail from './Pages/ProductDetail'
// import MyOrders from './Pages/MyOrders'
// import Wishlist from './Pages/Wishlist'
// import StyleProfile from './Pages/StyleProfile'
// import Settings from './Pages/Settings'
// import NotFound from './Pages/NotFound'

const App = () => {
  return (
    <BrowserRouter>
      {/* Navbar sits outside Routes so it shows on every page */}
      <Navbar />
      <AuthModal />

      <Routes> 
        {/* ── Home ── */}
        <Route path="/" element={<Home />} />

        {/* ── Collections ── */}
        {/* /collections  →  all collections grid */}
         {/* <Route path="/collections" element={<Collections />} />  */}
        {/* /collections/evening-gowns  →  specific collection */}
         <Route path="/collections/:slug" element={<CategoryPage />} />
         {/* <Route path="/collections/:slug" element={<CollectionDetail />} />  */}

        {/* ── Products ── */}
        {/* /products/1  →  specific product detail */}
        {/* <Route path="/products/:id" element={<ProductDetail />} />  */}

        {/* ── Account pages (from profile dropdown) ── */}
        {/* <Route path="/my-orders"     element={<MyOrders />} /> */}
        {/* <Route path="/wishlist"       element={<Wishlist />} />
        <Route path="/style-profile"  element={<StyleProfile />} />
        <Route path="/settings"       element={<Settings />} />

        {/* ── 404 catch-all ── */}
        {/* <Route path="*" element={<NotFound />} />  */}
      </Routes> 
    </BrowserRouter>
  )
}

export default App