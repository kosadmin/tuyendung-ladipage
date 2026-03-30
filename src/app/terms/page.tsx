import SiteLayout from '@/components/SiteLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điều khoản dịch vụ | K-Outsourcing',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Điều khoản dịch vụ</h1>
        <p className="text-gray-400 text-sm mb-10">Cập nhật lần cuối: 01/01/2025</p>

        {[
          {
            title: '1. Chấp nhận điều khoản',
            content: 'Khi sử dụng website K-Outsourcing, bạn đồng ý tuân thủ các điều khoản dịch vụ này. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.',
          },
          {
            title: '2. Mô tả dịch vụ',
            content: 'K-Outsourcing cung cấp nền tảng kết nối ứng viên với các doanh nghiệp tuyển dụng. Chúng tôi không đảm bảo kết quả tuyển dụng cụ thể.',
          },
          {
            title: '3. Trách nhiệm người dùng',
            content: 'Bạn cam kết cung cấp thông tin chính xác, trung thực khi đăng ký và sử dụng dịch vụ. Nghiêm cấm sử dụng dịch vụ cho mục đích bất hợp pháp.',
          },
          {
            title: '4. Chương trình Cộng tác viên',
            content: 'Cộng tác viên chịu trách nhiệm về tính xác thực của thông tin ứng viên được giới thiệu. Hoa hồng chỉ được thanh toán sau khi ứng viên được nhận việc và hoàn thành thời gian thử việc theo quy định.',
          },
          {
            title: '5. Giới hạn trách nhiệm',
            content: 'K-Outsourcing không chịu trách nhiệm về thiệt hại gián tiếp phát sinh từ việc sử dụng dịch vụ.',
          },
          {
            title: '6. Thay đổi điều khoản',
            content: 'Chúng tôi có quyền cập nhật điều khoản bất kỳ lúc nào. Thay đổi sẽ có hiệu lực ngay khi đăng tải lên website.',
          },
          {
            title: '7. Liên hệ',
            content: 'Mọi thắc mắc về điều khoản dịch vụ, vui lòng liên hệ: info@koutsourcing.vn hoặc hotline 0325 277 292.',
          },
        ].map((section, i) => (
          <div key={i} className="mb-8">
            <h2 className="text-lg font-black text-gray-800 mb-2">{section.title}</h2>
            <p className="text-gray-600 text-[15px] leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </SiteLayout>
  );
}
