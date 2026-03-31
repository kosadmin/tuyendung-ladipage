'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SiteLayout from '@/components/SiteLayout';

// ── Types ──────────────────────────────────────────────────────────────────
interface CTVUser {
  user_id: string;
  name: string;
  user_group: string;
  user_status: string | null;
}

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
}

const DEFAULT_FILTERS: FilterState = { cities: [], salaryRanges: [] };
const PAGE_SIZE = 12;
const BANNER_INTERVAL = 5000;

const BANNERS = [
  { src: '/banners/mobile-1.png', alt: 'Tuyển dụng công nhân – K-Outsourcing' },
  { src: '/banners/mobile-2.png', alt: 'Việc làm thu nhập cao – K-Outsourcing' },
  { src: '/banners/mobile-3.png', alt: 'Cơ hội nghề nghiệp tốt nhất – K-Outsourcing' },
];

const ALL_SALARY_RANGES = [
  { key: '6-10',  label: '6–10 triệu',    min: 6,  max: 10   },
  { key: '10-15', label: '10–15 triệu',   min: 10, max: 15   },
  { key: '15-20', label: '15–20 triệu',   min: 15, max: 20   },
  { key: '20-30', label: '20–30 triệu',   min: 20, max: 30   },
  { key: '30+',   label: 'Trên 30 triệu', min: 30, max: null },
];

