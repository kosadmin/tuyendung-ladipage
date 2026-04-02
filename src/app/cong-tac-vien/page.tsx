'use client';

import { useState } from 'react';
import SiteLayout from '@/components/SiteLayout';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const CTVModal = dynamic(() => import('@/components/CTVModal'), { ssr: false });

// ── Data ───────────────────────────────────────────────────────────────────
// \u2011 = non-breaking hyphen → "K-Outsourcing" sẽ không bị rớt dòng tại dấu gạch nối
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
    desc: 'Đăng ký ứng viên mọi lúc, mọi nơi qua hệ thống.',
  },
  {
    icon: '🤝',
    title: 'Hỗ trợ tận tình',
    desc: 'Đội ngũ chuyên viên K\u2011Outsourcing luôn sẵn sàng hướng dẫn và đồng hành cùng bạn.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Đăng ký tham gia',
    desc: 'Điền form đăng ký miễn phí. Nhận hỗ trợ từ đội ngũ K\u2011Outsourcing ngay sau đó.',
  },
  {
    num: '02',
    title: 'Tìm ứng viên',
    desc: 'Tiếp cận những người đang có nhu cầu tìm việc xung quanh bạn.',
  },
  {
    num: '03',
    title: 'Nhập hồ sơ',
    desc: 'Điền thông tin ứng viên vào form trên website. Đội ngũ tư vấn sẽ chăm sóc tiếp.',
  },
  {
    num: '04',
    title: 'Theo dõi trạng thái',
    desc: 'Liên hệ nhân viên phụ trách để bám sát hành trình của ứng viên.',
  },
  {
    num: '05',
    title: 'Nhận hoa hồng',
    desc: 'Ứng viên hoàn thành số ngày đi làm → bạn nhận hoa hồng vào ngày 15 hàng tháng.',
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
    a: 'Mức hoa hồng phụ thuộc vào vị trí tuyển dụng và thời gian ứng viên đi làm thực tế, tối thiểu 1.500.000đ / ứng viên. Thông tin chi tiết mức hoa hồng từng vị trí sẽ được thông báo sau khi bạn đăng ký nhé.',
  },
  {
    q: 'Ứng viên phải đi làm bao lâu thì tôi nhận được hoa hồng?',
    a: 'Tùy vào từng dự án, mức hoa hồng sẽ căn cứ theo số ngày đi làm thực tế của ứng viên và được chi trả cho cộng tác viên vào ngày 15 hàng tháng.',
  },
  {
    q: 'Tôi có thể giới thiệu bao nhiêu ứng viên?',
    a: 'Không giới hạn. Bạn giới thiệu càng nhiều ứng viên thành công, thu nhập càng cao.',
  },
  {
    q: 'Hoa hồng được thanh toán qua hình thức nào?',
    a: 'Hoa hồng được chuyển khoản ngân hàng trực tiếp đến tài khoản của bạn vào ngày 15 hàng tháng.',
  },
  {
    q: 'Tôi theo dõi tình trạng ứng viên đã giới thiệu ở đâu?',
    a: 'Bạn có thể liên hệ trực tiếp với nhân viên tư vấn K-Outsourcing phụ trách để cập nhật tình trạng ứng viên bất kỳ lúc nào.',
  },
];

