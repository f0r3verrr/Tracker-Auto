import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AccessGate } from './components/AccessGate'
import { Layout } from './components/Layout'
import { WhoAreYou } from './components/WhoAreYou'
import { Spinner } from './components/ui'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CarsProvider } from './context/CarsContext'
import { SelectionProvider } from './context/SelectionContext'
import { getReviewerName } from './lib/identity'
import { CarDetailPage } from './pages/CarDetailPage'
import { CarFormPage } from './pages/CarFormPage'
import { CarsListPage } from './pages/CarsListPage'
import { ComparePage } from './pages/ComparePage'
import { LoginPage } from './pages/LoginPage'
import { SettingsPage } from './pages/SettingsPage'

/** Гость должен представиться, владелец — нет: он уже подписан своим аккаунтом. */
function IdentityGate({ children }: { children: React.ReactNode }) {
  const { isOwner, loading } = useAuth()
  const location = useLocation()
  const [name, setName] = useState(getReviewerName())

  if (loading) return <Spinner label="Загружаю" />
  if (isOwner || name || location.pathname === '/login') return <>{children}</>

  return <WhoAreYou onDone={() => setName(getReviewerName())} />
}

function OwnerRoute({ children }: { children: React.ReactNode }) {
  const { isOwner, loading } = useAuth()
  if (loading) return <Spinner label="Проверяю доступ" />
  if (!isOwner) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AccessGate>
      <BrowserRouter>
        <AuthProvider>
          <CarsProvider>
            <SelectionProvider>
              <IdentityGate>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<CarsListPage />} />
                    <Route path="compare" element={<ComparePage />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route
                      path="settings"
                      element={
                        <OwnerRoute>
                          <SettingsPage />
                        </OwnerRoute>
                      }
                    />
                    <Route
                      path="car/new"
                      element={
                        <OwnerRoute>
                          <CarFormPage />
                        </OwnerRoute>
                      }
                    />
                    <Route
                      path="car/:id/edit"
                      element={
                        <OwnerRoute>
                          <CarFormPage />
                        </OwnerRoute>
                      }
                    />
                    <Route path="car/:id" element={<CarDetailPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </IdentityGate>
            </SelectionProvider>
          </CarsProvider>
        </AuthProvider>
      </BrowserRouter>
    </AccessGate>
  )
}
