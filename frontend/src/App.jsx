import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { ChatProvider } from '@/hooks/ChatContext'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import { Loader2 } from 'lucide-react'
import { PageLoader } from '@/components/SkeletonLoader'
import { ThemeProvider } from '@/hooks/useTheme'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <PageLoader/>
    )
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <ChatProvider>
                  <Dashboard />
                </ChatProvider>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#13131f',
            color: '#e2e2f0',
            border: '1px solid rgba(140,80,255,0.2)',
            fontSize: '13px',
            borderRadius: '10px',
          },
        }}
      />
    </AuthProvider>
    </ThemeProvider>
  )
}


