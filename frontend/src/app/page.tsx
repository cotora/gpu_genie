'use client'

import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function Home() {
    const { isAuthenticated } = useAuth()

    return (
        <div className="min-h-screen bg-neu-bg">
            <div className="container mx-auto px-4 py-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-neu-text mb-4">GPU Genie</h1>
                    <p className="text-xl text-neu-text max-w-2xl mx-auto">
                        自然言語による直感的な予約インターフェースとAIによる優先度判定機能を備えた
                        GPUサーバーリソース管理システム
                    </p>
                </header>

                <div className="max-w-4xl mx-auto">
                    {isAuthenticated ? (
                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            <div className="bg-neu-bg rounded-lg shadow-neu-outset p-6">
                                <h2 className="text-2xl font-semibold text-neu-text mb-4">予約管理</h2>
                                <p className="text-neu-text mb-6">自然言語でGPUサーバーの予約を簡単に行えます</p>
                                <Link
                                    href="/reservations"
                                    className="inline-block bg-neu-orange text-white px-6 py-3 rounded-lg shadow-neu-outset hover:shadow-neumorphism-button-orange-inset transition-shadow"
                                >
                                    予約を作成
                                </Link>
                            </div>

                            <div className="bg-neu-bg rounded-lg shadow-neu-outset p-6">
                                <h2 className="text-2xl font-semibold text-neu-text mb-4">予約状況</h2>
                                <p className="text-neu-text mb-6">現在の予約状況を確認・管理できます</p>
                                <Link
                                    href="/dashboard"
                                    className="inline-block bg-neu-orange text-white px-6 py-3 rounded-lg shadow-neu-outset hover:shadow-neumorphism-button-orange-inset transition-shadow"
                                >
                                    ダッシュボード
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-neu-bg rounded-lg shadow-neu-outset p-8 text-center mb-12">
                            <h2 className="text-2xl font-semibold text-neu-text mb-4">利用を開始するには</h2>
                            <p className="text-neu-text mb-6">
                                GPU Genieの全機能を利用するには、ログインまたは新規登録が必要です。
                            </p>
                            <div className="flex justify-center gap-4">
                                <Link
                                    href="/auth/signin"
                                    className="inline-block bg-neu-orange text-white px-6 py-3 rounded-lg shadow-neu-outset hover:shadow-neumorphism-button-orange-inset transition-shadow"
                                >
                                    ログイン
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="inline-block bg-neu-orange text-white px-6 py-3 rounded-lg shadow-neu-outset hover:shadow-neumorphism-button-orange-inset transition-shadow"
                                >
                                    新規登録
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="bg-neu-bg rounded-lg shadow-neu-outset p-8">
                        <h2 className="text-2xl font-semibold text-neu-text mb-6">主な機能</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="bg-neu-bg rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-neu-outset">
                                    <svg
                                        className="w-8 h-8 text-neu-orange"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">自然言語予約</h3>
                                <p className="text-neu-text text-sm">
                                    「明日15時から3時間、V100を2台予約」のような自然な表現で予約可能
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="bg-neu-bg rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-neu-outset">
                                    <svg
                                        className="w-8 h-8 text-neu-orange"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">AI優先度判定</h3>
                                <p className="text-neu-text text-sm">
                                    Amazon Bedrockを活用した公平で自動化された優先度判定システム
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="bg-neu-bg rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-neu-outset">
                                    <svg
                                        className="w-8 h-8 text-neu-orange"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">セキュア</h3>
                                <p className="text-neu-text text-sm">
                                    Amazon Cognitoによる認証とAWS IAMによる細かなアクセス制御
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