// ── FAQ Accordion ──────────────────────────────────────────────────────────
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
        <span className={`font-bold text-[14px] leading-snug ${open ? 'text-orange-700' : 'text-gray-800'}`}>
          {q}
        </span>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
            open ? 'bg-orange-500 text-white rotate-45' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
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
          SECTION 1 — HERO (2 cột)
      ════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: '#F06914' }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[360px] lg:min-h-[400px]">

          {/* Cột trái — text + buttons */}
          <div className="flex flex-col justify-center px-6 sm:px-8 lg:px-10 py-10 lg:py-12">
            <span className="inline-block px-3 py-1 rounded-full border border-white/40 text-white/90 text-[10px] font-bold uppercase tracking-widest mb-4 w-fit">
              Chương trình Cộng tác viên
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1">
              Giới thiệu ứng viên
            </h1>
            <p className="text-2xl sm:text-3xl font-black text-amber-200 leading-tight mb-4">
              Nhận hoa hồng hấp dẫn
            </p>
            <p className="text-white/80 text-[13px] leading-relaxed mb-6 max-w-sm">
              Bạn biết ai đang tìm việc? Chỉ cần giới thiệu — <span className="whitespace-nowrap">K-Outsourcing</span> sẽ lo phần còn lại và trả hoa hồng xứng đáng cho bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-2.5">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-white text-orange-600 font-black text-sm rounded-xl shadow-lg hover:bg-orange-50 transition-all active:scale-95"
              >
                Đăng ký tham gia miễn phí →
              </button>
              <a
                href="tel:0325277292"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/40 text-white font-bold text-sm hover:bg-white/10 transition-all"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                Tư vấn: 0325 277 292
              </a>
            </div>
          </div>

          {/* Cột phải — hình ctv_solo.png, full, không bo góc/khung */}
          <div className="hidden lg:flex items-end justify-center overflow-hidden">
            <img
              src="/banners/ctv_solo.png"
              alt="Cộng tác viên K-Outsourcing"
              className="max-h-[400px] w-auto object-contain object-bottom"
            />
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SECTION 2 — 5 LÝ DO
          Desktop: 5 cards  |  Mobile: 5 thanh ngang
      ════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              5 lý do bạn nên trở thành Cộng tác viên của K-Outsourcing
            </h2>
          </div>

          {/* Desktop: 5 cards */}
          <div className="hidden sm:grid grid-cols-5 gap-3">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md hover:shadow-orange-50/80 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-xl mb-3 group-hover:bg-orange-100 transition-colors">
                  {b.icon}
                </div>
                <h3 className="font-black text-gray-900 text-[13px] mb-1.5 leading-snug">{b.title}</h3>
                <p className="text-gray-500 text-[11px] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile: 5 thanh ngang */}
          <div className="sm:hidden space-y-2.5">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 bg-white hover:border-orange-200 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-[13px] leading-snug">{b.title}</p>
                  <p className="text-gray-500 text-[11px] leading-relaxed mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SECTION 3 — 5 BƯỚC HÀNH TRÌNH (ngang trên desktop)
      ════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-gray-900 text-sm font-black uppercase tracking-widest mb-1">5 bước đơn giản để có</p>
<h2 className="text-xl sm:text-2xl font-black text-orange-500">THU NHẬP HẤP DẪN</h2>
          </div>

          {/* Desktop — timeline ngang */}
          <div className="hidden sm:block">
            <div className="relative">
              {/* Đường kết nối các bước */}
              <div
                className="absolute h-px bg-gradient-to-r from-orange-100 via-orange-300 to-orange-100 pointer-events-none"
                style={{ top: '28px', left: 'calc(10% + 28px)', right: 'calc(10% + 28px)' }}
              />
              <div className="grid grid-cols-5 gap-4 relative">
                {STEPS.map((s, i) => (
                  <div key={i} className="flex flex-col items-center text-center px-2">
                    <div className="relative z-10 w-14 h-14 rounded-full bg-orange-500 text-white font-black text-base flex items-center justify-center mb-3 ring-4 ring-gray-50 shadow-md shadow-orange-100">
                      {s.num}
                    </div>
                    <span className="text-xl mb-2">{s.icon}</span>
                    <p className="font-black text-orange-600 text-[12px] leading-snug mb-1">{s.title}</p>
                    <p className="text-gray-500 text-[11px] leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile — timeline dọc */}
          <div className="sm:hidden">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-black text-sm flex items-center justify-center ring-2 ring-gray-50 shadow-sm">
                    {s.num}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-0.5 h-6 bg-orange-200 mt-1" />}
                </div>
                <div className="pb-5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-base">{s.icon}</span>
                    <p className="font-bold text-orange-600 text-[13px]">{s.title}</p>
                  </div>
                  <p className="text-gray-500 text-[12px] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SECTION 4 — FAQ
      ════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">Câu hỏi thường gặp</h2>
            <p className="text-gray-400 text-[13px]">Những thắc mắc phổ biến nhất về chương trình CTV</p>
          </div>
          <div className="space-y-2.5">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>

    
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FLOATING PHONE — cố định bên phải, 75% từ trên xuống
      ════════════════════════════════════════════════════ */}
      <div
        className="fixed right-4 z-50"
        style={{ top: '75%', transform: 'translateY(-50%)' }}
      >
        <div className="group relative">
          {/* Tooltip bên trái */}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none">
  <div className="bg-gray-900 text-white rounded-xl px-3 py-2 shadow-xl whitespace-nowrap">
              <p className="text-[10px] text-gray-400 leading-none mb-0.5">Liên hệ để được tư vấn chương trình CTV</p>
              <p className="text-orange-400 font-black text-sm">0397.013.122</p>
              <div className="absolute top-1/2 -translate-y-1/2 -right-[5px] w-2.5 h-2.5 bg-gray-900 rotate-45" />
            </div>
          </div>

          {/* Nút */}
          <a
            href="tel:0397013122"
            aria-label="Gọi tư vấn CTV: 0397 013 122"
            className="relative z-10 w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-300/50 transition-all hover:scale-110 active:scale-95"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
          </a>

          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-20 pointer-events-none" />
        </div>
      </div>

      <CTVModal open={modalOpen} onClose={() => setModalOpen(false)} />

    </SiteLayout>
  );
}
