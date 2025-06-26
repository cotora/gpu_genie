import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { DevAuthProvider } from '@/components/DevAuthProvider'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GPU Genie - GPUサーバー予約管理システム',
  description: '自然言語による直感的な予約インターフェースとAIによる優先度判定機能を備えたGPUサーバーリソース管理システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <DevAuthProvider>
          <Navigation />
          {children}
        </DevAuthProvider>
      </body>
    </html>
  )
}