const TAG_COLORS: Record<string, string> = {
  'Tuyển gấp':  'bg-red-500 text-white',
  'Hot':        'bg-rose-500 text-white',
  'Ưu tiên':    'bg-orange-500 text-white',
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
function BannerCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), BANNER_INTERVAL);
  }, []);

  useEffect(() => {
    if (!paused) startTimer();
    else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, startTimer]);

  const goTo = (i: number) => { setIdx(i); startTimer(); };

  return (
    <div
      className="relative overflow-hidden bg-gray-900 aspect-[2/1] w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {BANNERS.map((b, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img src={b.src} alt={b.alt} className="w-full h-full object-contain" loading={i === 0 ? 'eager' : 'lazy'} />
        </div>
      ))}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
        ))}
      </div>
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
      <button onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all
          ${count > 0 || open ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/90 text-gray-700 border-transparent hover:bg-white'}`}>
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {count > 0 && <span className="bg-white/30 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{count}</span>}
          <svg className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 min-w-[160px] bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
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
              <button onClick={() => { onClear(); setOpen(false); }} className="text-[10px] text-red-400 font-bold hover:text-red-600">Xóa lọc này</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ project, ctvId }: { project: Project; ctvId: string }) {
  const ribbon = getRibbonTag(project.tags);
  const positions = project.position?.split(',').map(p => p.trim()).filter(Boolean) ?? [];
  return (
    <article>
      {/* Link sang /ctv/[ctv_id]/[project_id] thay vì /[project_id] */}
      <Link href={`/ctv/${ctvId}/${project.project_id}`}
        className="group relative flex flex-col bg-white rounded-2xl border border-gray-100
                   hover:border-orange-200 shadow-md shadow-gray-200/80 hover:shadow-2xl hover:shadow-orange-100/80
                   transition-all duration-300 overflow-hidden h-full">
        {ribbon && (
          <div className="absolute top-0 right-0 z-10">
            <div className={`${tagColor(ribbon)} text-[11px] font-black px-4 py-1.5 rounded-bl-xl tracking-wide`}>{ribbon}</div>
          </div>
        )}
        <div className="p-5 pb-3 flex gap-3 items-start">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
            {project.icon_job
              ? <img src={project.icon_job} alt={`Logo ${project.company}`} className="w-full h-full object-contain p-1" loading="lazy" />
              : <span className="text-2xl">🏭</span>}
          </div>
          <div className="flex-1 min-w-0 pr-12">
            <h3 className="font-black text-gray-900 text-base leading-tight line-clamp-2 group-hover:text-orange-700 transition-colors">{project.company}</h3>
            <p className="mt-1 inline-flex items-center gap-1 text-orange-500 font-bold text-[12px]">
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
              </svg>
              {project.address_city}
            </p>
          </div>
        </div>
        {positions.length > 0 && (
          <ul className="px-5 pb-3">
            {positions.map((pos, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-800 font-bold text-[15px] leading-snug mb-1.5 last:mb-0">
                <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-[6px]" />
                <span>{pos}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mx-5 border-t border-gray-100" />
        <div className="px-5 pt-3 pb-3">
          <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2.5">
            <span>💰</span>
            <span className="text-orange-700 font-black text-[13px] tracking-wide">{formatSalary(project.salary_min, project.salary_max)}</span>
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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
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

function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .reduce<(number | '...')[]>((acc, n, i, arr) => {
      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
      acc.push(n); return acc;
    }, []);
  return (
    <nav className="flex items-center justify-center gap-2 mt-8 pb-4">
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
        className="px-4 py-2 rounded-xl border text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">← Trước</button>
      {pages.map((n, i) => n === '...'
        ? <span key={`dot-${i}`} className="px-1 text-gray-300">…</span>
        : <button key={n} onClick={() => setPage(n as number)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition ${page === n ? 'bg-orange-500 text-white shadow-md' : 'border text-gray-500 hover:bg-gray-50'}`}>{n}</button>
      )}
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="px-4 py-2 rounded-xl border text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">Sau →</button>
    </nav>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CTVPage() {
  const { ctv_id } = useParams<{ ctv_id: string }>();

  const [ctv, setCtv]           = useState<CTVUser | null>(null);
  const [ctvLoading, setCtvLoading] = useState(true);
  const [ctvError, setCtvError] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filters, setFilters]   = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage]         = useState(1);

  // Load CTV info
  useEffect(() => {
    if (!ctv_id) return;
    (async () => {
      setCtvLoading(true);
      const { data } = await supabase
        .from('users')
        .select('user_id, name, user_group, user_status')
        .eq('user_id', ctv_id)
        .single();

      if (!data || data.user_status === 'inactive') {
        setCtvError(true);
      } else {
        setCtv(data);
      }
      setCtvLoading(false);
    })();
  }, [ctv_id]);

  // Load projects
  useEffect(() => {
    (async () => {
      setLoading(true);
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
    r.sort((a, b) => tagPriority(b.tags) - tagPriority(a.tags));
    return r;
  }, [projects, search, filters]);

  useEffect(() => { setPage(1); }, [search, filters]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = filters.cities.length + filters.salaryRanges.length;

  const toggleCity   = (city: string) => setFilters(prev => ({ ...prev, cities: prev.cities.includes(city) ? prev.cities.filter(c => c !== city) : [...prev.cities, city] }));
  const toggleSalary = (key: string)  => setFilters(prev => ({ ...prev, salaryRanges: prev.salaryRanges.includes(key) ? prev.salaryRanges.filter(k => k !== key) : [...prev.salaryRanges, key] }));
  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  // ── CTV loading / error states ──
  if (ctvLoading) return (
    <SiteLayout>
      <div className="min-h-[60vh] flex items-center justify-center gap-3 text-gray-400">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        Đang tải...
      </div>
    </SiteLayout>
  );

  if (ctvError || !ctv) return (
    <SiteLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400 gap-3">
        <span className="text-5xl">🔒</span>
        <p className="font-bold text-gray-600">Link này không còn hiệu lực</p>
        <p className="text-sm">Vui lòng liên hệ người giới thiệu để được hỗ trợ.</p>
        <Link href="/" className="mt-2 text-orange-500 text-sm underline">Xem trang tuyển dụng chính</Link>
      </div>
    </SiteLayout>
  );

  return (
    <SiteLayout>

      {/* ── Hero PC ── */}
      <section className="hidden lg:flex group items-stretch">
        <div className="w-[40%] flex flex-col justify-center px-8 py-6" style={{ background: 'linear-gradient(135deg, #ea6715 0%, #f36a13 100%)' }}>
          <h1 className="text-2xl font-black text-white leading-snug mb-6">
            KHÁM PHÁ CÔNG VIỆC<br/>
            <span className="text-amber-200">MƠ ƯỚC CỦA BẠN</span>
          </h1>
          {/* Search */}
          <div className="flex items-center bg-white rounded-2xl shadow-lg mb-3 px-4">
            <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="search" placeholder="Tìm công việc, công ty..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 py-3 outline-none text-sm bg-transparent" />
            {search && <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 ml-2 text-lg">×</button>}
          </div>
          {/* Filters */}
          <div className="flex flex-row flex-wrap gap-2 items-center">
            {cities.length > 0 && (
              <MultiDropdown label="Tỉnh thành" options={cities.map(c => ({ key: c, label: c }))}
                selected={filters.cities} onToggle={toggleCity} onClear={() => setFilters(f => ({ ...f, cities: [] }))} />
            )}
            {availableSalaryRanges.length > 0 && (
              <MultiDropdown label="Mức lương" options={availableSalaryRanges.map(r => ({ key: r.key, label: r.label }))}
                selected={filters.salaryRanges} onToggle={toggleSalary} onClear={() => setFilters(f => ({ ...f, salaryRanges: [] }))} />
            )}
            {activeCount > 0 && (
              <button onClick={resetFilters}
                className="px-3 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30">
                Xóa ({activeCount})
              </button>
            )}
          </div>
        </div>
        <div className="w-[60%]"><BannerCarousel /></div>
      </section>

      {/* ── Hero Mobile ── */}
      <section className="lg:hidden">
        <div style={{ background: 'linear-gradient(135deg, #ea6715 0%, #f36a13 100%)' }}>
          <div className="max-w-2xl mx-auto text-center px-4 pt-6 pb-2">
            <h1 className="text-2xl font-black text-white leading-tight mb-1">KHÁM PHÁ CÔNG VIỆC</h1>
            <p className="text-2xl font-black text-amber-100 leading-tight mb-4">MƠ ƯỚC CỦA BẠN</p>
          </div>
          <div className="px-4 pt-2 pb-6">
            <div className="flex items-center bg-white rounded-2xl shadow-lg mb-3 px-4">
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="search" placeholder="Tìm công việc, công ty..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 py-3 outline-none text-sm bg-transparent" />
              {search && <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500 ml-2 text-lg">×</button>}
            </div>
            <div className="flex flex-row flex-wrap gap-2 items-center">
              {cities.length > 0 && (
                <MultiDropdown label="Tỉnh thành" options={cities.map(c => ({ key: c, label: c }))}
                  selected={filters.cities} onToggle={toggleCity} onClear={() => setFilters(f => ({ ...f, cities: [] }))} />
              )}
              {availableSalaryRanges.length > 0 && (
                <MultiDropdown label="Mức lương" options={availableSalaryRanges.map(r => ({ key: r.key, label: r.label }))}
                  selected={filters.salaryRanges} onToggle={toggleSalary} onClear={() => setFilters(f => ({ ...f, salaryRanges: [] }))} />
              )}
              {activeCount > 0 && (
                <button onClick={resetFilters}
                  className="px-3 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30">
                  Xóa ({activeCount})
                </button>
              )}
            </div>
          </div>
        </div>
        <div style={{ aspectRatio: '2/1' }} className="w-full overflow-hidden"><BannerCarousel /></div>
      </section>

      {/* ── Job Listings ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-6">🔥 Việc làm HOT nhất</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center mb-4">
            {error} <button onClick={() => window.location.reload()} className="ml-2 underline font-bold">Thử lại</button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-5xl mb-4">🔍</span>
            <p className="font-bold text-sm">Không tìm thấy vị trí phù hợp</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map(p => <ProjectCard key={p.id} project={p} ctvId={ctv_id} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </section>
    </SiteLayout>
  );
}
