'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [confirmationCode, setConfirmationCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const [step, setStep] = useState<'signup' | 'confirm'>('signup')

    const { signUp, confirmSignUp } = useAuth()

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage('')

        try {
            const result = await signUp(email, password, name)
            if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
                setStep('confirm')
                setMessage('確認コードがメールアドレスに送信されました。')
            } else if (result.isSignUpComplete) {
                setIsSuccess(true)
                setMessage('アカウントが作成されました。ログインしてください。')
            }
        } catch (error: unknown) {
            console.error('Signup error:', error)
            setIsSuccess(false)
            const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました'
            setMessage(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage('')

        try {
            const result = await confirmSignUp(email, confirmationCode)
            if (result.success) {
                setIsSuccess(true)
                setMessage(result.message)
            } else {
                setIsSuccess(false)
                setMessage('確認に失敗しました。もう一度お試しください。')
            }
        } catch (error: unknown) {
            console.error('Confirmation error:', error)
            setIsSuccess(false)
            const errorMessage = error instanceof Error ? error.message : '確認コードの検証に失敗しました'
            setMessage(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {step === 'signup' ? 'GPU Genieに新規登録' : '確認コードを入力'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 'signup' && (
                            <>
                                すでにアカウントをお持ちの方は{' '}
                                <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                                    ログイン
                                </Link>
                            </>
                        )}
                    </p>
                </div>

                {step === 'signup' ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
                        {message && !isSuccess && (
                            <div className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700">
                                {message}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="sr-only">
                                    名前
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="名前"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="sr-only">
                                    メールアドレス
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="メールアドレス"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    パスワード
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="パスワード（8文字以上、大小英数字・記号を含む）"
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
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        登録中...
                                    </div>
                                ) : (
                                    '新規登録'
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleConfirmSignUp}>
                        {message && (
                            <div className={`px-4 py-3 rounded-md ${isSuccess
                                ? 'bg-green-50 border border-green-200 text-green-700'
                                : 'bg-red-50 border border-red-200 text-red-700'
                                }`}>
                                {message}
                                {isSuccess && (
                                    <div className="text-center mt-2">
                                        <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500 font-medium">
                                            ログインページへ
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="confirmationCode" className="sr-only">
                                    確認コード
                                </label>
                                <input
                                    id="confirmationCode"
                                    name="confirmationCode"
                                    type="text"
                                    required
                                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="確認コード"
                                    value={confirmationCode}
                                    onChange={e => setConfirmationCode(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        確認中...
                                    </div>
                                ) : (
                                    'アカウントを有効化'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}