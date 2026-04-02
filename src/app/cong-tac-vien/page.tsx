'use client';

import { useState } from 'react';
import SiteLayout from '@/components/SiteLayout';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const CTVModal = dynamic(() => import('@/components/CTVModal'), { ssr: false });

// ── Data ───────────────────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: '💰',
    title: 'Hoa hồng hấp dẫn',
    desc: 'Thu nhập không giới hạn. Giới thiệu càng nhiều ứng viên, hoa hồng càng cao.',
  },
  {
    icon: '🙋',
    title: 'Ai cũng có thể tham gia',
    desc: 'Không yêu cầu bằng cấp hay kinh nghiệm. Chỉ cần một chiếc điện thoại là đủ.',
  },
  {
    icon: '📋',
    title: 'Đơn tuyển đa dạng',
    desc: 'Hàng chục doanh nghiệp lớn trên toàn quốc đang cần ứng viên phù hợp.',
  },
  {
    icon: '📊',
    title: 'Tiện lợi – Minh bạch',
    desc: 'Theo dõi trạng thái ứng viên và hoa hồng mọi lúc, mọi nơi qua hệ thống.',
  },
  {
    icon: '🤝',
    title: 'Hỗ trợ tận tình',
    desc: 'Đội ngũ chuyên viên K-Outsourcing luôn sẵn sàng hướng dẫn và đồng hành cùng bạn.',
  },
];

const STEPS = [
  {
    num: '01',
    icon: '📝',
    title: 'Đăng ký tham gia',
    desc: 'Điền thông tin đăng ký, hoàn toàn miễn phí. Nhận hướng dẫn từ đội ngũ K-Outsourcing ngay sau khi đăng ký.',
  },
  {
    num: '02',
    icon: '🔍',
    title: 'Tìm ứng viên',
    desc: 'Tìm kiếm và tiếp cận những người đang có nhu cầu tìm việc làm xung quanh bạn.',
  },
  {
    num: '03',
    icon: '📤',
    title: 'Nhập hồ sơ lên hệ thống',
    desc: 'Điền thông tin ứng viên vào form ứng tuyển trên website. Đội ngũ tư vấn sẽ chăm sóc ứng viên cho bạn.',
  },
  {
    num: '04',
    icon: '📡',
    title: 'Theo dõi trạng thái',
    desc: 'Liên hệ với nhân viên K-Outsourcing để bám sát hành trình của ứng viên trong quá trình tuyển dụng.',
  },
  {
    num: '05',
    icon: '🎉',
    title: 'Nhận hoa hồng',
    desc: 'Ứng viên vượt qua thử việc → bạn nhận hoa hồng. Thanh toán đúng hạn, minh bạch, rõ ràng.',
  },
];

const REASONS = [
  {
    icon: '🆓',
    title: 'Cam kết hoàn toàn miễn phí',
    desc: 'Không phải đóng bất kỳ chi phí nào để trở thành Cộng tác viên của K-Outsourcing.',
  },
  {
    icon: '🎓',
    title: 'Được đào tạo bài bản',
    desc: 'Miễn phí đào tạo, tư vấn kiến thức và kỹ năng để tìm kiếm và giới thiệu ứng viên hiệu quả.',
  },
  {
    icon: '🖥️',
    title: 'Quản lý dễ dàng',
    desc: 'Theo dõi hồ sơ ứng viên, trạng thái tuyển dụng và hoa hồng từng đơn hàng trực quan.',
  },
  {
    icon: '💬',
    title: 'Hỗ trợ xuyên suốt',
    desc: 'Nhân viên tư vấn K-Outsourcing hỗ trợ chăm sóc từng ứng viên trong toàn bộ hành trình tuyển dụng.',
  },
  {
    icon: '✅',
    title: 'Hoa hồng minh bạch, đúng hạn',
    desc: 'Cam kết chi trả hoa hồng đúng hẹn, đúng số tiền đã thỏa thuận, không phát sinh phức tạp.',
  },
];

