import SiteLayout from '@/components/SiteLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật | K-Outsourcing',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Chính sách bảo mật</h1>
        <p className="text-gray-400 text-sm mb-10">Cập nhật lần cuối: 01/01/2025</p>

        {[
          {
            title: '1. Thông tin chúng tôi thu thập',
            content: 'Chúng tôi thu thập họ tên, số điện thoại, email, giới tính và địa bàn bạn cung cấp khi đăng ký làm Cộng tác viên hoặc ứng tuyển việc làm.',
          },
          {
            title: '2. Mục đích sử dụng',
            content: 'Thông tin được dùng để: liên hệ tư vấn việc làm, xử lý hoa hồng Cộng tác viên, cải thiện chất lượng dịch vụ và gửi thông báo tuyển dụng phù hợp.',
          },
          {
            title: '3. Chia sẻ thông tin',
            content: 'Chúng tôi không bán thông tin cá nhân cho bên thứ ba. Thông tin chỉ được chia sẻ với doanh nghiệp tuyển dụng khi bạn đồng ý ứng tuyển.',
          },
          {
            title: '4. Bảo mật dữ liệu',
            content: 'Dữ liệu được lưu trữ trên hệ thống bảo mật. Chúng tôi áp dụng các biện pháp kỹ thuật phù hợp để bảo vệ thông tin khỏi truy cập trái phép.',
          },
          {
            title: '5. Quyền của bạn',
            content: 'Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân bất kỳ lúc nào bằng cách liên hệ với chúng tôi qua email hoặc hotline.',
          },
          {
            title: '6. Cookie',
            content: 'Website sử dụng cookie để cải thiện trải nghiệm người dùng. Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng có thể bị ảnh hưởng.',
          },
          {
            title: '7. Liên hệ',
            content: 'Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ: info@koutsourcing.vn hoặc hotline 0325 277 292.',
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
