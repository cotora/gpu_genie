'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  username: string
  email: string
  name?: string
  sub: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, name: string) => Promise<any>
  signOut: () => Promise<void>
  confirmSignUp: (email: string, code: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function DevAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Mock successful login for development
      const mockUser: User = {
        username: email,
        email,
        name: email.split('@')[0],
        sub: 'test-user-01'
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUser(mockUser)
      return { user: mockUser }
    } catch (error) {
      console.error('Mock sign in error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      // Mock successful signup for development
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { 
        user: null,
        userConfirmed: false,
        userSub: 'mock-user-sub'
      }
    } catch (error) {
      console.error('Mock sign up error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const confirmSignUp = async (email: string, code: string) => {
    setIsLoading(true)
    try {
      // Mock successful confirmation for development
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { user: null }
    } catch (error) {
      console.error('Mock confirm sign up error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setUser(null)
    } catch (error) {
      console.error('Mock sign out error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    confirmSignUp
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}