import Link from 'next/link';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">

    <header role="banner" className="sticky top-0 z-40 bg-white border-b shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-6">
    {/* Logo */}
    <Link href="/" aria-label="K-Outsourcing – Trang chủ">
      <img src="/logo.png" alt="K-Outsourcing logo" className="h-8 w-auto" width={120} height={32} />
    </Link>

    {/* Nav */}
    <nav className="hidden lg:flex items-center gap-1" aria-label="Menu chính">
  <Link
    href="/cong-tac-vien"
    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all"
  >
    Cộng tác viên
  </Link>
  
    <a href="https://koutsourcing.vn/"
    target="_blank"
    rel="noopener noreferrer"
    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all"
  >
    Tin tức
  </a>
</nav>
  </div>
</header>

      <main id="main-content">
        {children}
      </main>

<footer role="contentinfo" className="bg-gray-100 border-t border-gray-200 pt-10 pb-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/*
              Layout:
              - Mobile:  col1 full width → then col2+col3 side-by-side (2 cols)
              - PC:      col1 (40%) | col2 hotline (30%) | col3 email+social (30%)

              Trick: outer grid = 2-col on mobile (col1 spans 2), 3-col on sm+
            */}
            <div className="grid grid-cols-2 sm:grid-cols-[2fr_1.5fr_1.5fr] gap-6 lg:gap-10">

              {/* Col 1 — spans full width on mobile, 1 col on sm+ */}
              <div className="col-span-2 sm:col-span-1">
                <Link href="/" aria-label="K-Outsourcing – Trang chủ">
                  <img src="/logo.png" alt="K-Outsourcing" className="h-9 w-auto mb-4" width={140} height={36} />
                </Link>
                <p className="text-gray-500 text-[13px] leading-relaxed mb-3">
                  <strong className="text-gray-700 font-bold">Công ty Cổ phần Giải pháp nhân sự & Tư vấn đầu tư K-Outsourcing</strong>{' '}
                  — cung cấp dịch vụ cho thuê lại lao động và giải pháp nhân sự toàn diện cho doanh nghiệp.
                </p>
                <address className="not-italic">
                  <span className="inline-flex items-start gap-1.5 text-[13px] text-gray-500 leading-relaxed">
                    <svg className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    B-TT13-04, Khu nhà ở Ngân Hà Vạn Phúc, Phường Hà Đông, TP Hà Nội, Việt Nam
                  </span>
                </address>
              </div>

              {/* Col 2 — Hotline (col-span-1 on both mobile and sm+) */}
              <div className="col-span-1">
                <p className="text-black font-black text-[10px] uppercase tracking-widest mb-3">Hotline tuyển dụng</p>
                <div className="space-y-3">
                  {[
                    { number: '0325 277 292', label: 'Tư vấn miễn phí 24/7' },
                    { number: '0397 013 122', label: 'Hỗ trợ ứng viên' },
                  ].map(phone => (
                    <a key={phone.number} href={`tel:${phone.number.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 group">
                      <span className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-orange-600">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                      </span>
                      <div>
                        <p className="text-gray-800 font-black text-[13px] leading-none group-hover:text-orange-500 transition-colors">{phone.number}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5">{phone.label}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Col 3 — Email + Social (col-span-1 on both mobile and sm+) */}
              <div className="col-span-1">
                <p className="text-black font-black text-[10px] uppercase tracking-widest mb-3">Email</p>
                <a href="mailto:info@koutsourcing.vn" className="flex items-center gap-2 group mb-5">
                  <span className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-orange-600">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </span>
                  <div>
                    <p className="text-gray-800 font-black text-[13px] leading-none group-hover:text-orange-500 transition-colors break-all">info@koutsourcing.vn</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">Phản hồi trong 24h</p>
                  </div>
                </a>

                <p className="text-black font-black text-[10px] uppercase tracking-widest mb-2.5">Theo dõi chúng tôi</p>
                <div className="flex gap-2">
                  {/* Facebook — brand blue #1877F2 */}
                  <a href="https://www.facebook.com/KOutsourcingVietNam" target="_blank" rel="noopener noreferrer"
                    aria-label="Facebook K-Outsourcing"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-85"
                    style={{ backgroundColor: '#1877F2' }}>
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                    </svg>
                  </a>
                  {/* Zalo — brand blue #0068FF */}
                  <a href="https://zalo.me/koutsourcing" target="_blank" rel="noopener noreferrer"
                    aria-label="Zalo K-Outsourcing"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-85"
                    style={{ backgroundColor: '#0068FF' }}>
                    <span className="text-[9px] font-black text-white leading-none tracking-tight">Zalo</span>
                  </a>
                  {/* TikTok — brand black */}
                  <a href="https://www.tiktok.com/@nhanluckos" target="_blank" rel="noopener noreferrer"
                    aria-label="TikTok K-Outsourcing"
                    className="w-8 h-8 rounded-lg bg-black flex items-center justify-center transition-all hover:opacity-80">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                    </svg>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </footer>

    </div>
  );
}
