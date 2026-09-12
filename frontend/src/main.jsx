import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Dynamic API Base URL resolution:
// 1. Checks window.localStorage.getItem('SETU_API_URL') (allows live in-browser configuration!)
// 2. Checks VITE_API_BASE_URL (Vercel environment variable)
// 3. Defaults to relative path (for local Vite dev proxy or vercel.json rewrites)
export const getActiveApiBase = () => {
  if (typeof window === 'undefined') return ''
  return (
    window.localStorage.getItem('SETU_API_URL') ||
    import.meta.env.VITE_API_BASE_URL ||
    window.__SETU_API_URL__ ||
    ''
  ).trim()
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
