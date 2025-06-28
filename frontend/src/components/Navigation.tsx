'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { useState } from 'react'
import LoginPromptModal from './LoginPromptModal'

export default function Navigation() {
    const { user, signOut, isAuthenticated } = useAuth()
    const _router = useRouter() // eslint-disable-line @typescript-eslint/no-unused-vars
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

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

    const handleProtectedLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!isAuthenticated) {
            e.preventDefault()
            setIsModalOpen(true)
        }
    }

    const handleCreateReservationClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isAuthenticated) {
            e.preventDefault()
            setIsModalOpen(true)
        } else {
            // ログイン済みの場合は予約ページに遷移
            window.location.href = '/reservations'
        }
    }

    return (
        <>
            <nav className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-bold text-gray-800">
                                GPU Genie
                            </Link>
                        </div>

                        <div className="flex items-center space-x-4">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        href="/reservations"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        予約管理
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        onClick={handleProtectedLinkClick}
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        ダッシュボード
                                    </Link>
                                    <div className="ml-4">
                                        <button
                                            onClick={handleCreateReservationClick}
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                        >
                                            予約を作成
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
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
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                                <div className="px-4 py-2 text-sm text-gray-500 border-b">{user?.email}</div>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    ログアウト
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/dashboard"
                                        onClick={handleProtectedLinkClick}
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        ダッシュボード
                                    </Link>
                                    <button
                                        onClick={handleCreateReservationClick}
                                        className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded"
                                    >
                                        予約を作成
                                    </button>
                                    <Link
                                        href="/auth/signin"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        ログイン
                                    </Link>
                                    <Link
                                        href="/auth/signup"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                                    >
                                        新規登録
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <LoginPromptModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    )
}
