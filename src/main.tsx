import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ensureFreshSeed, useStore } from './store'

// Handle for the QA script in public/qa/feature-check.js (and for debugging in the console)
;(window as unknown as { __gearphys: unknown }).__gearphys = { store: useStore }

// Refresh sample dates once the persisted store has loaded
if (useStore.persist.hasHydrated()) ensureFreshSeed()
else useStore.persist.onFinishHydration(() => ensureFreshSeed())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
