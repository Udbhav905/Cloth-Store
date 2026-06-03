# 💎 LUXURIA - Premium E-Commerce Clothing Store

LUXURIA is a state-of-the-art, premium e-commerce clothing store designed for a seamless, luxurious shopping experience. The repository contains a complete multi-app ecosystem comprising the customer-facing web application, a robust administration dashboard, a delivery partner routing and tracking panel, and a highly optimized REST API backend.

## 🚀 Live Deployments

*   **Frontend (User App):** [https://luxuria-clothing.vercel.app/](https://luxuria-clothing.vercel.app/) (Hosted on Vercel)
*   **Backend API:** Hosted on Render

---

## 📂 Repository Architecture

```text
Cloth_Store/
├── Backend/          # Node.js + Express API server (MongoDB Mongoose, Stripe, Cloudinary)
├── User/             # Customer-facing shopping storefront (React, Vite, Zustand)
├── Admin/            # Admin administration dashboard (React, Recharts, Leaflet maps)
└── DeliveryPartner/  # Logistics delivery tracking and routing system (React, Leaflet maps)
```

---

## 🛠️ Tech Stack & Dependencies

### 1. Backend Server (`Backend`)
*   **Core**: Node.js, Express (ES Modules)
*   **Database**: MongoDB + Mongoose ODM (utilizes `$facet` query aggregation and caching)
*   **Payment Gateway**: Stripe API integration
*   **Image Storage**: Cloudinary (integrated via Multer middleware)
*   **Security & Authentication**: JSON Web Tokens (JWT), BCryptJS, Cookie-Parser
*   **Validation**: Express-Validator
*   **Optimization**: Memory cache utilizing `node-cache`

### 2. Customer Storefront (`User`)
*   **Framework**: React (v19) + Vite
*   **State Management**: Zustand
*   **Navigation**: React Router (v7)
*   **Optimizations**: 
    *   **Stale-While-Revalidate (SWR)** caching pattern for instant 0-second page loads.
    *   High-performance infinite marquees running on the GPU/compositor thread.
    *   Throttled/Viewport-bounded scroll parallax tracking for smooth 60fps scrolling on mobile.

### 3. Admin Panel (`Admin`)
*   **Visualizations**: Recharts (for revenue, orders, and sales trend graphs)
*   **Geospatial Tracking**: Leaflet (interactive maps for customer shipping distributions)
*   **Export Tools**: jsPDF, jsPDF-AutoTable, and HTML2Canvas (for invoice generation and reports)

### 4. Delivery Panel (`DeliveryPartner`)
*   **Mapping**: Leaflet + React Leaflet (for delivery address pins and routing)
*   **State & Toasts**: React Hot Toast
*   **Logistics Tools**: Recharts (stats) and Date-Fns (schedules)

---

## ✨ Features Breakdown

### 🛒 Customer Web App (`User`)
*   **Seamless Browse & Search**: Optimized search with category universe navigation.
*   **Add to Cart & Wishlist**: Real-time synced shopping cart and user wishlist.
*   **One-Click Secure Checkout**: Integrates with Stripe for credit/debit card processing.
*   **Interactive Orders**: Real-time package delivery tracking.
*   **Luxuria Profile**: User information card and purchase history log.

### 📊 Admin Panel (`Admin`)
*   **Product & Inventory Control**: Upload items with multiple images (Cloudinary integration) and stock management.
*   **Interactive Sales Analytics**: Dashboard reporting overall income, seasonal patterns, and top categories.
*   **Geographic Sales Distribution**: Map representation of pending deliveries.
*   **Invoicing System**: Generate PDF invoices instantly for store orders.

### 🚚 Delivery Partner Panel (`DeliveryPartner`)
*   **Delivery Route Optimization**: View delivery pins on interactive maps.
*   **Order Progression Tracking**: Easily mark statuses as *Assigned*, *In Transit*, *Delivered*, or *Returned*.
*   **Logistics Statistics**: Graphs indicating completed routes and success metrics.

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18 or higher)
*   MongoDB Instance (Atlas or Local)
*   Stripe Developer Credentials
*   Cloudinary Storage Credentials

### 1. Backend Configuration
1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `Backend` folder and populate the variables:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_USER=your_smtp_email
   EMAIL_PASS=your_smtp_password
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 2. Frontend User Application Setup
1. Navigate to the `User` directory:
   ```bash
   cd ../User
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `User` folder:
   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```
4. Run in development mode:
   ```bash
   npm run dev
   ```

### 3. Admin Panel Setup
1. Navigate to the `Admin` directory:
   ```bash
   cd ../Admin
   ```
2. Install dependencies & run:
   ```bash
   npm install
   npm run dev
   ```

### 4. Delivery Partner Setup
1. Navigate to the `DeliveryPartner` directory:
   ```bash
   cd ../DeliveryPartner
   ```
2. Install dependencies & run:
   ```bash
   npm install
   npm run dev
   ```
