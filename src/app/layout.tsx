import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tuyển dụng',
  description: 'Thông tin tuyển dụng',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
