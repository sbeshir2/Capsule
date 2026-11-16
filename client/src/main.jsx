// main.jsx - starting point of the React app.
// It finds <div id="root"> in index.html and draws <App /> inside it.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* basename="/app" because Express serves the app at /app */}
    <BrowserRouter basename="/app">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
