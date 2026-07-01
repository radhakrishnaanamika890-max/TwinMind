import { useState, useEffect, createContext, useContext } from 'react'
import {
  onAuthChange,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  logOut,
} from '@/services/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsub
  }, [])

  const handleError = (fn) => async (...args) => {
    setError(null)
    try {
      return await fn(...args)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    loginWithGoogle: handleError(signInWithGoogle),
    loginWithEmail: handleError(signInWithEmail),
    register: handleError(registerWithEmail),
    logout: handleError(logOut),
    clearError: () => setError(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}