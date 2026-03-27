'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  salaryRanges: string[];
  ageMaxes: number[];
}

const DEFAULT_FILTERS: FilterState = {
  cities: [],
  salaryRanges: [],
  ageMaxes: [],
};

const PAGE_SIZE = 12;

// ── Salary presets ─────────────────────────────────────────────────────────
const ALL_SALARY_RANGES = [
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
const FALLBACK_COLORS = ['bg-teal-500 text-white','bg-cyan-600 text-white','bg-indigo-500 text-white','bg-pink-500 text-white'];
const tagColor = (t: string) =>
  TAG_COLORS[t] ?? FALLBACK_COLORS[t.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%FALLBACK_COLORS.length];

function getRibbonTag(tags: string | null): string | null {
  if (!tags) return null;
  const list = tags.split(',').map(t=>t.trim()).filter(Boolean);
  if (list.includes('Tuyển gấp')) return 'Tuyển gấp';
  return list.find(t=>TAG_COLORS[t]) ?? list[0] ?? null;
}
function tagPriority(tags: string | null): number {
  if (!tags) return 0;
  const list = tags.split(',').map(t=>t.trim());
  if (list.includes('Tuyển gấp')) return 2;
  return list.some(t=>t) ? 1 : 0;
}
function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'THU NHẬP: THỎA THUẬN';
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(n%1000===0?0:1)} TỶ` : `${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} TRIỆU / THÁNG`;
  if (min) return `TỪ ${fmt(min)} TRIỆU / THÁNG`;
  return `ĐẾN ${fmt(max!)} TRIỆU / THÁNG`;
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
  useEffect(()=>{
    const handler=(e: MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};
    document.addEventListener('mousedown',handler);
    return()=>document.removeEventListener('mousedown',handler);
  },[]);
  const activeCount = selected.length;
  return (
    <div ref={ref} className="relative flex-1 sm:flex-initial">
      <button
        onClick={()=>setOpen(v=>!v)}
        className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-3 sm:py-2.5 rounded-xl border text-sm font-bold transition-all
          ${activeCount>0||open
            ? 'bg-orange-500 text-white border-orange-500 shadow-md'
            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'}`}>
        <span>{label}</span>
        <div className="flex items-center gap-1.5">
          {activeCount>0&&(
            <span className="bg-white/30 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
          <svg className={`w-3 h-3 transition-transform ${open?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>

      {open&&(
        <div className="absolute top-full left-0 mt-2 min-w-[180px] w-full sm:w-auto bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-2">
            {options.map(opt=>(
              <label key={opt.key}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer text-[12px] transition
                  ${selected.includes(opt.key)?'bg-orange-50 text-orange-700 font-bold':'text-gray-600 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={selected.includes(opt.key)} onChange={()=>onToggle(opt.key)}
                  className="w-3.5 h-3.5 rounded accent-orange-500"/>
                {opt.label}
              </label>
            ))}
          </div>
          {activeCount>0&&(
            <div className="border-t px-3 py-2">
              <button onClick={()=>{onClear();setOpen(false);}}
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

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const ribbon    = getRibbonTag(project.tags);
  const positions = project.position?.split(',').map(p=>p.trim()).filter(Boolean) ?? [];
  return (
    <Link href={`/${project.project_id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100
                 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-50/70
                 transition-all duration-300 overflow-hidden">
      {ribbon&&(
        <div className="absolute top-0 right-0 z-10">
          <div className={`${tagColor(ribbon)} text-[11px] font-black px-4 py-1.5 rounded-bl-xl tracking-wide shadow-sm`}>
            {ribbon}
          </div>
        </div>
      )}
      <div className="p-5 pb-3 flex gap-3 items-start">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl border border-gray-100 bg-gray-50
                        flex items-center justify-center overflow-hidden shadow-sm">
          {project.icon_job
            ?<img src={project.icon_job} alt={project.company} className="w-full h-full object-contain p-1"/>
            :<span className="text-2xl">🏭</span>}
        </div>
        <div className="flex-1 min-w-0 pr-12">
          <h3 className="font-black text-gray-900 text-base leading-tight line-clamp-2
                         group-hover:text-orange-700 transition-colors">
            {project.company}
          </h3>
          <p className="mt-1 inline-flex items-center gap-1 text-orange-500 font-bold text-[12px]">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
            </svg>
            {project.address_city}
          </p>
        </div>
      </div>
      {positions.length>0&&(
        <div className="px-5 pb-3">
          {positions.map((pos,i)=>(
            <div key={i} className="flex items-start gap-2 text-gray-800 font-bold text-[15px] leading-snug mb-1.5 last:mb-0">
              <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-[6px]"/>
              <span>{pos}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mx-5 border-t border-gray-100"/>
      <div className="px-5 pt-3 pb-3">
        <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2.5">
          <span className="text-base">💰</span>
          <span className="text-orange-700 font-black text-[11px] tracking-wide">
            {formatSalary(project.salary_min,project.salary_max)}
          </span>
        </div>
      </div>
      {project.highlight_info&&(
        <div className="px-5 pb-4">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-amber-700 text-[10px] font-bold line-clamp-2">🎁 {project.highlight_info}</p>
          </div>
        </div>
      )}
      <div className="flex-1"/>
    </Link>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-5 flex gap-3">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0"/>
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-100 rounded w-3/4"/>
          <div className="h-3 bg-gray-100 rounded w-1/3"/>
        </div>
      </div>
      <div className="px-5 pb-3 space-y-2">
        <div className="h-5 bg-gray-100 rounded w-full"/>
        <div className="h-5 bg-gray-100 rounded w-2/3"/>
      </div>
      <div className="mx-5 border-t border-gray-100"/>
      <div className="px-5 py-3"><div className="h-9 bg-orange-50 rounded-xl"/></div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, setPage }: {
  page: number; totalPages: number; setPage: (p: number) => void;
}) {
  if (totalPages<=1) return null;
  const pages=Array.from({length:totalPages},(_,i)=>i+1)
    .filter(n=>n===1||n===totalPages||Math.abs(n-page)<=1)
    .reduce<(number|'...')[]>((acc,n,i,arr)=>{
      if(i>0&&n-(arr[i-1] as number)>1)acc.push('...');
      acc.push(n);return acc;
    },[]);
  return (
    <div className="flex items-center justify-center gap-2 mt-8 pb-4">
      <button onClick={()=>setPage(Math.max(1,page-1))} disabled={page===1}
        className="px-4 py-2 rounded-xl border text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
        ← Trước
      </button>
      {pages.map((n,i)=>n==='...'
        ?<span key={`dot-${i}`} className="px-1 text-gray-300">…</span>
        :(
          <button key={n} onClick={()=>setPage(n as number)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition
              ${page===n?'bg-orange-500 text-white shadow-md shadow-orange-200':'border text-gray-500 hover:bg-gray-50'}`}>
            {n}
          </button>
        )
      )}
      <button onClick={()=>setPage(Math.min(totalPages,page+1))} disabled={page===totalPages}
        className="px-4 py-2 rounded-xl border text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition">
        Sau →
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [filters, setFilters]     = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage]           = useState(1);

  useEffect(()=>{
    (async()=>{
      setLoading(true);setError(null);
      try{
        const{data,error:e}=await supabase
          .from('projects')
          .select('id,project_id,project,project_type,company,address_city,position,salary_min,salary_max,status,highlight_info,icon_job,tags,hiring_form,age_max')
          .eq('privacy','Công khai')
          .eq('status','Đang tuyển')
          .order('created_at',{ascending:false});
        if(e)throw e;
        setProjects(data||[]);
      }catch{setError('Không thể tải danh sách. Vui lòng thử lại.');}
      finally{setLoading(false);}
    })();
  },[]);

  const cities=useMemo(()=>
    Array.from(new Set(projects.map(p=>p.address_city).filter(Boolean))).sort()
  ,[projects]);

  const availableSalaryRanges=useMemo(()=>
    ALL_SALARY_RANGES.filter(range=>
      projects.some(p=>{
        const pMin=p.salary_min??0;const pMax=p.salary_max??999;
        if(range.max===null)return pMax>=range.min||pMin>=range.min;
        return pMin<=range.max&&pMax>=range.min;
      })
    )
  ,[projects]);

  const filtered=useMemo(()=>{
    let r=[...projects];
    if(search.trim()){
      const s=search.toLowerCase();
      r=r.filter(p=>
        p.project?.toLowerCase().includes(s)||
        p.company?.toLowerCase().includes(s)||
        p.position?.toLowerCase().includes(s)||
        p.address_city?.toLowerCase().includes(s)
      );
    }
    if(filters.cities.length>0)r=r.filter(p=>filters.cities.includes(p.address_city));
    if(filters.salaryRanges.length>0){
      r=r.filter(p=>filters.salaryRanges.some(key=>{
        const range=ALL_SALARY_RANGES.find(sr=>sr.key===key);
        if(!range)return false;
        const pMin=p.salary_min??0;const pMax=p.salary_max??999;
        if(range.max===null)return pMax>=range.min||pMin>=range.min;
        return pMin<=range.max&&pMax>=range.min;
      }));
    }
    if(filters.ageMaxes.length>0){
      const maxAge=Math.max(...filters.ageMaxes);
      r=r.filter(p=>!p.age_max||p.age_max<=maxAge);
    }
    r.sort((a,b)=>tagPriority(b.tags)-tagPriority(a.tags));
    return r;
  },[projects,search,filters]);

  useEffect(()=>{setPage(1);},[search,filters]);

  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const paginated=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const activeCount=filters.cities.length+filters.salaryRanges.length+filters.ageMaxes.length;

  const toggleCity=(city:string)=>setFilters(prev=>({...prev,cities:prev.cities.includes(city)?prev.cities.filter(c=>c!==city):[...prev.cities,city]}));
  const toggleSalary=(key:string)=>setFilters(prev=>({...prev,salaryRanges:prev.salaryRanges.includes(key)?prev.salaryRanges.filter(k=>k!==key):[...prev.salaryRanges,key]}));
  const toggleAge=(key:string)=>{
    const max=Number(key);
    setFilters(prev=>({...prev,ageMaxes:prev.ageMaxes.includes(max)?prev.ageMaxes.filter(m=>m!==max):[...prev.ageMaxes,max]}));
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── TOP BAR: logo only ── */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto"/>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 pt-10 pb-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-1">
            Khám phá công việc
          </h1>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-100 leading-tight mb-4">
            mơ ước của bạn
          </h1>
          <p className="text-orange-100 text-sm sm:text-base mb-8">
            Hàng nghìn cơ hội việc làm đang chờ đón bạn mỗi ngày
          </p>

          {/* Search bar — independent */}
          <div className="bg-white rounded-2xl shadow-2xl shadow-orange-900/20 flex items-center px-4 py-1 mb-3">
            <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mr-3"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm công việc, công ty, tỉnh thành..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              className="flex-1 py-3 outline-none text-sm bg-transparent"
            />
            {search&&(
              <button onClick={()=>setSearch('')} className="text-gray-300 hover:text-gray-500 transition ml-2">✕</button>
            )}
          </div>

          {/* Filter dropdowns — independent row, col on mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {cities.length>0&&(
              <MultiDropdown
                label="Tỉnh thành"
                options={cities.map(c=>({key:c,label:c}))}
                selected={filters.cities}
                onToggle={toggleCity}
                onClear={()=>setFilters(prev=>({...prev,cities:[]}))}
              />
            )}
            {availableSalaryRanges.length>0&&(
              <MultiDropdown
                label="Mức lương"
                options={availableSalaryRanges.map(r=>({key:r.key,label:r.label}))}
                selected={filters.salaryRanges}
                onToggle={toggleSalary}
                onClear={()=>setFilters(prev=>({...prev,salaryRanges:[]}))}
              />
            )}
            <MultiDropdown
              label="Độ tuổi"
              options={AGE_OPTIONS.map(o=>({key:String(o.max),label:o.label}))}
              selected={filters.ageMaxes.map(String)}
              onToggle={toggleAge}
              onClear={()=>setFilters(prev=>({...prev,ageMaxes:[]}))}
            />
            {activeCount>0&&(
              <button onClick={()=>setFilters(DEFAULT_FILTERS)}
                className="px-4 py-3 sm:py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition border border-white/30">
                Xóa lọc ({activeCount})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── JOB LISTINGS ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-6">🔥 Việc làm HOT nhất</h2>

        {error&&(
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center mb-4">
            {error}
            <button onClick={()=>window.location.reload()} className="ml-2 underline font-bold">Thử lại</button>
          </div>
        )}

        {loading&&(
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}
          </div>
        )}

        {!loading&&!error&&filtered.length===0&&(
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-5xl mb-4">🔍</span>
            <p className="font-bold text-sm">Không tìm thấy vị trí phù hợp</p>
            <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}

        {!loading&&!error&&filtered.length>0&&(
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map(p=><ProjectCard key={p.id} project={p}/>)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} setPage={setPage}/>
      </section>

      {/* ── ABOUT / STATS ── */}
      <section className="bg-white py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Copy */}
            <div>
              <p className="text-orange-500 font-black text-xs uppercase tracking-widest mb-3">• Về chúng tôi •</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-5">
                Việc làm trong tầm tay<br/>
                <span className="text-orange-500">Thành công trong tầm với</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6 text-[15px]">
                Chúng tôi kết nối ứng viên với hàng nghìn cơ hội việc làm phù hợp — nhanh chóng, minh bạch và không mất phí. Dù bạn đang tìm việc hay muốn kiếm thêm thu nhập qua giới thiệu nhân sự, đây là nơi dành cho bạn.
              </p>
              <ul className="space-y-3">
                {[
                  'Việc làm chất lượng, thu nhập rõ ràng',
                  'Kết nối trực tiếp với doanh nghiệp uy tín',
                  'Hỗ trợ ứng viên từ A đến Z trong quá trình tuyển dụng',
                  'Cộng tác viên nhận hoa hồng hấp dẫn, không giới hạn',
                ].map((item,i)=>(
                  <li key={i} className="flex items-start gap-3 text-[14px] text-gray-600">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-3 h-3 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value:'500k+', label:'Hồ sơ trên hệ thống',       icon:'📋', accent:true  },
                { value:'130k+', label:'Lao động đã tuyển dụng',     icon:'📊', accent:false },
                { value:'120+',  label:'Chuyên viên tuyển dụng',     icon:'👩‍💼', accent:false },
                { value:'60+',   label:'Doanh nghiệp đồng hành',     icon:'🤝', accent:true  },
              ].map((s,i)=>(
                <div key={i} className={`rounded-2xl p-6 flex flex-col gap-2 shadow-sm transition-transform hover:-translate-y-1
                  ${s.accent?'bg-orange-500 text-white':'bg-gray-50 border border-gray-100'}`}>
                  <span className="text-3xl">{s.icon}</span>
                  <p className={`text-4xl font-black leading-none ${s.accent?'text-white':'text-gray-900'}`}>{s.value}</p>
                  <p className={`text-sm font-semibold leading-snug ${s.accent?'text-orange-100':'text-gray-500'}`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTV SECTION ── */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-br from-orange-50 via-amber-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Copy */}
            <div>
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-[11px] font-black uppercase tracking-widest rounded-full mb-4">
                Chương trình Cộng tác viên
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-3">
                Giới thiệu việc làm<br/>
                <span className="text-orange-500">Nhận hoa hồng hấp dẫn</span>
              </h2>
              <p className="text-gray-500 text-[15px] leading-relaxed mb-6">
                Bạn biết ai đang tìm việc? Đơn giản là chia sẻ — chúng tôi lo phần còn lại. Không cần kinh nghiệm, không cần bằng cấp, chỉ cần một chiếc điện thoại là bạn có thể bắt đầu kiếm thu nhập ngay hôm nay.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Thu nhập không giới hạn theo số lượng giới thiệu',
                  'Không mất phí tham gia, không yêu cầu kinh nghiệm',
                  'Làm việc linh hoạt mọi lúc, mọi nơi',
                  'Được hỗ trợ đào tạo và hướng dẫn tận tình',
                  'Theo dõi hồ sơ & hoa hồng minh bạch trên hệ thống',
                ].map((item,i)=>(
                  <li key={i} className="flex items-start gap-3 text-[14px] text-gray-600">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-200 transition-all hover:shadow-xl active:scale-95">
                Đăng ký làm Cộng tác viên ngay →
              </button>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon:'💸', title:'Hoa hồng hấp dẫn',  desc:'Nhận thưởng ngay khi ứng viên được nhận việc thành công' },
                { icon:'📱', title:'Làm từ điện thoại',  desc:'Không cần văn phòng, chỉ cần smartphone và mạng internet' },
                { icon:'🕐', title:'Tự do thời gian',    desc:'Sắp xếp lịch làm việc theo ý bạn, không giới hạn' },
                { icon:'🎓', title:'Được đào tạo',       desc:'Nhóm hỗ trợ luôn sẵn sàng hướng dẫn bạn từng bước' },
              ].map((card,i)=>(
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all">
                  <span className="text-3xl block mb-3">{card.icon}</span>
                  <p className="font-bold text-gray-800 text-sm mb-1">{card.title}</p>
                  <p className="text-gray-400 text-[11px] leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">

            {/* Brand */}
            <div>
              <img src="/logo.png" alt="Logo" className="h-9 w-auto brightness-0 invert opacity-80 mb-4"/>
              <p className="text-gray-400 text-[13px] leading-relaxed mb-3">
                Công ty Cổ phần Giải pháp nhân sự & Tư vấn đầu tư K-Outsourcing — cung cấp dịch vụ cho thuê lại lao động và giải pháp nhân sự toàn diện cho doanh nghiệp.
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                B-TT13-04, Khu nhà ở Ngân Hà Vạn Phúc,<br/>Phường Hà Đông, TP Hà Nội, Việt Nam
              </p>
            </div>

            {/* Hotline — highlighted */}
            <div>
              <p className="text-orange-400 font-black text-xs uppercase tracking-widest mb-5">📞 Hotline tuyển dụng</p>
              <div className="space-y-4">
                {[
                  { number:'0325 277 292', label:'Tư vấn miễn phí 24/7' },
                  { number:'0397 013 122', label:'Hỗ trợ ứng viên' },
                ].map(phone=>(
                  <a key={phone.number} href={`tel:${phone.number.replace(/\s/g,'')}`}
                    className="flex items-center gap-3 group">
                    <span className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20
                                     group-hover:bg-orange-500 group-hover:border-orange-500
                                     flex items-center justify-center transition-all flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </span>
                    <div>
                      <p className="text-white font-black text-lg leading-none group-hover:text-orange-400 transition-colors">{phone.number}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">{phone.label}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Email + social — highlighted */}
            <div>
              <p className="text-orange-400 font-black text-xs uppercase tracking-widest mb-5">✉️ Email liên hệ</p>
              <a href="mailto:info@koutsourcing.vn"
                className="flex items-center gap-3 group mb-8">
                <span className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20
                                 group-hover:bg-orange-500 group-hover:border-orange-500
                                 flex items-center justify-center transition-all flex-shrink-0">
                  <svg className="w-4 h-4 text-orange-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </span>
                <div>
                  <p className="text-white font-black text-base leading-none group-hover:text-orange-400 transition-colors">info@koutsourcing.vn</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">Phản hồi trong 24h</p>
                </div>
              </a>

              <p className="text-orange-400 font-black text-xs uppercase tracking-widest mb-3">Theo dõi chúng tôi</p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-blue-600 border border-white/10 flex items-center justify-center transition-all group">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-blue-500 border border-white/10 flex items-center justify-center transition-all group">
                  <span className="text-[9px] font-black text-gray-400 group-hover:text-white">Zalo</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-gray-500">
              © {new Date().getFullYear()} K-Outsourcing. Tất cả quyền được bảo lưu.
            </p>
            <p className="text-[11px] text-gray-500">
              Sở KHĐT TP Hà Nội cấp phép
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
