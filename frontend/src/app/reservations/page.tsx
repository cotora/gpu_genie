'use client'

import { useState } from 'react'
import { useAuth } from '@/components/DevAuthProvider'
import { api } from '@/lib/api'

export default function Reservations() {
  const [reservation, setReservation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: {
      parsedRequest: string
      estimatedTime: string
      gpuType: string
      quantity: number
      status: string
      priority: number
      reasoning: string
    }
  } | null>(null)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!user) {
      setResult({
        success: false,
        message: 'ログインが必要です。',
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await api.createReservation({
        request: reservation,
        userId: user.sub,
      })

      setResult({
        success: true,
        message: '予約リクエストを受け付けました。AI判定の結果をお待ちください。',
        details: {
          parsedRequest: reservation,
          estimatedTime: `${new Date(response.parsedRequest.startTime).toLocaleString('ja-JP')} - ${new Date(response.parsedRequest.endTime).toLocaleString('ja-JP')}`,
          gpuType: response.parsedRequest.gpuType,
          quantity: response.parsedRequest.quantity,
          status: response.status,
          priority: response.priority,
          reasoning: response.reasoning,
        },
      })
    } catch (error: unknown) {
      setResult({
        success: false,
        message:
          (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
          '予約処理中にエラーが発生しました。',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">GPU予約</h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="reservation"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  予約内容（自然言語で入力してください）
                </label>
                <textarea
                  id="reservation"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例：明日の15時から3時間、V100を2台使いたいです"
                  value={reservation}
                  onChange={e => setReservation(e.target.value)}
                  required
                />
              </div>

              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">使用例</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 「明日15時から3時間、V100を2台予約」</li>
                    <li>• 「来週火曜日の午後、A100を1台4時間使用したい」</li>
                    <li>• 「今日の夜20時から明日朝まで、RTX3090を3台」</li>
                  </ul>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !reservation.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    AI判定中...
                  </div>
                ) : (
                  '予約を申請'
                )}
              </button>
            </form>
          </div>

          {result && (
            <div
              className={`rounded-lg shadow-lg p-6 ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center mb-4">
                {result.success ? (
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <h3
                  className={`text-lg font-semibold ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {result.success ? '予約申請完了' : 'エラー'}
                </h3>
              </div>

              <p className={`mb-4 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>

              {result.success && result.details && (
                <div className="bg-white rounded-md p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">予約詳細</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>解釈された内容:</strong> {result.details.parsedRequest}
                    </p>
                    <p>
                      <strong>予定時間:</strong> {result.details.estimatedTime}
                    </p>
                    <p>
                      <strong>GPU種類:</strong> {result.details.gpuType}
                    </p>
                    <p>
                      <strong>台数:</strong> {result.details.quantity}台
                    </p>
                    <p>
                      <strong>AI優先度:</strong> {result.details.priority}/100
                    </p>
                    <p>
                      <strong>判定理由:</strong> {result.details.reasoning}
                    </p>
                    <p>
                      <strong>ステータス:</strong>
                      <span className="inline-block ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        {result.details.status === 'confirmed' ? '確定' : 'AI判定待ち'}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
