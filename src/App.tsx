import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from './components/ui'
import Landing from './features/demo/Landing'
import Tour from './features/demo/Tour'

const Physio = lazy(() => import('./features/physio/PhysioApp'))
const Patient = lazy(() => import('./features/patient/PatientApp'))

const Loading = () => (
  <div className="grid h-dvh place-items-center bg-surface">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
  </div>
)

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/physio/*" element={<Physio />} />
          <Route path="/patient/*" element={<Patient />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Tour />
      <Toaster />
    </HashRouter>
  )
}
