'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { useState } from 'react'

export default function Navigation() {
    const { user, signOut, isAuthenticated } = useAuth()
    const [showUserMenu, setShowUserMenu] = useState(false)

    const handleSignOut = async () => {
        try {
            await signOut()
            setShowUserMenu(false)
            // ログアウト後はホームページにリダイレクト
            window.location.href = '/'
        } catch (error) {
            console.error('Error signing out: ', error)
        }
    }

    return (
        <nav className="bg-neu-bg shadow-neu-outset">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-neu-text">
                            GPU Genie
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/reservations"
                                    className="text-neu-text hover:text-neu-orange px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    予約管理
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="text-neu-text hover:text-neu-orange px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    ダッシュボード
                                </Link>
                                <div className="ml-4">
                                    <Link
                                        href="/reservations"
                                        className="inline-block bg-neu-orange text-white px-6 py-2 rounded-lg shadow-neu-outset hover:shadow-neumorphism-button-orange-inset transition-shadow text-sm"
                                    >
                                        予約を作成
                                    </Link>
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center space-x-2 text-neu-text hover:text-neu-orange px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        <span>{user?.name || user?.email}</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-neu-bg rounded-md shadow-neu-outset py-1 z-50">
                                            <div className="px-4 py-2 text-sm text-neu-text border-b border-neu-dark">{user?.email}</div>
                                            <button
                                                onClick={handleSignOut}
                                                className="block w-full text-left px-4 py-2 text-sm text-neu-text hover:bg-neu-light"
                                            >
                                                ログアウト
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/auth/signin"
                                    className="inline-block bg-neu-orange text-white px-6 py-2 rounded-lg shadow-neu-outset hover:shadow-neumorphism-button-orange-inset transition-shadow text-sm"
                                >
                                    ログイン
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="inline-block bg-neu-orange text-white px-6 py-2 rounded-lg shadow-neu-outset hover:shadow-neumorphism-button-orange-inset transition-shadow text-sm"
                                >
                                    新規登録
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
