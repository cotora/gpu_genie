'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { api } from '@/lib/api'

interface Reservation {
  id: string
  request: string
  startTime: string
  endTime: string
  parsedRequest: {
    gpuType: string
    quantity: number
  }
  status: 'confirmed' | 'pending' | 'rejected' | 'cancelled'
  priority?: number
}

export default function Dashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const fetchReservations = useCallback(async () => {
    if (!user) return

    try {
      const response = await api.getUserReservations(user.sub)
      setReservations(response.reservations)
    } catch (error) {
      console.error('予約情報の取得に失敗しました:', error)
      // Mock data for demo purposes
      setReservations([
        {
          id: '1',
          request: '明日15時から3時間、V100を2台予約',
          startTime: '2024-06-24T15:00:00',
          endTime: '2024-06-24T18:00:00',
          parsedRequest: {
            gpuType: 'V100',
            quantity: 2,
          },
          status: 'confirmed',
        },
        {
          id: '2',
          request: '来週火曜日の午後、A100を1台4時間使用したい',
          startTime: '2024-06-25T13:00:00',
          endTime: '2024-06-25T17:00:00',
          parsedRequest: {
            gpuType: 'A100',
            quantity: 1,
          },
          status: 'pending',
          priority: 85,
        },
        {
          id: '3',
          request: '今週末にRTX3090を使いたい',
          startTime: '2024-06-22T10:00:00',
          endTime: '2024-06-22T16:00:00',
          parsedRequest: {
            gpuType: 'RTX3090',
            quantity: 1,
          },
          status: 'rejected',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchReservations()
    }
  }, [user, fetchReservations])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '確定'
      case 'pending':
        return 'AI判定中'
      case 'rejected':
        return '拒否'
      case 'cancelled':
        return 'キャンセル'
      default:
        return '不明'
    }
  }

  const handleCancel = async (id: string) => {
    if (confirm('この予約をキャンセルしますか？')) {
      try {
        await api.updateReservation(id, 'cancelled')
        setReservations(prev =>
          prev.map(res => (res.id === id ? { ...res, status: 'cancelled' as const } : res))
        )
      } catch (error) {
        console.error('キャンセル処理に失敗しました:', error)
      }
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">予約情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ログインが必要です。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">予約ダッシュボード</h1>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">
                {reservations.filter(r => r.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">確定済み予約</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {reservations.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">判定待ち</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-red-600">
                {reservations.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-600">拒否済み</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-600">
                {reservations.filter(r => r.status === 'cancelled').length}
              </div>
              <div className="text-sm text-gray-600">キャンセル</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">予約一覧</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      予約内容
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GPU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.map(reservation => (
                    <tr key={reservation.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{reservation.request}</div>
                        {reservation.priority && (
                          <div className="text-xs text-gray-500">
                            AI優先度: {reservation.priority}/100
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{formatDateTime(reservation.startTime)}</div>
                        <div className="text-xs text-gray-500">
                          ～ {formatDateTime(reservation.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {reservation.parsedRequest.gpuType} × {reservation.parsedRequest.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}
                        >
                          {getStatusText(reservation.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {reservation.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancel(reservation.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            キャンセル
                          </button>
                        )}
                        {reservation.status === 'rejected' && (
                          <button className="text-blue-600 hover:text-blue-900">再申請</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
