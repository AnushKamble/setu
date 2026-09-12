import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Seamless Railway/Cloud API integration:
// If VITE_API_BASE_URL is configured in Vercel or local environment variables,
// automatically route relative /api and /health calls to the backend host.
const apiBase = import.meta.env.VITE_API_BASE_URL
if (apiBase && typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = function (input, init) {
    if (typeof input === 'string' && (input.startsWith('/api') || input.startsWith('/health'))) {
      input = `${apiBase.replace(/\/$/, '')}${input}`
    } else if (input instanceof URL && (input.pathname.startsWith('/api') || input.pathname.startsWith('/health'))) {
      input = `${apiBase.replace(/\/$/, '')}${input.pathname}${input.search}`
    }
    return originalFetch.call(this, input, init)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
