import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Reveal Material Symbols only once the font is ready (see .icons-ready in index.css).
document.fonts?.load('20px "Material Symbols Outlined"', 'search').then((faces) => {
  if (faces.length) document.documentElement.classList.add('icons-ready');
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
