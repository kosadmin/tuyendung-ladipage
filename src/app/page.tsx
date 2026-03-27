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
}

interface FilterState {
  statuses: string[];
  cities: string[];
  salaryMin: string;
  salaryMax: string;
  sortBy: 'newest' | 'oldest';
}

const DEFAULT_FILTERS: FilterState = {
  statuses: [], cities: [],
  salaryMin: '', salaryMax: '',
  sortBy: 'newest',
};

const PAGE_SIZE = 12;

// ── Config ─────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; dot: string }> = {
  'Đang tuyển': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'Tạm dừng':   { color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400'  },
  'Hoàn thành': { color: 'bg-blue-50 text-blue-700 border-blue-200',           dot: 'bg-blue-500'   },
  'Hủy':        { color: 'bg-gray-100 text-gray-500 border-gray-200',          dot: 'bg-gray-400'   },
};

const TAG_COLORS: Record<string, string> = {
  'Tuyển gấp':  'bg-red-500 text-white',
  'Hot':        'bg-rose-400 text-white',
  'Ưu tiên':    'bg-orange-500 text-white',
  'Mới':        'bg-blue-500 text-white',
  'Thưởng lớn': 'bg-amber-500 text-white',
  'VIP':        'bg-purple-600 text-white',
};
const FALLBACK_COLORS = ['bg-teal-500 text-white','bg-cyan-600 text-white','bg-indigo-500 text-white','bg-pink-500 text-white'];
const tagColor = (t: string) => TAG_COLORS[t] ?? FALLBACK_COLORS[t.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%FALLBACK_COLORS.length];

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
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(n%1000===0?0:1)} TỶ` : `${n}`;
  if (min && max) return `THU NHẬP ${fmt(min)} - ${fmt(max)} TRIỆU / THÁNG`;
  if (min) return `THU NHẬP TỪ ${fmt(min)} TRIỆU / THÁNG`;
  return `THU NHẬP ĐẾN ${fmt(max!)} TRIỆU / THÁNG`;
}

// ── MultiCheck ─────────────────────────────────────────────────────────────
function MultiCheck({ label, options, selected, onChange }: {
  label: string; options: string[];
  selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    selected.includes(opt) ? onChange(selected.filter(s => s !== opt)) : onChange([...selected, opt]);
  return (
    <div>
      <p className="text-[10px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">{label}</p>
      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
        {options.map(opt => (
          <label key={opt} className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-[11px] transition ${selected.includes(opt) ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="w-3 h-3 rounded accent-orange-500" />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

// ── SalaryRange ────────────────────────────────────────────────────────────
function SalaryRange({ salaryMin, salaryMax, setSalaryMin, setSalaryMax, small }: {
  salaryMin: string; salaryMax: string;
  setSalaryMin: (v: string) => void; setSalaryMax: (v: string) => void;
  small?: boolean;
}) {
  const inp = small
    ? 'w-full p-1.5 border rounded-lg text-[11px] outline-none focus:border-orange-400 bg-white'
    : 'w-full p-2 border rounded-xl text-[12px] outline-none focus:border-orange-400 bg-white';
  return (
    <div>
      <p className="text-[10px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Khoảng lương (triệu)</p>
      <div className="flex items-center gap-1.5">
        <input type="number" min="0" placeholder="Từ" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} className={inp} />
        <span className="text-gray-300 text-xs flex-shrink-0">—</span>
        <input type="number" min="0" placeholder="Đến" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} className={inp} />
      </div>
    </div>
  );
}

// ── Mobile Popup ───────────────────────────────────────────────────────────
function FilterPopup({ open, onClose, onApply, initial, cities }: {
  open: boolean; onClose: () => void;
  onApply: (f: FilterState) => void;
  initial: FilterState; cities: string[];
}) {
  const [local, setLocal] = useState<FilterState>(initial);
  const set = (patch: Partial<FilterState>) => setLocal(prev => ({ ...prev, ...patch }));

  useEffect(() => { if (open) setLocal(initial); }, [open]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const activeCount = local.statuses.length + local.cities.length
    + (local.salaryMin ? 1 : 0) + (local.salaryMax ? 1 : 0);

  const toggle = (field: 'statuses' | 'cities', val: string) => {
    const cur = local[field] as string[];
    set({ [field]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] });
  };

  const Chip = ({ field, val }: { field: 'statuses' | 'cities'; val: string }) => {
    const active = (local[field] as string[]).includes(val);
    return (
      <button onClick={() => toggle(field, val)}
        className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition text-left ${active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
        {val}
      </button>
    );
  };

  return (
    <div className="sm:hidden fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl shadow-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-orange-600 rounded-t-2xl flex-shrink-0">
          <span className="text-white font-black text-sm">Bộ lọc & Sắp xếp</span>
          <button onClick={onClose} className="text-orange-200 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sắp xếp</p>
            <div className="grid grid-cols-2 gap-2">
              {([['newest','Mới nhất'],['oldest','Cũ nhất']] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => set({ sortBy: val })}
                  className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition ${local.sortBy === val ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Trạng thái</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(statusConfig).map(s => <Chip key={s} field="statuses" val={s} />)}
            </div>
          </div>

          {cities.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tỉnh / Thành phố</p>
              <div className="grid grid-cols-2 gap-2">
                {cities.map(c => <Chip key={c} field="cities" val={c} />)}
              </div>
            </div>
          )}

          <SalaryRange
            salaryMin={local.salaryMin} salaryMax={local.salaryMax}
            setSalaryMin={v => set({ salaryMin: v })} setSalaryMax={v => set({ salaryMax: v })} />
        </div>

        <div className="px-4 pb-6 pt-3 border-t flex gap-2 flex-shrink-0">
          <button onClick={() => setLocal(DEFAULT_FILTERS)}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition">
            Xóa tất cả
          </button>
          <button onClick={() => { onApply(local); onClose(); }}
            className="flex-1 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition">
            LỌC{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const status    = statusConfig[project.status] ?? statusConfig['Đang tuyển'];
  const ribbon    = getRibbonTag(project.tags);
  const positions = project.position?.split(',').map(p => p.trim()).filter(Boolean) ?? [];

  return (
    <Link href={`/${project.project_id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-200 overflow-hidden">

      {ribbon && (
        <div className="absolute top-0 right-0 z-10">
          <div className={`${tagColor(ribbon)} text-[8px] font-black px-2 py-0.5 rounded-bl-lg tracking-wide`}>{ribbon}</div>
        </div>
      )}

      <div className="p-4 pb-3 flex gap-3 items-start">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
          {project.icon_job
            ? <img src={project.icon_job} alt={project.company} className="w-full h-full object-contain p-1" />
            : <span className="text-xl">🏭</span>}
        </div>
        <div className="flex-1 min-w-0 pr-10">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-orange-700 transition-colors">{project.project}</h3>
          <p className="text-orange-600 font-semibold text-[11px] uppercase tracking-wide mt-1 truncate">{project.company}</p>
          <p className="text-gray-400 text-[11px] mt-0.5">{project.address_city}</p>
        </div>
      </div>

      {positions.length > 0 && (
        <div className="px-4 pb-3">
          {positions.map((pos, i) => (
            <div key={i} className="flex items-start gap-2 text-gray-800 font-bold text-[13px] leading-snug mb-1.5 last:mb-0">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-[5px]" />
              <span>{pos}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mx-4 border-t border-gray-100" />

      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 bg-blue-50 rounded-xl px-3 py-2.5">
          <span className="text-sm">💰</span>
          <span className="text-blue-700 font-black text-[11px] tracking-wide">{formatSalary(project.salary_min, project.salary_max)}</span>
        </div>
      </div>

      {project.highlight_info && (
        <div className="px-4 pb-3">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-amber-700 text-[10px] font-bold line-clamp-2">🎁 {project.highlight_info}</p>
          </div>
        </div>
      )}

      <div className="flex-1" />

      <div className="px-4 pb-4 pt-1">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${status.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{project.status}
        </span>
      </div>
    </Link>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-4 flex gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="px-4 pb-3 space-y-1.5">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="mx-4 border-t border-gray-100" />
      <div className="px-4 py-3"><div className="h-9 bg-blue-50 rounded-xl" /></div>
      <div className="px-4 pb-4"><div className="h-5 bg-gray-100 rounded-full w-20" /></div>
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
      acc.push(n);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-center gap-2 mt-6 pb-4">
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
        className="px-3 py-1.5 rounded-lg border text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
        ← Trước
      </button>
      {pages.map((n, i) => n === '...'
        ? <span key={`dot-${i}`} className="px-1 text-gray-300">…</span>
        : (
          <button key={n} onClick={() => setPage(n as number)}
            className={`w-8 h-8 rounded-lg text-sm font-bold transition ${page === n ? 'bg-orange-500 text-white' : 'border text-gray-500 hover:bg-gray-50'}`}>
            {n}
          </button>
        )
      )}
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="px-3 py-1.5 rounded-lg border text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
        Sau →
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [projects, setProjects]       = useState<Project[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [filters, setFilters]         = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showPopup, setShowPopup]     = useState(false);
  const [page, setPage]               = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const { data, error: e } = await supabase
          .from('projects')
          .select('id,project_id,project,project_type,company,address_city,position,salary_min,salary_max,status,highlight_info,icon_job,tags,hiring_form')
          .eq('privacy', 'Công khai')
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
    if (filters.statuses.length > 0) r = r.filter(p => filters.statuses.includes(p.status));
    if (filters.cities.length > 0)   r = r.filter(p => filters.cities.includes(p.address_city));
    if (filters.salaryMin)            r = r.filter(p => p.salary_max != null && p.salary_max >= Number(filters.salaryMin));
    if (filters.salaryMax)            r = r.filter(p => p.salary_min != null && p.salary_min <= Number(filters.salaryMax));
    r.sort((a, b) => tagPriority(b.tags) - tagPriority(a.tags));
    if (filters.sortBy === 'oldest') r.reverse();
    return r;
  }, [projects, search, filters]);

  useEffect(() => { setPage(1); }, [search, filters]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = filters.statuses.length + filters.cities.length
    + (filters.salaryMin ? 1 : 0) + (filters.salaryMax ? 1 : 0);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden text-sm">

      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">

          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Tìm công việc, công ty, tỉnh thành..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-400 outline-none transition text-sm" />
          </div>

          {/* Filter button */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth >= 640)
                setShowFilters(v => !v);
              else setShowPopup(true);
            }}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition flex-shrink-0
              ${showFilters || activeCount > 0 ? 'bg-orange-500 text-white border-orange-500' : 'bg-white hover:bg-orange-50 text-gray-600 border-gray-200'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            <span className="hidden sm:inline">Lọc</span>
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{activeCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex w-full pt-[57px] h-full overflow-hidden">

        {/* PC SIDEBAR */}
        <div className={`hidden sm:flex flex-col flex-shrink-0 bg-white border-r transition-all duration-300 overflow-hidden h-full ${showFilters ? 'w-56' : 'w-0'}`}>
          {showFilters && (
            <>
              <div className="p-3 border-b bg-orange-600 flex items-center justify-between flex-shrink-0">
                <span className="text-white font-black text-[10px] uppercase tracking-widest">Bộ lọc</span>
                <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-[9px] font-bold text-orange-200 hover:text-white underline">Xóa tất cả</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                <div>
                  <p className="text-[10px] uppercase font-black text-gray-400 mb-1.5 tracking-widest">Sắp xếp</p>
                  <div className="space-y-1">
                    {([['newest','Mới nhất'],['oldest','Cũ nhất']] as const).map(([val, lbl]) => (
                      <label key={val} className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-[11px] transition ${filters.sortBy === val ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <input type="radio" checked={filters.sortBy === val} onChange={() => setFilters({...filters, sortBy: val})} className="w-3 h-3 accent-orange-500" />
                        {lbl}
                      </label>
                    ))}
                  </div>
                </div>
                <MultiCheck label="Trạng thái" options={Object.keys(statusConfig)}
                  selected={filters.statuses} onChange={v => setFilters({...filters, statuses: v})} />
                {cities.length > 0 && (
                  <MultiCheck label="Tỉnh / Thành phố" options={cities}
                    selected={filters.cities} onChange={v => setFilters({...filters, cities: v})} />
                )}
                <SalaryRange small
                  salaryMin={filters.salaryMin} salaryMax={filters.salaryMax}
                  setSalaryMin={v => setFilters({...filters, salaryMin: v})}
                  setSalaryMax={v => setFilters({...filters, salaryMax: v})} />
              </div>
            </>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4">

            {/* Count */}
            {!loading && (
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                {filtered.length} vị trí tuyển dụng{search || activeCount ? ` (lọc từ ${projects.length})` : ''}
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center mb-4">
                {error}
                <button onClick={() => window.location.reload()} className="ml-2 underline font-bold">Thử lại</button>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({length: 6}).map((_, i) => <SkeletonCard key={i} />)}
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

            {/* Pagination */}
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />

          </div>
        </div>
      </div>

      {/* MOBILE POPUP */}
      <FilterPopup open={showPopup} onClose={() => setShowPopup(false)}
        onApply={setFilters} initial={filters} cities={cities} />
    </div>
  );
}
