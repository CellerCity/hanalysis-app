import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Corrected path to be absolute from the source root
import './index.css';   // Corrected path to be absolute from the source root

// This is the root of your React application.
// It ensures that the main App component is rendered, which in turn
// provides the necessary context for authentication to the rest of the app.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

