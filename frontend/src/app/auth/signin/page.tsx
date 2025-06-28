'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

export default function SignIn() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const { signIn } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            await signIn(email, password)
            router.push('/dashboard')
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'ログインに失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F0F0F3] flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-[#F0F0F3] rounded-3xl shadow-neumorphism">
                <div>
                    <h2 className="text-3xl font-bold text-center text-gray-800">
                        GPU Genieにログイン
                    </h2>
                    <p className="mt-2 text-sm text-center text-gray-600">
                        アカウントをお持ちでない方は{' '}
                        <Link href="/auth/signup" className="font-medium text-orange-600 hover:text-orange-500">
                            新規登録
                        </Link>
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-center rounded-xl bg-red-100 border border-red-200 text-red-700 text-sm shadow-inner">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full px-4 py-3 bg-[#F0F0F3] rounded-xl text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-neumorphism-inset"
                                placeholder="メールアドレス"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="w-full px-4 py-3 bg-[#F0F0F3] rounded-xl text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-neumorphism-inset"
                                placeholder="パスワード"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 font-bold text-white bg-neu-orange rounded-lg shadow-neu-outset hover:shadow-neumorphism-button-orange-inset transition-shadow disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                </div>
                            ) : (
                                'ログイン'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
