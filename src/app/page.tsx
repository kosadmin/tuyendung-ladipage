/**
 * ─────────────────────────────────────────────────────────────
 * SEO NOTE: Vì page này dùng 'use client', metadata phải khai báo
 * trong app/layout.tsx. Thêm đoạn này:
 *
 * // app/layout.tsx (server component)
 * import type { Metadata } from 'next';
 * export const metadata: Metadata = {
 *   title: 'Việc làm tốt nhất | K-Outsourcing',
 *   description: 'Khám phá hàng nghìn việc làm tại K-Outsourcing. Thu nhập hấp dẫn, kết nối trực tiếp doanh nghiệp uy tín, hỗ trợ ứng viên tận tình.',
 *   keywords: 'việc làm, tuyển dụng, tìm việc, K-Outsourcing, nhân sự, lao động',
 *   alternates: { canonical: 'https://your-domain.com' },
 *   openGraph: {
 *     title: 'Việc làm tốt nhất | K-Outsourcing',
 *     description: 'Hàng nghìn cơ hội việc làm đang chờ bạn.',
 *     url: 'https://your-domain.com',
 *     siteName: 'K-Outsourcing',
 *     images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
 *     type: 'website',
 *   },
 *   twitter: { card: 'summary_large_image', title: 'Việc làm | K-Outsourcing' },
 *   robots: { index: true, follow: true },
 * };
 *
 * ─────────────────────────────────────────────────────────────
 * HƯỚNG DẪN ĐẶT BANNER:
 *
 * Tạo folder:  /public/banners/
 *
 * Banner PC (landscape) — khuyến nghị 1400×450px, tỉ lệ ~3:1
 *   /public/banners/pc-1.jpg
 *   /public/banners/pc-2.jpg
 *   /public/banners/pc-3.jpg
 *
 * Banner Mobile (portrait/square) — khuyến nghị 750×500px, tỉ lệ 3:2
 *   /public/banners/mobile-1.jpg
 *   /public/banners/mobile-2.jpg
 *   /public/banners/mobile-3.jpg
 *
 * Format khuyến nghị: .jpg (quality ~85) hoặc .webp
 * Dung lượng: PC < 200KB, Mobile < 100KB mỗi ảnh
 * ─────────────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Script from 'next/script';
import dynamic from 'next/dynamic';
const CTVModal = dynamic(() => import('@/components/CTVModal'), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────
interface Project {
  id: number;
  project_id: string;
  project: string;
  project_type: string;
  company: string;
  address_city: string;
  position: string | null;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
  highlight_info: string | null;
  icon_job: string | null;
  tags: string | null;
  hiring_form: string | null;
  age_max?: number | null;
}

interface FilterState {
  cities: string[];
  salaryRanges: string[];
  ageMaxes: number[];
}

const DEFAULT_FILTERS: FilterState = { cities: [], salaryRanges: [], ageMaxes: [] };
const PAGE_SIZE = 12;
const BANNER_INTERVAL = 5000; // 5 seconds

// ── Banner config ──────────────────────────────────────────────────────────
const BANNERS = [
  { src: '/banners/mobile-1.png', alt: 'Tuyển dụng công nhân – K-Outsourcing' },
  { src: '/banners/mobile-2.png', alt: 'Việc làm thu nhập cao – K-Outsourcing' },
  { src: '/banners/mobile-3.png', alt: 'Cơ hội nghề nghiệp tốt nhất – K-Outsourcing' },
];

// ── Salary / Age config ────────────────────────────────────────────────────
const ALL_SALARY_RANGES = [
  { key: '6-10',  label: '6–10 triệu',    min: 6,  max: 10   },
  { key: '10-15', label: '10–15 triệu',   min: 10, max: 15   },
  { key: '15-20', label: '15–20 triệu',   min: 15, max: 20   },
  { key: '20-30', label: '20–30 triệu',   min: 20, max: 30   },
  { key: '30+',   label: 'Trên 30 triệu', min: 30, max: null },
];

const AGE_OPTIONS = [
  { key: '30', label: 'Dưới 30', max: 30 },
  { key: '40', label: 'Dưới 40', max: 40 },
  { key: '50', label: 'Dưới 50', max: 50 },
  { key: '60', label: 'Dưới 60', max: 60 },
];

// ── Tag colors ─────────────────────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  'Tuyển gấp':  'bg-red-500 text-white',
  'Hot':        'bg-rose-500 text-white',
  'Ưu tiên':   'bg-orange-500 text-white',
  'Mới':        'bg-blue-500 text-white',
  'Thưởng lớn': 'bg-amber-500 text-white',
  'VIP':        'bg-purple-600 text-white',
};
const FALLBACK_COLORS = ['bg-teal-500 text-white','bg-cyan-600 text-white','bg-indigo-500 text-white','bg-pink-500 text-white'];
const tagColor = (t: string) =>
  TAG_COLORS[t] ?? FALLBACK_COLORS[t.split('').reduce((a,c) => a + c.charCodeAt(0), 0) % FALLBACK_COLORS.length];

function getRibbonTag(tags: string | null): string | null {
  if (!tags) return null;
  const list = tags.split(',').map(t => t.trim()).filter(Boolean);
  if (list.includes('Tuyển gấp')) return 'Tuyển gấp';
  return list.find(t => TAG_COLORS[t]) ?? list[0] ?? null;
}
function tagPriority(tags: string | null): number {
  if (!tags) return 0;
  if (tags.split(',').map(t => t.trim()).includes('Tuyển gấp')) return 2;
  return 1;
}
function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'THU NHẬP: THỎA THUẬN';
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(n % 1000 === 0 ? 0 : 1)} TỶ` : `${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} TRIỆU / THÁNG`;
  if (min) return `TỪ ${fmt(min)} TRIỆU / THÁNG`;
  return `ĐẾN ${fmt(max!)} TRIỆU / THÁNG`;
}

// ── Banner Carousel ────────────────────────────────────────────────────────
function BannerCarousel({ fillHeight = false }: { fillHeight?: boolean }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
const [ctvOpen, setCtvOpen] = useState(false);
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % BANNERS.length);
    }, BANNER_INTERVAL);
  }, []);

  useEffect(() => {
    if (!paused) startTimer();
    else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, startTimer]);

  const goTo = (i: number) => { setIdx(i); startTimer(); };

  return (
    <div
      className={`relative overflow-hidden bg-gray-900 ${fillHeight ? 'h-full' : 'aspect-[2/1] w-full'}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Banner tuyển dụng"
    >
      {/* Slides */}
      {BANNERS.map((b, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          aria-hidden={i !== idx}
        >
          <img
            src={b.src}
            alt={b.alt}
            className="w-full h-full object-contain"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Banner ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={() => goTo((idx - 1 + BANNERS.length) % BANNERS.length)}
        aria-label="Banner trước"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100"
      >
        ‹
      </button>
      <button
        onClick={() => goTo((idx + 1) % BANNERS.length)}
        aria-label="Banner tiếp theo"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100"
      >
        ›
      </button>
    </div>
  );
}

// ── Multi-select Dropdown ──────────────────────────────────────────────────
function MultiDropdown({ label, options, selected, onToggle, onClear }: {
  label: string;
  options: { key: string; label: string }[];
  selected: string[];
  onToggle: (key: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const count = selected.length;
  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all
          ${count > 0 || open
            ? 'bg-orange-500 text-white border-orange-500 shadow-md'
            : 'bg-white/90 text-gray-700 border-transparent hover:bg-white'}`}>
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {count > 0 && (
            <span className="bg-white/30 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
          <svg className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>
      {open && (
        <div role="listbox" className="absolute top-full left-0 mt-1.5 min-w-[160px] bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-1.5">
            {options.map(opt => (
              <label key={opt.key}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-[12px] transition
                  ${selected.includes(opt.key) ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={selected.includes(opt.key)} onChange={() => onToggle(opt.key)}
                  className="w-3.5 h-3.5 rounded accent-orange-500" />
                {opt.label}
              </label>
            ))}
          </div>
          {count > 0 && (
            <div className="border-t px-3 py-2">
              <button onClick={() => { onClear(); setOpen(false); }}
                className="text-[10px] text-red-400 font-bold hover:text-red-600 transition">
                Xóa lọc này
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Search + Filter Panel (shared content) ─────────────────────────────────
function SearchFilterPanel({
  search, onSearchChange,
  cities, availableSalaryRanges,
  filters, activeCount,
  onToggleCity, onToggleSalary, onToggleAge,
  onResetFilters,
  variant,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  cities: string[];
  availableSalaryRanges: typeof ALL_SALARY_RANGES;
  filters: FilterState;
  activeCount: number;
  onToggleCity: (c: string) => void;
  onToggleSalary: (k: string) => void;
  onToggleAge: (k: string) => void;
  onResetFilters: () => void;
  variant: 'sidebar' | 'hero'; // sidebar = PC right panel, hero = mobile bottom
}) {
  const isSidebar = variant === 'sidebar';

  return (
    <div className={isSidebar
      ? 'flex flex-col justify-center px-8 py-6'
      : 'px-4 py-7'}>

      {/* Title — only in sidebar */}
      {isSidebar && (
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white leading-snug">
            Khám phá công việc<br/>
            <span className="text-amber-200">mơ ước của bạn</span>
          </h1>
          <p className="text-orange-100 text-xs mt-2">Hàng nghìn cơ hội đang chờ bạn</p>
        </div>
      )}

      {/* Search */}
      <div className={`flex items-center bg-white rounded-2xl shadow-lg mb-3 px-4 ${isSidebar ? '' : 'shadow-orange-900/20'}`}>
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="search"
          placeholder="Tìm công việc, công ty..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Tìm kiếm việc làm"
          className="flex-1 py-3 outline-none text-sm bg-transparent"
        />
        {search && (
          <button onClick={() => onSearchChange('')} aria-label="Xóa tìm kiếm"
            className="text-gray-300 hover:text-gray-500 transition ml-2 text-lg leading-none">×</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-row flex-wrap gap-2 items-center">
        {cities.length > 0 && (
          <MultiDropdown label="Tỉnh thành"
            options={cities.map(c => ({ key: c, label: c }))}
            selected={filters.cities}
            onToggle={onToggleCity}
            onClear={() => { /* handled by resetFilters */ }}
          />
        )}
        {availableSalaryRanges.length > 0 && (
          <MultiDropdown label="Mức lương"
            options={availableSalaryRanges.map(r => ({ key: r.key, label: r.label }))}
            selected={filters.salaryRanges}
            onToggle={onToggleSalary}
            onClear={() => { /* handled by resetFilters */ }}
          />
        )}
        <MultiDropdown label="Độ tuổi"
          options={AGE_OPTIONS.map(o => ({ key: String(o.max), label: o.label }))}
          selected={filters.ageMaxes.map(String)}
          onToggle={onToggleAge}
          onClear={() => { /* handled by resetFilters */ }}
        />
        {activeCount > 0 && (
          <button onClick={onResetFilters}
            className="flex-shrink-0 px-3 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition border border-white/30">
            Xóa ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const ribbon    = getRibbonTag(project.tags);
  const positions = project.position?.split(',').map(p => p.trim()).filter(Boolean) ?? [];
  return (
    <article>
      <Link href={`/${project.project_id}`}
        className="group relative flex flex-col bg-white rounded-2xl border border-gray-100
                   hover:border-orange-200 shadow-md shadow-gray-200/80 hover:shadow-2xl hover:shadow-orange-100/80
                   transition-all duration-300 overflow-hidden h-full">
        {ribbon && (
          <div className="absolute top-0 right-0 z-10" aria-label={`Nhãn: ${ribbon}`}>
            <div className={`${tagColor(ribbon)} text-[11px] font-black px-4 py-1.5 rounded-bl-xl tracking-wide`}>
              {ribbon}
            </div>
          </div>
        )}
        <div className="p-5 pb-3 flex gap-3 items-start">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
            {project.icon_job
              ? <img src={project.icon_job} alt={`Logo ${project.company}`} className="w-full h-full object-contain p-1" loading="lazy" />
              : <span className="text-2xl" role="img" aria-label="Công ty">🏭</span>}
          </div>
          <div className="flex-1 min-w-0 pr-12">
            <h3 className="font-black text-gray-900 text-base leading-tight line-clamp-2 group-hover:text-orange-700 transition-colors">
              {project.company}
            </h3>
            <p className="mt-1 inline-flex items-center gap-1 text-orange-500 font-bold text-[12px]">
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
              </svg>
              {project.address_city}
            </p>
          </div>
        </div>
        {positions.length > 0 && (
          <ul className="px-5 pb-3" aria-label="Vị trí tuyển dụng">
            {positions.map((pos, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-800 font-bold text-[15px] leading-snug mb-1.5 last:mb-0">
                <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-[6px]" aria-hidden="true" />
                <span>{pos}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mx-5 border-t border-gray-100" />
        <div className="px-5 pt-3 pb-3">
          <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2.5">
            <span aria-hidden="true">💰</span>
            <span className="text-orange-700 font-black text-[13px] tracking-wide">
              {formatSalary(project.salary_min, project.salary_max)}
            </span>
          </div>
        </div>
        {project.highlight_info && (
          <div className="px-5 pb-4">
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-amber-700 text-[12px] font-bold line-clamp-2">🎁 {project.highlight_info}</p>
            </div>
          </div>
        )}
        <div className="flex-1" />
      </Link>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse" aria-hidden="true">
      <div className="p-5 flex gap-3">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="px-5 pb-3 space-y-2">
        <div className="h-5 bg-gray-100 rounded w-full" />
        <div className="h-5 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="mx-5 border-t border-gray-100" />
      <div className="px-5 py-3"><div className="h-9 bg-orange-50 rounded-xl" /></div>
    </div>
  );
}

function Pagination({ page, totalPages, setPage }: {
  page: number; totalPages: number; setPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .reduce<(number | '...')[]>((acc, n, i, arr) => {
      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
      acc.push(n); return acc;
    }, []);
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-2 mt-8 pb-4">
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
        aria-label="Trang trước"
        className="px-4 py-2 rounded-xl border text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
        ← Trước
      </button>
      {pages.map((n, i) => n === '...'
        ? <span key={`dot-${i}`} className="px-1 text-gray-300" aria-hidden="true">…</span>
        : (
          <button key={n} onClick={() => setPage(n as number)}
            aria-label={`Trang ${n}`} aria-current={page === n ? 'page' : undefined}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition ${page === n ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'border text-gray-500 hover:bg-gray-50'}`}>
            {n}
          </button>
        )
      )}
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        aria-label="Trang sau"
        className="px-4 py-2 rounded-xl border text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
        Sau →
      </button>
    </nav>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filters, setFilters]   = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage]         = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const { data, error: e } = await supabase
          .from('projects')
          .select('id,project_id,project,project_type,company,address_city,position,salary_min,salary_max,status,highlight_info,icon_job,tags,hiring_form,age_max')
          .eq('privacy', 'Công khai')
          .eq('status', 'Đang tuyển')
          .order('created_at', { ascending: false });
        if (e) throw e;
        setProjects(data || []);
      } catch { setError('Không thể tải danh sách. Vui lòng thử lại.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const cities = useMemo(() =>
    Array.from(new Set(projects.map(p => p.address_city).filter(Boolean))).sort()
  , [projects]);

  const availableSalaryRanges = useMemo(() =>
    ALL_SALARY_RANGES.filter(range =>
      projects.some(p => {
        const pMin = p.salary_min ?? 0; const pMax = p.salary_max ?? 999;
        if (range.max === null) return pMax >= range.min || pMin >= range.min;
        return pMin <= range.max && pMax >= range.min;
      })
    )
  , [projects]);

  const filtered = useMemo(() => {
    let r = [...projects];
    if (search.trim()) {
      const s = search.toLowerCase();
      r = r.filter(p =>
        p.project?.toLowerCase().includes(s) ||
        p.company?.toLowerCase().includes(s) ||
        p.position?.toLowerCase().includes(s) ||
        p.address_city?.toLowerCase().includes(s)
      );
    }
    if (filters.cities.length > 0) r = r.filter(p => filters.cities.includes(p.address_city));
    if (filters.salaryRanges.length > 0) {
      r = r.filter(p => filters.salaryRanges.some(key => {
        const range = ALL_SALARY_RANGES.find(sr => sr.key === key); if (!range) return false;
        const pMin = p.salary_min ?? 0; const pMax = p.salary_max ?? 999;
        if (range.max === null) return pMax >= range.min || pMin >= range.min;
        return pMin <= range.max && pMax >= range.min;
      }));
    }
    if (filters.ageMaxes.length > 0) {
      const maxAge = Math.max(...filters.ageMaxes);
      r = r.filter(p => !p.age_max || p.age_max <= maxAge);
    }
    r.sort((a, b) => tagPriority(b.tags) - tagPriority(a.tags));
    return r;
  }, [projects, search, filters]);

  useEffect(() => { setPage(1); }, [search, filters]);

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = filters.cities.length + filters.salaryRanges.length + filters.ageMaxes.length;

  const toggleCity   = (city: string) => setFilters(prev => ({ ...prev, cities: prev.cities.includes(city) ? prev.cities.filter(c => c !== city) : [...prev.cities, city] }));
  const toggleSalary = (key: string)  => setFilters(prev => ({ ...prev, salaryRanges: prev.salaryRanges.includes(key) ? prev.salaryRanges.filter(k => k !== key) : [...prev.salaryRanges, key] }));
  const toggleAge    = (key: string)  => {
    const max = Number(key);
    setFilters(prev => ({ ...prev, ageMaxes: prev.ageMaxes.includes(max) ? prev.ageMaxes.filter(m => m !== max) : [...prev.ageMaxes, max] }));
  };
  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const sharedPanelProps = {
    search, onSearchChange: setSearch,
    cities, availableSalaryRanges,
    filters, activeCount,
    onToggleCity: toggleCity,
    onToggleSalary: toggleSalary,
    onToggleAge: toggleAge,
    onResetFilters: resetFilters,
  };

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://your-domain.com/#org',
        name: 'K-Outsourcing',
        url: 'https://your-domain.com',
        logo: 'https://your-domain.com/logo.png',
        contactPoint: [
          { '@type': 'ContactPoint', telephone: '+84325277292', contactType: 'customer service', areaServed: 'VN', availableLanguage: 'Vietnamese' },
          { '@type': 'ContactPoint', telephone: '+84397013122', contactType: 'customer service', areaServed: 'VN', availableLanguage: 'Vietnamese' },
        ],
        email: 'info@koutsourcing.vn',
        address: { '@type': 'PostalAddress', streetAddress: 'B-TT13-04, Khu nhà ở Ngân Hà Vạn Phúc', addressLocality: 'Hà Đông', addressRegion: 'Hà Nội', addressCountry: 'VN' },
        sameAs: ['https://www.facebook.com/KOutsourcingVietNam', 'https://www.tiktok.com/@nhanluckos'],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://your-domain.com/#website',
        url: 'https://your-domain.com',
        name: 'K-Outsourcing – Tìm việc làm',
        publisher: { '@id': 'https://your-domain.com/#org' },
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: 'https://your-domain.com?q={search_term_string}' }, 'query-input': 'required name=search_term_string' },
      },
    ],
  };

  return (
    <>
      <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-gray-50">

        {/* ── HEADER ── */}
        <header role="banner" className="sticky top-0 z-40 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <Link href="/" aria-label="K-Outsourcing – Trang chủ">
              <img src="/logo.png" alt="K-Outsourcing logo" className="h-8 w-auto" width={120} height={32} />
            </Link>
          </div>
        </header>

        <main id="main-content">

          {/* ════════════════════════════════════════════════════
              PC HERO: Search panel (left, 40%) + Banner (right, 60%)
              Only visible on lg+ screens
          ════════════════════════════════════════════════════ */}
<section aria-label="Tìm kiếm việc làm" className="hidden lg:flex group items-stretch">
  {/* Search panel — LEFT 40% */}
  <div className="w-[40%] flex flex-col justify-center" style={{ background: 'linear-gradient(135deg, #ea6715 0%, #f36a13 100%)' }}  >
    <SearchFilterPanel {...sharedPanelProps} variant="sidebar" />
  </div>

  {/* Banner — RIGHT 60%, height driven by parent aspect ratio */}
<div className="w-[60%]">  {/* không fillHeight nữa */}
    <BannerCarousel />        {/* dùng aspect-[2/1] tự nhiên */}
  </div>
</section>

          {/* ════════════════════════════════════════════════════
              MOBILE / TABLET HERO: Banner overlaps search section
              Only visible below lg
          ════════════════════════════════════════════════════ */}
<section aria-label="Tìm kiếm việc làm" className="lg:hidden">
    {/* Search ngay bên dưới */}
  <div style={{ background: 'linear-gradient(135deg, #ea6715 0%, #f36a13 100%)' }}>
    <div className="max-w-2xl mx-auto text-center px-4 pt-6 pb-2">
      <h1 className="text-2xl font-black text-white leading-tight mb-1">KHÁM PHÁ CÔNG VIỆC</h1>
      <p className="text-2xl font-black text-amber-100 leading-tight mb-4">MƠ ƯỚC CỦA BẠN</p>
    </div>
    <SearchFilterPanel {...sharedPanelProps} variant="hero" />
  </div>
  {/* Banner bình thường, không absolute */}
  <div style={{ aspectRatio: '2/1' }} className="w-full overflow-hidden">
    <BannerCarousel />
  </div>
</section>

          {/* ── JOB LISTINGS ── */}
          <section aria-label="Danh sách việc làm" className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-6">🔥 Việc làm HOT nhất</h2>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center mb-4">
                {error}
                <button onClick={() => window.location.reload()} className="ml-2 underline font-bold">Thử lại</button>
              </div>
            )}

            {loading && (
              <div aria-busy="true" aria-label="Đang tải danh sách" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <span className="text-5xl mb-4" aria-hidden="true">🔍</span>
                <p className="font-bold text-sm">Không tìm thấy vị trí phù hợp</p>
                <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </section>

          {/* ── ABOUT / STATS ── */}
                 <section aria-label="Về K-Outsourcing" className="bg-white py-16 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-orange-500 leading-tight mb-5">
                    Việc làm trong tầm tay<br/>Thành công trong tầm với
                  </h2>
                  <p className="text-gray-500 leading-relaxed mb-6 text-[15px]">
                    K-Outsourcing kết nối ứng viên với hàng nghìn cơ hội việc làm phù hợp — nhanh chóng, minh bạch và hoàn toàn miễn phí. Dù bạn đang tìm việc hay muốn kiếm thêm thu nhập qua giới thiệu nhân sự, đây là nơi dành cho bạn.
                  </p>
                  <ul className="space-y-3" aria-label="Điểm nổi bật">
                    {[
                      'Việc làm chất lượng, thu nhập rõ ràng',
                      'Kết nối trực tiếp với doanh nghiệp uy tín',
                      'Hỗ trợ ứng viên từ A đến Z trong quá trình tuyển dụng',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-[14px] text-gray-600">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center" aria-hidden="true">
                          <svg className="w-3 h-3 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '500k+', label: 'Hồ sơ trên hệ thống',     accent: 'orange',
                      icon: <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
                    { value: '130k+', label: 'Lao động đã tuyển dụng',   accent: 'none',
                      icon: <svg className="w-9 h-9 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
                    { value: '120+',  label: 'Chuyên viên tuyển dụng',   accent: 'none',
                      icon: <svg className="w-9 h-9 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
                    { value: '60+',   label: 'Doanh nghiệp đồng hành',   accent: 'yellow',
                      icon: <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-2xl p-4 flex flex-col gap-2 shadow-sm transition-transform hover:-translate-y-1
                      ${s.accent === 'orange' ? 'bg-orange-500' : s.accent === 'yellow' ? 'bg-yellow-400' : 'bg-gray-50 border border-gray-100'}`}>
                      <div aria-hidden="true">{s.icon}</div>
                      <p className={`text-3xl font-black leading-none ${s.accent !== 'none' ? 'text-white' : 'text-orange-500'}`}>{s.value}</p>
                      <p className={`text-xs font-semibold leading-snug ${s.accent === 'orange' ? 'text-orange-100' : s.accent === 'yellow' ? 'text-white' : 'text-orange-400'}`}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── CTV SECTION ── */}
          <section aria-label="Chương trình Cộng tác viên" className="py-16 px-4 sm:px-6 bg-gradient-to-br from-orange-50 via-amber-50 to-white">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-[11px] font-black uppercase tracking-widest rounded-full mb-4">
                    Chương trình Cộng tác viên
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-3">
                    Giới thiệu việc làm<br/>Nhận hoa hồng hấp dẫn
                  </h2>
                  <p className="text-gray-500 text-[15px] leading-relaxed mb-6">
                    Bạn biết ai đang tìm việc? Hãy giới thiệu với chúng tôi. Chỉ cần một chiếc điện thoại là bạn có thể bắt đầu kiếm thu nhập ngay hôm nay.
                  </p>
                  <ul className="space-y-3 mb-8" aria-label="Quyền lợi cộng tác viên">
                    {[
                      'Thu nhập không giới hạn theo số lượng giới thiệu',
                      'Không mất phí tham gia, không yêu cầu kinh nghiệm',
                      'Theo dõi hồ sơ & hoa hồng minh bạch trên hệ thống',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-[14px] text-gray-600">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center" aria-hidden="true">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        </span>
                        {item}
                      </li>
                    ))}
</ul>
                  <button
                    onClick={() => setCtvOpen(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-200 transition-all hover:shadow-xl active:scale-95">
                    Đăng ký làm Cộng tác viên ngay →
                  </button>
                </div>
<div className="rounded-2xl overflow-hidden shadow-xl bg-orange-50">
  <img
    src="/banners/mobile-2.png"
    alt="Chương trình Cộng tác viên"
    className="w-full h-full object-cover"
    style={{ aspectRatio: '3/2' }}
  />
</div>
              </div>
            </div>
          </section>
{/* Tooltip nhắc click */}
<div className="fixed right-4 bottom-[33%] z-50 text-white text-[11px] font-bold px-3 py-2.5 rounded-xl shadow-xl leading-snug max-w-[130px] text-center pointer-events-none"
  style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
  👆 Bấm vào công việc để xem chi tiết & ứng tuyển
</div>
          <CTVModal open={ctvOpen} onClose={() => setCtvOpen(false)} />
        </main>

        {/* ── FOOTER ── */}
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
    </>
  );
}