const FAQS = [
  {
    q: 'Đăng ký làm Cộng tác viên có mất phí không?',
    a: 'Hoàn toàn miễn phí. K-Outsourcing không thu bất kỳ khoản phí nào để tham gia chương trình Cộng tác viên.',
  },
  {
    q: 'Tôi cần có kinh nghiệm hay bằng cấp gì không?',
    a: 'Không cần kinh nghiệm hay bằng cấp. Bất kỳ ai có điện thoại và muốn kiếm thêm thu nhập đều có thể tham gia.',
  },
  {
    q: 'Cộng tác viên nhận hoa hồng bao nhiêu mỗi ứng viên?',
    a: 'Mức hoa hồng phụ thuộc vào từng vị trí tuyển dụng, dao động từ 500.000đ đến vài triệu đồng/ứng viên. Chi tiết được thông báo sau khi bạn đăng ký.',
  },
  {
    q: 'Ứng viên phải đi làm bao lâu thì tôi nhận được hoa hồng?',
    a: 'Ứng viên cần hoàn thành thời gian thử việc theo quy định của từng doanh nghiệp (thường 30–60 ngày) thì hoa hồng mới được xác nhận và thanh toán.',
  },
  {
    q: 'Tôi có thể giới thiệu bao nhiêu ứng viên?',
    a: 'Không giới hạn. Bạn giới thiệu càng nhiều ứng viên thành công, thu nhập càng cao.',
  },
  {
    q: 'Hoa hồng được thanh toán qua hình thức nào?',
    a: 'Hoa hồng được chuyển khoản ngân hàng trực tiếp đến tài khoản của bạn sau khi ứng viên được xác nhận hoàn thành thử việc.',
  },
  {
    q: 'Tôi theo dõi tình trạng ứng viên đã giới thiệu ở đâu?',
    a: 'Bạn có thể liên hệ trực tiếp với nhân viên tư vấn K-Outsourcing được giao phụ trách để cập nhật tình trạng ứng viên bất kỳ lúc nào.',
  },
];

