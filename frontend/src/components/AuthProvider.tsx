'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react'
import { Amplify } from 'aws-amplify'
import awsConfig from '@/lib/aws-config'
import {
    signIn as amplifySignIn,
    signUp as amplifySignUp,
    signOut as amplifySignOut,
    confirmSignUp as amplifyConfirmSignUp,
    getCurrentUser,
    fetchUserAttributes,
    type SignUpOutput,
    type SignInOutput,
} from 'aws-amplify/auth'

type User = {
    username: string
    email: string
    name: string
}

type AuthContextType = {
    user: User | null
    isAuthenticated: boolean
    signIn: (email: string, password: string) => Promise<SignInOutput>
    signUp: (email: string, password: string, name: string) => Promise<SignUpOutput>
    confirmSignUp: (
        email: string,
        confirmationCode: string
    ) => Promise<{ success: boolean; message: string }>
    signOut: () => Promise<void>
}

Amplify.configure(awsConfig)

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)

    const checkUser = useCallback(async () => {
        try {
            const cognitoUser = await getCurrentUser()
            const attributes = await fetchUserAttributes()
            setUser({
                username: cognitoUser.username,
                email: attributes.email || '',
                name: attributes.name || '',
            })
        } catch {
            // getCurrentUserは、未認証の場合にエラーをスローします。
            // これは想定された動作なので、ユーザー状態をnullに設定するだけで問題ありません。
            // console.error('Failed to check user auth state:', error) // 紛らわしいのでこの行を削除
            setUser(null)
        }
    }, [])

    useEffect(() => {
        checkUser()
    }, [checkUser])

    const handleSignIn = useCallback(
        async (email: string, password: string): Promise<SignInOutput> => {
            const result = await amplifySignIn({ username: email, password })
            await checkUser()
            return result
        },
        [checkUser]
    )

    const handleSignUp = useCallback(
        async (email: string, password: string, name: string): Promise<SignUpOutput> => {
            return await amplifySignUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                        name,
                    },
                },
            })
        },
        []
    )

    const handleConfirmSignUp = useCallback(
        async (email: string, confirmationCode: string) => {
            const result = await amplifyConfirmSignUp({
                username: email,
                confirmationCode,
            })
            return { success: result.isSignUpComplete, message: 'ユーザー登録が完了しました。ログインしてください。' }
        },
        []
    )

    const handleSignOut = useCallback(async () => {
        await amplifySignOut()
        setUser(null)
    }, [])

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: !!user,
            signIn: handleSignIn,
            signUp: handleSignUp,
            confirmSignUp: handleConfirmSignUp,
            signOut: handleSignOut,
        }),
        [user, handleSignIn, handleSignUp, handleConfirmSignUp, handleSignOut]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}