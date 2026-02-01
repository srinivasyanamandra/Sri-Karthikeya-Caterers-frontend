// API Configuration
// Update this when you deploy your Spring Boot backend

const API_CONFIG = {
  // Current: No backend (frontend only)
  BASE_URL: process.env.REACT_APP_API_URL || '',
  
  // Future: When backend is deployed, update .env file:
  // REACT_APP_API_URL=https://api.srikarthikeyacaterers.in
  
  ENDPOINTS: {
    CONTACT: '/api/contact',
    BOOKINGS: '/api/bookings',
    MENU: '/api/menu',
    GALLERY: '/api/gallery',
  }
};

export default API_CONFIG;