// ── FAQ Item (accordion) ───────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
        open ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100 bg-white hover:border-orange-100'
      }`}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className={`font-bold text-[14px] leading-snug ${open ? 'text-orange-700' : 'text-gray-800'}`}>{q}</span>
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
            open ? 'bg-orange-500 text-white rotate-45' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-gray-600 text-[13px] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CTVPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <SiteLayout>
      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #ea6715 0%, #f97316 50%, #fb923c 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 lg:py-20 flex flex-col lg:flex-row items-center gap-10">
          {/* Left */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 rounded-full border border-white/40 text-white/90 text-[11px] font-bold uppercase tracking-widest mb-5">
              Chương trình Cộng tác viên
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
              Giới thiệu ứng viên
            </h1>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-200 leading-tight mb-6">
              Nhận hoa hồng hấp dẫn
            </p>
            <p className="text-white/80 text-[15px] leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Bạn biết ai đang tìm việc? Chỉ cần giới thiệu — K-Outsourcing sẽ lo phần còn lại và trả hoa hồng xứng đáng cho bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white text-orange-600 font-black text-sm rounded-2xl shadow-xl hover:shadow-2xl hover:bg-orange-50 transition-all active:scale-95"
              >
                Đăng ký tham gia miễn phí →
              </button>
              <a
                href="tel:03252772922"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Tư vấn: 0325 277 292
              </a>
            </div>
          </div>

          {/* Right — stat cards */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto lg:mx-0">
              {[
                { value: '1.500.000đ', label: 'Hoa hồng trung bình/ứng viên', icon: '💵' },
                { value: 'Không giới hạn', label: 'Số ứng viên giới thiệu', icon: '♾️' },
                { value: '60+', label: 'Doanh nghiệp đang tuyển', icon: '🏭' },
                { value: 'Miễn phí 100%', label: 'Tham gia chương trình', icon: '🎁' },
              ].map((s, i) => (
                <div key={i} className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className="text-white font-black text-[15px] leading-tight">{s.value}</p>
                  <p className="text-white/70 text-[10px] mt-1 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          BENEFITS — 5 cards
      ════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              Tại sao nên trở thành CTV K-Outsourcing?
            </h2>
            <p className="text-gray-500 text-[14px]">5 lý do khiến hàng nghìn người đã và đang tham gia</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-5 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-200 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-orange-100 transition-colors">
                  {b.icon}
                </div>
                <h3 className="font-black text-gray-900 text-[14px] mb-2 leading-snug">{b.title}</h3>
                <p className="text-gray-500 text-[12px] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          STEPS — 5 bước đơn giản
      ════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div>
              <p className="text-gray-500 text-[13px] font-bold uppercase tracking-widest mb-2">5 bước đơn giản để có</p>
              <h2 className="text-3xl sm:text-4xl font-black text-orange-500 leading-tight mb-8">
                THU NHẬP HẤP DẪN
              </h2>
              <div className="space-y-3">
                {STEPS.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 px-4 py-4 hover:border-orange-100 hover:shadow-sm transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-[13px]">
                      {s.num}
                    </div>
                    <div>
                      <p className="font-bold text-orange-600 text-[13px] mb-0.5">{s.title}</p>
                      <p className="text-gray-500 text-[12px] leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual */}
            <div className="hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-orange-100">
                <img
                  src="/banners/ctv_banner.png"
                  alt="Cộng tác viên K-Outsourcing"
                  className="w-full object-cover"
                  style={{ aspectRatio: '3/2' }}
                />
                {/* Overlay badge */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-lg flex-shrink-0">
                      💰
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-[13px]">Thu nhập không giới hạn</p>
                      <p className="text-gray-500 text-[11px]">Làm bất kỳ lúc nào, bất kỳ đâu</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          REASONS — dark section
      ════════════════════════════════════════════════════ */}
      <section
        className="py-16 px-4 sm:px-6"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Kiếm tiền dễ dàng cùng K-Outsourcing
            </h2>
            <p className="text-white/50 text-[13px]">Chúng tôi cam kết đồng hành với bạn từ bước đầu tiên</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {REASONS.slice(0, 3).map((r, i) => (
              <div key={i} className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center hover:bg-white/12 transition-all">
                <div className="text-3xl mb-3">{r.icon}</div>
                <h3 className="font-black text-white text-[14px] mb-2">{r.title}</h3>
                <p className="text-white/60 text-[12px] leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {REASONS.slice(3).map((r, i) => (
              <div key={i} className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center hover:bg-white/12 transition-all">
                <div className="text-3xl mb-3">{r.icon}</div>
                <h3 className="font-black text-white text-[14px] mb-2">{r.title}</h3>
                <p className="text-white/60 text-[12px] leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Câu hỏi thường gặp</h2>
            <p className="text-gray-500 text-[14px]">Những thắc mắc phổ biến nhất về chương trình CTV</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════ */}
      <section
        className="py-16 px-4 sm:px-6"
        style={{ background: 'linear-gradient(135deg, #ea6715 0%, #f97316 100%)' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Sẵn sàng bắt đầu kiếm tiền?
          </h2>
          <p className="text-white/80 text-[14px] mb-8 leading-relaxed">
            Đăng ký ngay hôm nay — hoàn toàn miễn phí, nhận hỗ trợ tận tình từ đội ngũ K-Outsourcing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setModalOpen(true)}
              className="px-10 py-4 bg-white text-orange-600 font-black text-sm rounded-2xl shadow-xl hover:bg-orange-50 transition-all active:scale-95"
            >
              Đăng ký làm Cộng tác viên ngay →
            </button>
            <Link
              href="/"
              className="px-8 py-4 rounded-2xl border-2 border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-all text-center"
            >
              Xem danh sách việc làm
            </Link>
          </div>
        </div>
      </section>

      <CTVModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </SiteLayout>
  );
}
