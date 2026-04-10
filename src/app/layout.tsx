import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Việc làm tốt nhất | K-Outsourcing',
    template: '%s | K-Outsourcing',
  },
  description:
    'Khám phá hàng trăm việc làm thu nhập cao tại K-Outsourcing. Kết nối trực tiếp với doanh nghiệp uy tín, hỗ trợ ứng viên tận tình, hoàn toàn miễn phí.',
  keywords: 'việc làm, tuyển dụng, tìm việc, K-Outsourcing, nhân sự, lao động, công nhân',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Việc làm tốt nhất | K-Outsourcing',
    description: 'Hàng trăm cơ hội việc làm thu nhập hấp dẫn đang chờ bạn.',
    images: [{ url: '/banners/pc-1.png', width: 1200, height: 630 }],
    locale: 'vi_VN',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
