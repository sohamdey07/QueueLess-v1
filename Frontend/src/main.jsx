import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// HashRouter route normalizer:
// If the user visits http://localhost:5173/reset-password/<token> or arrives with a pathname
// outside of the hash router, normalize it to http://localhost:5173/#/reset-password/<token>
if (typeof window !== 'undefined') {
  const pathname = window.location.pathname || '';
  const resetTokenMatch = pathname.match(/\/reset-password\/([^/?#]+)/i);

  if (resetTokenMatch && resetTokenMatch[1]) {
    const token = resetTokenMatch[1];
    const targetHash = `#/reset-password/${token}`;
    if (pathname !== '/' || window.location.hash !== targetHash) {
      window.location.replace(`${window.location.origin}/#/reset-password/${token}`);
    }
  } else if (pathname && pathname !== '/' && pathname !== '/index.html') {
    const targetPath = pathname.replace(/^\/index\.html/, '') + window.location.search;
    window.location.replace(`${window.location.origin}/#${targetPath}`);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

