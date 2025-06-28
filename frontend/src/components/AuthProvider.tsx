'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
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
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Delay auth check to avoid hydration issues
    const timer = setTimeout(() => {
      checkAuthState()
    }, 100)
    
    return () => clearTimeout(timer)
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

  // シンプルなサインアップ - 確認コードの画面は表示しない
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

      console.log('Sign up result:', result)

      // 常に成功メッセージを返す（確認コードの処理はスキップ）
      return { 
        success: true, 
        message: 'アカウントが作成されました。管理者の承認をお待ちください。しばらくしてからログインを試してください。' 
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'アカウント作成に失敗しました' 
      }
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