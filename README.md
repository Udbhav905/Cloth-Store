# 💎 LUXURIA - Premium E-Commerce Clothing Store

LUXURIA is a state-of-the-art, premium multi-application e-commerce clothing ecosystem. The codebase is designed with a high-end luxury aesthetic, offering a seamless customer storefront, a detailed administration dashboard, an interactive logistics panel for delivery partners, and a highly scalable Node.js/Express backend API.

---

## 🚀 Live Deployment
*   **Customer Web Application:** [https://luxuria-clothing.vercel.app/](https://luxuria-clothing.vercel.app/) *(Deployed on Vercel)*
*   **Backend Server:** Managed API server *(Deployed on Render)*

---

## 📂 Project Structure & Architecture

The repository is organized into a modular multi-app structure, separating concerns across the database, client, administration, and logistics systems:

```text
Cloth_Store/
├── Backend/               # REST API & Database Control System
│   ├── config/            # Cloudinary & MongoDB configurations
│   ├── Controllers/       # Business logic controllers for operations
│   ├── Middleware/        # Error handlers, Multer file uploader, JWT verification
│   ├── model/             # MongoDB Mongoose schemas
│   ├── Routes/            # Express router mappings
│   ├── utils/             # Mailers and token generators
│   └── validators/        # User and product input validation middleware
│
├── User/                  # Client-Facing Storefront Application
│   ├── src/
│   │   ├── Components/    # Shared visual components (Navbar, Hero, Modals)
│   │   ├── Pages/         # Main application pages (Home, Category, Cart, Orders)
│   │   └── store/         # Zustand state management slices
│
├── Admin/                 # Administrative Management Control Panel
│   ├── src/
│   │   ├── Components/    # Management panels (Analytics, Orders, Reviews)
│   │   └── utils/         # Admin API request utilities
│
└── DeliveryPartner/       # Dispatch and Order Route-Tracking Panel
    ├── src/
    │   ├── components/    # Layout wrappers and navigation controllers
    │   └── pages/         # Operational panels (Dashboard, Orders, Profile)
```

---

## 🛠️ Technology Stack & Dependencies

The entire ecosystem leverages high-performance libraries and tools to deliver a responsive, fast, and feature-rich user experience:

### 1. Backend Server (`Backend`)
*   **Core Framework**: Node.js & Express (ES Modules)
*   **Database**: MongoDB & Mongoose ODM (incorporating complex aggregate queries and indexing)
*   **Authentication & Security**: JSON Web Tokens (`jsonwebtoken`), `cookie-parser` for secure HTTP-only cookies, and `bcryptjs` password hashing
*   **File Storage**: `multer` & `cloudinary` SDK for dynamic image hosting
*   **Payments**: `stripe` API integration for card validation and webhook ingestion
*   **Email Engine**: `nodemailer` for authentication resets and order confirmations
*   **Caching**: `node-cache` for in-memory temporary data acceleration
*   **Validation**: `express-validator` sanitation layers

### 2. Customer Storefront (`User`)
*   **Framework**: React (v19) & Vite
*   **State Management**: Zustand (lightweight, reactive alternative to Redux)
*   **Smooth Scroll Physics**: `@studio-freight/lenis` for premium scroll experiences
*   **Navigation**: React Router (v7)
*   **Geospatial Maps**: `leaflet` & `react-leaflet` (interactive order delivery maps)
*   **Payments UI**: Stripe React elements (`@stripe/react-stripe-js` & `@stripe/stripe-js`)
*   **HTTP Client**: `axios` with interceptors for global authorization injection

### 3. Admin Panel (`Admin`)
*   **Framework**: React (v19) & Vite
*   **Analytics Charts**: `recharts` (rendering income tracking and categorical trends)
*   **Geographical Overlays**: Leaflet map layers for shipping region visualizations
*   **Export Engines**: `jspdf`, `jspdf-autotable`, and `html2canvas` (renders invoice records and analytical summaries directly to PDF)
*   **Routing**: React Router (v7)

### 4. Delivery Partner Panel (`DeliveryPartner`)
*   **Framework**: React (v19) & Vite
*   **Notification Engine**: `react-hot-toast` for micro-alerts
*   **Logistics Charts**: `recharts` for progress tracking
*   **Time Handling**: `date-fns` for scheduling and ETA tracking
*   **Mapping**: Leaflet integrations showing delivery coordinates and pins

---

## 🗄️ Database Schema & Models (`Backend/model`)

The application architecture utilizes MongoDB with relational modeling schemas:

*   **`User.js`**: Stores customer details, dynamic shipping addresses, hashed credentials, reset tokens, and authorization levels (`customer`, `admin`, `superadmin`).
*   **`Product.js`**: Contains structured products featuring array-based sizes, color codes, high-resolution image references (from Cloudinary), nested reviews, pricing matrix, and current inventory levels.
*   **`Category.js`**: Category nodes supporting hierarchical navigation.
*   **`Cart.js`**: Caches active customer carts containing products, quantity indicators, and selected attributes.
*   **`Wishlist.js`**: Tracks user-favorited products.
*   **`Order.js`**: Maintains checkout records, invoice references, Stripe transaction IDs, shipping coordinates (latitude/longitude), tracking statuses (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`), and assigned Delivery Partner.
*   **`DeliveryPartner.js`**: Tracks delivery agent accounts, vehicle types, license parameters, availability status, active assignments, and geographical operational centers.
*   **`Coupon.js`**: Configures discount codes, percentage offsets, expiration targets, and validation rules.
*   **`PasswordReset.js`**: Manages secure email validation reset keys.
*   **`Review.js`**: Houses customer-generated ratings and comments linked to specific product nodes.

---

## 🔗 REST API Endpoints & Routes (`Backend/Routes`)

The backend is built around a secure router framework containing the following endpoints:

| Route Path | File Target | Operational Purpose |
| :--- | :--- | :--- |
| **`/api/auth`** | `authRoutes.js` | Login, Register, Session Validation, Logout, Password Recovery |
| **`/api/users`** | `userRoutes.js` | Profile adjustments, address management, and order logs |
| **`/api/categories`** | `categoryRoutes.js` | Fetching and structuring storefront categories |
| **`/api/products`** | `productRoutes.js` | Paginated catalog browsing, product detail extraction |
| **`/api/orders`** | `orderRoutes.js` | Checkout preparation, status updates, routing assignments |
| **`/api/cart`** | `cartRoutes.js` | Syncing user cart additions, updates, and removals |
| **`/api/wishlist`** | `wishlistRoutes.js` | Querying and updating user favorites |
| **`/api/reviews`** | `reviewRoutes.js` | Posting, listing, and moderation of product reviews |
| **`/api/coupons`** | `couponRoutes.js` | Discount code processing and calculations |
| **`/api/admin`** | `adminroutes.js` | Secure metrics generation for management portals |
| **`/api/payments`** | `paymentRoutes.js` | Stripe Session generation and asynchronous webhooks |
| **`/api/partner`** | `deliveryPartnerAuthRoutes.js` | Delivery agent registration, logging, and state sync |
| **`/api/delivery-partners`**| `deliveryPartnerRoutes.js` | Assignment allocations, geographical tracking updates |

---

## 🛒 Customer Web Application (`User`)

The storefront application is designed to emulate elite fashion boutiques. Key areas include:

### State Management (`User/src/store`)
*   **`Useauthstore.js`**: Coordinates active customer authentication, user info caching, and access tokens.
*   **`Usecartstore.js`**: Manages local shopping carts, synchronizing client modifications with server endpoints.
*   **`useProductStore.js`**: Serves as the global repository for inventory data, sorting rules, and filter caches.
*   **`Usecategorystore.js`**: Caches store categories to minimize network queries.

### Visual & Interactive Features
*   **Homepage & Hero Section**: Premium layouts with viewport-bounded scroll parallax and infinite marquee typography.
*   **Advanced Catalog Filtering**: Dynamic search page and filtering panels matching colors, sizes, and price tiers.
*   **Secure Payment Forms**: Integrated Stripe Checkout containing card authentication verification.
*   **Live Order Tracking**: Connects to Leaflet to display order location, active routing, and delivery partner metadata in real-time.
*   **Account Profiles**: Configurable shipping addresses, invoice references, and order logs.

---

## 📊 Administration Dashboard (`Admin`)

The administrative portal manages the entire store's inventory, financial data, and logistics:

*   **Dynamic Visual Analytics**: Connects to `Recharts` to draw real-time revenue curves, itemized category distributions, and daily transaction volumes.
*   **Product Catalog Management**: Dashboard to instantly upload, update, and archive store items. Multer and Cloudinary integrations enable multi-image upload processing.
*   **Logistics Map**: Leaflet interactive overlay displaying client shipping destinations to coordinate dispatch routes.
*   **Invoice Generator**: Generates premium PDF purchase receipts using `jsPDF` and `html2canvas` directly from the order records.
*   **Delivery Partner Coordination**: Administrative interface to register, evaluate, and assign pending order queues to active dispatch agents.
*   **Review Moderation Panel**: Displays customer reviews for easy moderation.

---

## 🚚 Delivery Partner Logistics System (`DeliveryPartner`)

A lightweight mobile-first interface designed for delivery partners to manage their routes:

*   **Courier Dashboard**: High-level overview showcasing pending deliveries, completed route counts, and delivery commissions.
*   **Route Optimization**: Leaflet mapping panel pinning delivery coordinates and plotting routes from the fulfillment center to the client.
*   **Order State Progression**: Real-time status update toggles (`Assigned` ➔ `In Transit` ➔ `Delivered` / `Returned`) which sync instantly with the backend database.
*   **Profile Center**: Configures vehicle profiles, active availability toggles, and payout tracking parameters.
