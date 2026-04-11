'use client';

import { useState, useEffect, useRef } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────
const PROVINCES = [
  "An Giang", "Bắc Ninh", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng",
  "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Nội",
  "Hà Tĩnh", "Hải Phòng", "Hồ Chí Minh", "Huế", "Hưng Yên", "Khánh Hòa",
  "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình",
  "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh",
  "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long",
];

const EDUCATION_LEVELS = [
  "Tiểu học",
  "PTCS",
  "PTTH",
  "Trung cấp",
  "Cao đẳng",
  "Đại học",
  "Thạc sĩ",
  "Tiến sĩ",
];

// ── Types ──────────────────────────────────────────────────────────────────
interface CTVApplyModalProps {
  open: boolean;
  onClose: () => void;
  company: string;
  positions: string[];
  projectId: string;
  projectName: string;
  projectType: string;
  addressCity?: string;
  assignmentOverride: {
    assigned_user: string;
    assigned_user_name: string;
    assigned_user_group: string;
  };
  ctvType?: string | null;
}

interface FormData {
  candidate_name: string;
  gender: string;
  date_of_birth: string;
  phone: string;
  id_card_number: string;
  id_card_issued_date: string;
  id_card_issued_place: string;
  address_street: string;
  address_ward: string;
  address_city: string;
  education_level: string;
  company: string;
  position: string;
  interview_date: string;
  experience_summary: string;  // ← thêm
  tags: string;
}

interface FormErrors {
  candidate_name?: string;
  gender?: string;
  date_of_birth?: string;
  phone?: string;
  id_card_number?: string;
  address_city?: string;
  position?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function validatePhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone.trim());
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.candidate_name.trim()) errors.candidate_name = 'Vui lòng nhập họ tên';
  if (!data.gender)                errors.gender         = 'Vui lòng chọn giới tính';
  if (!data.date_of_birth)         errors.date_of_birth  = 'Vui lòng nhập ngày sinh';
  if (!data.phone.trim()) {
    errors.phone = 'Vui lòng nhập số điện thoại';
  } else if (!validatePhone(data.phone)) {
    errors.phone = 'Số điện thoại phải có 10 chữ số, bắt đầu bằng 0';
  }
  if (!data.id_card_number.trim()) errors.id_card_number = 'Vui lòng nhập số CCCD / CMND';
  if (!data.address_city)          errors.address_city   = 'Vui lòng chọn tỉnh / thành phố';
  if (!data.position)              errors.position       = 'Vui lòng chọn vị trí ứng tuyển';
  return errors;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500 font-medium">{msg}</p>;
}

function InputField({
  label, required, error, ...props
}: { label: string; required?: boolean; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        {...props}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-gray-800 bg-white outline-none transition
          focus:ring-2 focus:ring-orange-300 focus:border-orange-400
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
      />
      <FieldError msg={error} />
    </div>
  );
}

function SectionTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="pt-1">
      <p className="text-xs font-black text-orange-500 uppercase tracking-widest">{children}</p>
      {note && <p className="text-[10px] text-gray-400 mt-0.5">{note}</p>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CTVApplyModal({
  open, onClose,
  company, positions,
  projectId, projectName, projectType,
  addressCity,
  assignmentOverride,
  ctvType,
}: CTVApplyModalProps) {
  const ENDPOINT = process.env.NEXT_PUBLIC_CTV_APPLY_SHEET_ENDPOINT ?? '';

  const makeEmpty = (): FormData => ({
    candidate_name: '',
    gender: '',
    date_of_birth: '',
    phone: '',
    id_card_number: '',
    id_card_issued_date: '',
    id_card_issued_place: '',
    address_street: '',
    address_ward: '',
    address_city: '',
    education_level: '',
    company,
    position: positions.length === 1 ? positions[0] : '',
    interview_date: '',
    experience_summary: '',  // ← thêm
    tags: '',
  });

  const [form, setForm]         = useState<FormData>(makeEmpty);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [submitting, setSubmit] = useState(false);
  const [submitted, setDone]    = useState(false);
  const [submitErr, setErr]     = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setForm(f => ({
      ...f,
      company,
      position: positions.length === 1 ? positions[0] : f.position,
    }));
  }, [company, positions]);

  useEffect(() => {
    if (open) {
      setForm(makeEmpty());
      setErrors({}); setSubmit(false); setDone(false); setErr(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  const handleSubmit = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (!ENDPOINT) {
      setErr('Chưa cấu hình endpoint. Vui lòng liên hệ quản trị viên.');
      return;
    }

    setSubmit(true); setErr(null);

    const timestamp = new Date().toISOString();

    const birth_year = form.date_of_birth
      ? new Date(form.date_of_birth).getFullYear()
      : '';

    const address_full = [form.address_street, form.address_ward, form.address_city]
      .filter(Boolean)
      .join(' - ');

    const isVendor = assignmentOverride.assigned_user_group === 'vendor';
    const data_source_dept       = isVendor ? 'Quản lý nguồn' : 'Tuyển dụng';
    const data_source_type_group = isVendor ? 'Vendor/CTV'     : 'Seeding';
    const data_source_type       = isVendor ? (ctvType ?? '')   : 'Seeding thường';

    const payload = {
      created_at:              timestamp,
      last_updated_at:         timestamp,
      created_by:              'KOSAD',
      candidate_name:          form.candidate_name.trim(),
      gender:                  form.gender,
      date_of_birth:           form.date_of_birth,
      birth_year,
      phone:                   form.phone.trim(),
      id_card_number:          form.id_card_number.trim(),
      id_card_issued_date:     form.id_card_issued_date,
      id_card_issued_place:    form.id_card_issued_place.trim(),
      address_street:          form.address_street.trim(),
      address_ward:            form.address_ward.trim(),
      address_city:            form.address_city,
      address_full,
      education_level:         form.education_level,
      company:                 form.company,
      position:                form.position,
      project_id:              projectId,
      project:                 projectName,
      project_type:            projectType,
      interview_date:          form.interview_date,
      experience_summary:      form.experience_summary.trim(),  // ← thêm
      tags:                    form.tags,
      take_note:               '',
      assigned_user:           assignmentOverride.assigned_user,
      assigned_user_name:      assignmentOverride.assigned_user_name,
      assigned_user_group:     assignmentOverride.assigned_user_group,
      data_source_dept,
      data_source_type_group,
      data_source_type,
      new:                     true,
      interested:              true,
      scheduled_for_interview: true,
      show_up_for_interview:   false,
      pass_interview:          false,
      onboard:                 false,
      reject_offer:            false,
      unqualified:             false,
    };

    try {
      await fetch(ENDPOINT, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      setDone(true);
    } catch (err) {
      console.error('CTVApplyModal submit error:', err);
      setErr('Có lỗi khi gửi đơn. Vui lòng thử lại hoặc liên hệ hotline.');
    } finally {
      setSubmit(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Form đăng ký ứng viên"
    >
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[95dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-black text-gray-900 text-xl">Đăng ký ứng viên</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{company}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-lg"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5">

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg">Đăng ký thành công!</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Cảm ơn bạn đã đăng ký.<br/>
                  Chúng tôi sẽ liên hệ trong thời gian sớm nhất.
                </p>
              </div>
              <button onClick={onClose} className="mt-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition text-sm">
                Đóng
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* 1. Thông tin cá nhân */}
              <SectionTitle>Thông tin cá nhân</SectionTitle>

              <InputField
                label="Họ và tên" required
                placeholder="Nguyễn Văn A"
                value={form.candidate_name} onChange={set('candidate_name')}
                error={errors.candidate_name} autoComplete="name"
              />

              <div>
                <Label required>Giới tính</Label>
                <select
                  value={form.gender} onChange={set('gender')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-gray-800 bg-white outline-none transition
                    focus:ring-2 focus:ring-orange-300 focus:border-orange-400
                    ${errors.gender ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
                <FieldError msg={errors.gender} />
              </div>

              <InputField
                label="Ngày sinh" required type="date"
                value={form.date_of_birth} onChange={set('date_of_birth')}
                error={errors.date_of_birth} max={today}
              />

              <InputField
                label="Số điện thoại" required type="tel" placeholder="0912345678"
                value={form.phone} onChange={set('phone')}
                error={errors.phone} maxLength={10} inputMode="numeric" autoComplete="tel"
              />

              {/* 2. CCCD / CMND */}
              <SectionTitle>CCCD / CMND</SectionTitle>

              <InputField
                label="Số CCCD / CMND" required
                placeholder="012345678901"
                value={form.id_card_number} onChange={set('id_card_number')}
                error={errors.id_card_number}
                inputMode="numeric"
              />

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Ngày cấp" type="date"
                  value={form.id_card_issued_date} onChange={set('id_card_issued_date')}
                  max={today}
                />
                <InputField
                  label="Nơi cấp"
                  placeholder="Cục CS QLHC..."
                  value={form.id_card_issued_place} onChange={set('id_card_issued_place')}
                />
              </div>

              {/* 3. Địa chỉ */}
              <SectionTitle note="Điền theo địa chỉ sau sáp nhập">Địa chỉ</SectionTitle>

              <InputField
                label="Số nhà / Tổ / Thôn / Xóm"
                placeholder="VD: Tổ 5 khu Bí Trung 1"
                value={form.address_street} onChange={set('address_street')}
              />

              <InputField
                label="Phường / Xã"
                placeholder="VD: Yên Tử"
                value={form.address_ward} onChange={set('address_ward')}
              />

              <div>
                <Label required>Tỉnh / Thành phố</Label>
                <select
                  value={form.address_city} onChange={set('address_city')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-gray-800 bg-white outline-none transition
                    focus:ring-2 focus:ring-orange-300 focus:border-orange-400
                    ${errors.address_city ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <option value="">-- Chọn tỉnh / thành phố --</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <FieldError msg={errors.address_city} />
              </div>

              {/* 4. Trình độ học vấn */}
              <SectionTitle>Trình độ học vấn</SectionTitle>

              <div>
                <Label>Trình độ</Label>
                <select
                  value={form.education_level} onChange={set('education_level')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 bg-white outline-none transition focus:ring-2 focus:ring-orange-300 focus:border-orange-400 hover:border-gray-300"
                >
                  <option value="">-- Chọn trình độ --</option>
                  {EDUCATION_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              {/* Kinh nghiệm làm việc — đặt sau select Trình độ, trước Section Vị trí */}
              <div>
                <Label>Kinh nghiệm làm việc</Label>
                <textarea
                  value={form.experience_summary}
                  onChange={set('experience_summary')}
                  placeholder="VD: 2 năm may công nghiệp tại Hà Nam, quen làm ca..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 bg-white outline-none transition resize-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 hover:border-gray-300"
                />
              </div>

              {/* 5. Vị trí ứng tuyển */}
              <SectionTitle>Vị trí ứng tuyển</SectionTitle>

              <div>
                <Label>Công ty ứng tuyển</Label>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-600 font-medium">
                  {form.company}
                </div>
              </div>

              <div>
                <Label required>Vị trí ứng tuyển</Label>
                {positions.length <= 1 ? (
                  <div className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-700 font-medium">
                    {positions[0] ?? '—'}
                  </div>
                ) : (
                  <select
                    value={form.position} onChange={set('position')}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-gray-800 bg-white outline-none transition
                      focus:ring-2 focus:ring-orange-300 focus:border-orange-400
                      ${errors.position ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  >
                    <option value="">-- Chọn vị trí --</option>
                    {positions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}
                <FieldError msg={errors.position} />
              </div>

              {/* 6. Lịch phỏng vấn */}
              <SectionTitle>Lịch phỏng vấn</SectionTitle>

              <InputField
                label="Ngày phỏng vấn"
                type="date"
                value={form.interview_date} onChange={set('interview_date')}
                min={today}
              />
              <div>
                <Label>Hình thức phỏng vấn</Label>
                <div className="flex gap-3">
                  {['Online', 'Trực tiếp'].map(option => (
                    <label
                      key={option}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-[13px] font-bold transition-all
                        ${form.tags === option
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <input
                        type="radio"
                        name="tags"
                        value={option}
                        checked={form.tags === option}
                        onChange={set('tags')}
                        className="sr-only"
                      />
                      <span>{option === 'Online' ? '💻' : '🏢'}</span>
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {submitErr && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[12px] text-red-600 font-medium">
                  ⚠️ {submitErr}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 bg-white sm:rounded-b-2xl">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed
                text-white font-black text-sm rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Đang gửi...
                </span>
              ) : 'Gửi đăng ký →'}
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Thông tin của bạn được bảo mật và chỉ dùng cho mục đích tuyển dụng.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
