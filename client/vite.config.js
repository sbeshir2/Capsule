// vite.config.js - build settings for the Capsule React app
//
// The finished app is served by Express at http://localhost:3000/app
// (see server.js), so every file path starts with /app/.
//
// While developing you can run `npm run dev` for instant refresh at
// http://localhost:5173/app/. Requests for data (/api), uploaded photos
// (/uploads) and the old pages are passed on to Express on port 3000,
// so keep `npm start` running in another terminal.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const EXPRESS = 'http://localhost:3000';

export default defineConfig({
  base: '/app/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': EXPRESS,
      '/uploads': EXPRESS,
      '/profile': EXPRESS,
      '/logout': EXPRESS,
      '/login.html': EXPRESS,
      '/styles.css': EXPRESS
    }
  }
});
