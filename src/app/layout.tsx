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
    icon: '/logo.png',        // tab trình duyệt
    apple: '/logo.png',       // bookmark iPhone
  },
  openGraph: {
    title: 'Việc làm tốt nhất | K-Outsourcing',
    description: 'Hàng trăm cơ hội việc làm thu nhập hấp dẫn đang chờ bạn.',
    url: 'https://tuyendung.koutsourcing.vn',       // ← thay domain thật
    siteName: 'K-Outsourcing',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],  // ← thêm ảnh sau
    locale: 'vi_VN',
    type: 'website',
  },
  robots: { index: true, follow: true },
}
