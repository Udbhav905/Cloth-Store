// Toggle this to true if you want to use the local backend (localhost:3000)
// Set to false to use the hosted Render backend
const USE_LOCAL_BACKEND = false; 

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// If USE_LOCAL_BACKEND is true AND we are on localhost, use local. Otherwise use Render.
const useLocal = USE_LOCAL_BACKEND && isLocalhost;

export const API_BASE_URL = useLocal 
  ? 'http://localhost:3000/api' 
  : 'https://cloth-store-backend-qe63.onrender.com/api';

export const IMAGE_BASE_URL = useLocal
  ? 'http://localhost:3000'
  : 'https://cloth-store-backend-qe63.onrender.com';
