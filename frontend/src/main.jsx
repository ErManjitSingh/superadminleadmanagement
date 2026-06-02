import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppProviders from './providers/AppProviders.jsx'
import RouteFallback from './components/ui/RouteFallback.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <Suspense fallback={<RouteFallback label="Loading app…" />}>
        <App />
      </Suspense>
    </AppProviders>
  </StrictMode>,
)
