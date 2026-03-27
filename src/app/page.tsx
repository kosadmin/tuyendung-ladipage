'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
  salaryRange: string | null;
  ageMax: number | null;
}

const DEFAULT_FILTERS: FilterState = {
  cities: [],
  salaryRange: null,
  ageMax: null,
};

const PAGE_SIZE = 12;

// ── Salary presets ─────────────────────────────────────────────────────────
const SALARY_RANGES = [
  { key: '6-10',  label: '6 – 10 triệu',  min: 6,  max: 10  },
  { key: '10-15', label: '10 – 15 triệu', min: 10, max: 15  },
  { key: '15-20', label: '15 – 20 triệu', min: 15, max: 20  },
  { key: '20-30', label: '20 – 30 triệu', min: 20, max: 30  },
  { key: '30+',   label: 'Trên 30 triệu', min: 30, max: null },
];

const AGE_OPTIONS = [
  { key: '30', label: 'Dưới 30 tuổi', max: 30 },
  { key: '40', label: 'Dưới 40 tuổi', max: 40 },
  { key: '50', label: 'Dưới 50 tuổi', max: 50 },
  { key: '60', label: 'Dưới 60 tuổi', max: 60 },
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
const FALLBACK_COLORS = [
  'bg-teal-500 text-white', 'bg-cyan-600 text-white',
  'bg-indigo-500 text-white', 'bg-pink-500 text-white',
];
const tagColor = (t: string) =>
  TAG_COLORS[t] ?? FALLBACK_COLORS[t.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACK_COLORS.length];

function getRibbonTag(tags: string | null): string | null {
  if (!tags) return null;
  const list = tags.split(',').map(t => t.trim()).filter(Boolean);
  if (list.includes('Tuyển gấp')) return 'Tuyển gấp';
  return list.find(t => TAG_COLORS[t]) ?? list[0] ?? null;
}

function tagPriority(tags: string | null): number {
  if (!tags) return 0;
  const list = tags.split(',').map(t => t.trim());
  if (list.includes('Tuyển gấp')) return 2;
  return list.some(t => t) ? 1 : 0;
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'THU NHẬP: THỎA THUẬN';
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)} TỶ` : `${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} TRIỆU / THÁNG`;
  if (min) return `TỪ ${fmt(min)} TRIỆU / THÁNG`;
  return `ĐẾN ${fmt(max!)} TRIỆU / THÁNG`;
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const ribbon    = getRibbonTag(project.tags);
  const positions = project.position?.split(',').map(p => p.trim()).filter(Boolean) ?? [];

  return (
    <Link href={`/${project.project_id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100
                 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-50/70
                 transition-all duration-300 overflow-hidden">

      {/* Ribbon tag — larger */}
      {ribbon && (
        <div className="absolute top-0 right-0 z-10">
          <div className={`${tagColor(ribbon)} text-[11px] font-black px-4 py-1.5 rounded-bl-xl tracking-wide shadow-sm`}>
            {ribbon}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-5 pb-3 flex gap-3 items-start">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl border border-gray-100 bg-gray-50
                        flex items-center justify-center overflow-hidden shadow-sm">
          {project.icon_job
            ? <img src={project.icon_job} alt={project.company} className="w-full h-full object-contain p-1" />
            : <span className="text-2xl">🏭</span>}
        </div>
        <div className="flex-1 min-w-0 pr-12">
          {/* Title = company */}
          <h3 className="font-black text-gray-900 text-base leading-tight line-clamp-2
                         group-hover:text-orange-700 transition-colors">
            {project.company}
          </h3>
          {/* City — orange, prominent */}
          <p className="mt-1 inline-flex items-center gap-1 text-orange-500 font-bold text-[12px]">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
            </svg>
            {project.address_city}
          </p>
        </div>
      </div>

      {/* Positions — larger */}
      {positions.length > 0 && (
        <div className="px-5 pb-3">
          {positions.map((pos, i) => (
            <div key={i} className="flex items-start gap-2 text-gray-800 font-bold text-[15px] leading-snug mb-1.5 last:mb-0">
              <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-[6px]" />
              <span>{pos}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mx-5 border-t border-gray-100" />

      {/* Salary */}
      <div className="px-5 pt-3 pb-3">
        <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2.5">
          <span className="text-base">💰</span>
          <span className="text-orange-700 font-black text-[11px] tracking-wide">
            {formatSalary(project.salary_min, project.salary_max)}
          </span>
        </div>
      </div>

      {/* Highlight info */}
      {project.highlight_info && (
        <div className="px-5 pb-4">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-amber-700 text-[10px] font-bold line-clamp-2">🎁 {project.highlight_info}</p>
          </div>
        </div>
      )}

      <div className="flex-1" />
    </Link>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
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

// ── Pagination ─────────────────────────────────────────────────────────────
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
    <div className="flex items-center justify-center gap-2 mt-8 pb-8">
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
        className="px-4 py-2 rounded-xl border text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
        ← Trước
      </button>
      {pages.map((n, i) => n === '...'
        ? <span key={`dot-${i}`} className="px-1 text-gray-300">…</span>
        : (
          <button key={n} onClick={() => setPage(n as number)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition
              ${page === n ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'border text-gray-500 hover:bg-gray-50'}`}>
            {n}
          </button>
        )
      )}
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="px-4 py-2 rounded-xl border text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
        Sau →
      </button>
    </div>
  );
}

// ── Filter Chip ────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all
        ${active
          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'}`}>
      {label}
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [projects, setProjects]     = useState<Project[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [filters, setFilters]       = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage]             = useState(1);

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

  // Only show salary ranges that actually exist in the data
  const availableSalaryRanges = useMemo(() =>
    SALARY_RANGES.filter(range =>
      projects.some(p => {
        const pMin = p.salary_min ?? 0;
        const pMax = p.salary_max ?? 999;
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
    if (filters.cities.length > 0)
      r = r.filter(p => filters.cities.includes(p.address_city));

    if (filters.salaryRange) {
      const range = SALARY_RANGES.find(sr => sr.key === filters.salaryRange);
      if (range) {
        r = r.filter(p => {
          const pMin = p.salary_min ?? 0;
          const pMax = p.salary_max ?? 999;
          if (range.max === null) return pMax >= range.min || pMin >= range.min;
          return pMin <= range.max && pMax >= range.min;
        });
      }
    }
    if (filters.ageMax !== null)
      r = r.filter(p => !p.age_max || p.age_max <= filters.ageMax!);

    r.sort((a, b) => tagPriority(b.tags) - tagPriority(a.tags));
    return r;
  }, [projects, search, filters]);

  useEffect(() => { setPage(1); }, [search, filters]);

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = filters.cities.length + (filters.salaryRange ? 1 : 0) + (filters.ageMax !== null ? 1 : 0);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const toggleCity = (city: string) =>
    setFilters(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city],
    }));

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO / SEARCH SECTION ── */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 pt-10 pb-8 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto brightness-0 invert opacity-90" />
          </div>

          {/* Headline */}
          <div className="text-center mb-7">
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-snug">
              Khám phá công việc
            </h1>
            <h1 className="text-3xl sm:text-4xl font-black text-amber-100 leading-snug mb-3">
              mơ ước của bạn
            </h1>
            <p className="text-orange-100 text-sm">Hàng nghìn cơ hội việc làm đang chờ đón bạn</p>
          </div>

          {/* Search bar + filter button */}
          <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-2xl shadow-orange-900/25">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Tìm công việc, công ty, tỉnh thành..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 outline-none text-sm rounded-xl bg-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500
                         hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm
                         transition-all flex-shrink-0 shadow-md shadow-orange-300/50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Tìm kiếm theo
              {activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px]
                                 font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* ── FILTER PANEL ── */}
          {showFilters && (
            <div className="mt-3 bg-white rounded-2xl shadow-xl p-5 text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="font-black text-gray-700 text-sm">Lọc theo</span>
                {activeCount > 0 && (
                  <button onClick={resetFilters}
                    className="text-[11px] text-orange-500 font-bold hover:underline">
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="space-y-5">

                {/* City */}
                {cities.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">
                      Tỉnh / Thành phố
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cities.map(city => (
                        <Chip key={city} label={city}
                          active={filters.cities.includes(city)}
                          onClick={() => toggleCity(city)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Salary */}
                {availableSalaryRanges.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">
                      Khoảng lương
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableSalaryRanges.map(range => (
                        <Chip key={range.key} label={range.label}
                          active={filters.salaryRange === range.key}
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            salaryRange: prev.salaryRange === range.key ? null : range.key,
                          }))} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Age */}
                <div>
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">
                    Độ tuổi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AGE_OPTIONS.map(opt => (
                      <Chip key={opt.key} label={opt.label}
                        active={filters.ageMax === opt.max}
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          ageMax: prev.ageMax === opt.max ? null : opt.max,
                        }))} />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Section heading */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-black text-gray-800">🔥 Việc làm HOT nhất</h2>
          {!loading && (
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">
              {filtered.length} vị trí đang tuyển
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center mb-4">
            {error}
            <button onClick={() => window.location.reload()} className="ml-2 underline font-bold">
              Thử lại
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-5xl mb-4">🔍</span>
            <p className="font-bold text-sm">Không tìm thấy vị trí phù hợp</p>
            <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </div>
  );
}
