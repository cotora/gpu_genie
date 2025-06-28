'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  getCurrentUser,
} from 'aws-amplify/auth'

interface User {
  username: string
  email: string
  name?: string
  sub: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<unknown>
  signUp: (email: string, password: string, name: string) => Promise<unknown>
  signOut: () => Promise<void>
  confirmSignUp: (email: string, code: string) => Promise<unknown>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser({
        username: currentUser.username,
        email: currentUser.signInDetails?.loginId || '',
        name: currentUser.username,
        sub: currentUser.userId,
      })
    } catch {
      console.log('No authenticated user')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const result = await amplifySignIn({ username: email, password })
      await checkAuthState()
      return result
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const result = await amplifySignUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
        },
      })
      return result
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const confirmSignUp = async (email: string, code: string) => {
    try {
      const result = await amplifyConfirmSignUp({ username: email, confirmationCode: code })
      return result
    } catch (error) {
      console.error('Confirm sign up error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await amplifySignOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    confirmSignUp,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
