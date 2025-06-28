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
        <div className="min-h-screen bg-[#F0F0F3] flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-[#F0F0F3] rounded-3xl shadow-neumorphism">
                <div>
                    <h2 className="text-3xl font-bold text-center text-gray-800">
                        {step === 'signup' ? 'GPU Genieに新規登録' : '確認コードを入力'}
                    </h2>
                    <p className="mt-2 text-sm text-center text-gray-600">
                        {step === 'signup' && (
                            <>
                                すでにアカウントをお持ちの方は{' '}
                                <Link href="/auth/signin" className="font-medium text-orange-600 hover:text-orange-500">
                                    ログイン
                                </Link>
                            </>
                        )}
                    </p>
                </div>

                {step === 'signup' ? (
                    <form className="space-y-6" onSubmit={handleSignUp}>
                        {message && !isSuccess && (
                            <div className="p-3 text-center rounded-xl bg-red-100 border border-red-200 text-red-700 text-sm shadow-inner">
                                {message}
                            </div>
                        )}
                        <div className="space-y-6">
                            <div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-[#F0F0F3] rounded-xl text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-neumorphism-inset"
                                    placeholder="名前"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
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
                                    autoComplete="new-password"
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
                                    '新規登録'
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="space-y-6" onSubmit={handleConfirmSignUp}>
                        {message && (
                            <div className={`p-4 text-center rounded-xl shadow-inner ${isSuccess
                                ? 'bg-green-100 border border-green-200 text-green-800'
                                : 'bg-red-100 border border-red-200 text-red-700'
                                }`}>
                                {message}
                                {isSuccess && (
                                    <div className="mt-4">
                                        <Link href="/auth/signin" className="font-bold text-orange-600 hover:text-orange-500">
                                            ログインページへ
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="space-y-6">
                            <div>
                                <input
                                    id="confirmationCode"
                                    name="confirmationCode"
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-[#F0F0F3] rounded-xl text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 shadow-neumorphism-inset"
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
                                className="w-full py-3 px-4 font-bold text-white bg-neu-orange rounded-lg shadow-neu-outset hover:shadow-neumorphism-button-orange-inset transition-shadow disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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