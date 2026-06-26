// In local dev points to localhost; in production (GitHub Pages) points to Render.
// After deploying to Render, replace the URL below with your actual Render URL.
export const BACKEND_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://dividanselo-backend.onrender.com';
