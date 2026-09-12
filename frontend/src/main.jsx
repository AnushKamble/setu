import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Dynamic API Base URL resolution:
// 1. Checks window.localStorage.getItem('SETU_API_URL') (allows live in-browser overrides)
// 2. Checks VITE_API_BASE_URL (Vercel environment variable)
// 3. Defaults to https://setu-backend.up.railway.app when deployed on Vercel
// 4. Defaults to '' (relative path) when running locally with Vite proxy
export const getActiveApiBase = () => {
  if (typeof window === 'undefined') return ''
  const stored = window.localStorage.getItem('SETU_API_URL')
  if (stored && stored.trim()) return stored.trim()
  
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && envUrl.trim()) return envUrl.trim()
  
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://setu-backend.up.railway.app'
  }
  
  return ''
}

if (typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = function (input, init) {
    const base = getActiveApiBase()
    if (base) {
      const cleanBase = base.replace(/\/$/, '')
      if (typeof input === 'string') {
        if (input.startsWith('/api') || input.startsWith('/health')) {
          input = `${cleanBase}${input}`
        }
      } else if (input instanceof URL) {
        if (input.pathname.startsWith('/api') || input.pathname.startsWith('/health')) {
          input = `${cleanBase}${input.pathname}${input.search}`
        }
      }
    }
    return originalFetch.call(this, input, init)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
