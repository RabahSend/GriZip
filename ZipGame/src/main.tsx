import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Désactiver tous les logs en production
if (window.location.hostname !== 'localhost') {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  window.addEventListener('error', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return true;
  });
  window.addEventListener('unhandledrejection', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return true;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
