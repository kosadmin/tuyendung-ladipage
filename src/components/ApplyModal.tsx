/**
 * ─────────────────────────────────────────────────────────────
 * ApplyModal.tsx — Form ứng tuyển việc làm
 *
 * CÁCH DÙNG:
 *   <ApplyModal
 *     open={applyOpen}
 *     onClose={() => setApplyOpen(false)}
 *     company={project.company}
 *     positions={positions}          // string[]
 *     projectId={project.project_id}
 *     projectName={project.project}
 *     projectType={project.project_type}
 *     addressCity={project.address_city}
 *   />
 *
 * GOOGLE SHEETS SETUP:
 *   1. Mở Google Sheet → Extensions → Apps Script
 *   2. Paste toàn bộ đoạn code bên dưới vào Code.gs, sửa SHEET_NAME nếu cần
 *   3. Deploy → New deployment → Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *   4. Copy URL deploy → set vào biến môi trường Next.js:
 *        NEXT_PUBLIC_APPLY_SHEET_ENDPOINT=https://script.google.com/macros/s/YOUR_ID/exec
 *   5. Mỗi lần sửa code phải tạo New deployment mới (không dùng lại deployment cũ)
 *
 * Cột trong Sheet KHÔNG cần đúng thứ tự — script tự đọc header hàng 1
 * và điền đúng cột tương ứng theo tên.
 * ─────────────────────────────────────────────────────────────
 *
 * ═══════════════════════════════════════════════════════════════
 * APPS SCRIPT — dán toàn bộ vào Code.gs
 * ═══════════════════════════════════════════════════════════════
 *
 * // Tên tab sheet chứa dữ liệu leads (hàng 1 = header tên cột)
 * const SHEET_NAME = 'candidates';
 *
 * // Sinh candidate_id tiếp theo dạng UV00000001 tăng dần
 * function generateCandidateId(sheet, headers) {
 *   const idColIdx = headers.indexOf('candidate_id');
 *   if (idColIdx === -1) return '';
 *   const lastRow = sheet.getLastRow();
 *   if (lastRow <= 1) return 'UV00000001';
 *   const idValues = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues();
 *   let maxNum = 0;
 *   idValues.forEach(function(row) {
 *     const match = String(row[0]).match(/^UV(\d+)$/);
 *     if (match) {
 *       const num = parseInt(match[1], 10);
 *       if (num > maxNum) maxNum = num;
 *     }
 *   });
 *   return 'UV' + String(maxNum + 1).padStart(8, '0');
 * }
 *
 * function doPost(e) {
 *   const lock = LockService.getScriptLock();
 *   lock.tryLock(10000);
 *   try {
 *     const data = JSON.parse(e.postData.contents);
 *
 *     const ss    = SpreadsheetApp.getActiveSpreadsheet();
 *     const sheet = ss.getSheetByName(SHEET_NAME);
 *     if (!sheet) throw new Error('Không tìm thấy sheet: ' + SHEET_NAME);
 *
 *     // Đọc header hàng 1, trim whitespace
 *     const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
 *                          .getValues()[0]
 *                          .map(function(h) { return String(h).trim(); });
 *
 *     // Bổ sung các trường sinh tự động phía server
 *     data.candidate_id              = generateCandidateId(sheet, headers);
 *     data.interested                = false;
 *     data.scheduled_for_interview   = false;
 *     data.show_up_for_interview     = false;
 *     data.pass_interview            = false;
 *     data.onboard                   = false;
 *     data.reject_offer              = false;
 *     data.unqualified               = false;
 *
 *     // Build row theo thứ tự header thực tế trong sheet
 *     const row = new Array(headers.length).fill('');
 *     headers.forEach(function(key, idx) {
 *       if (key in data) {
 *         row[idx] = (data[key] === null || data[key] === undefined) ? '' : data[key];
 *       }
 *     });
 *
 *     sheet.appendRow(row);
 *
 *     // Ép cột phone thành Text để Sheets không tự convert thành số
 *     const phoneColIdx = headers.indexOf('phone');
 *     if (phoneColIdx !== -1) {
 *       const newRow = sheet.getLastRow();
 *       sheet.getRange(newRow, phoneColIdx + 1).setNumberFormat('@STRING@');
 *       sheet.getRange(newRow, phoneColIdx + 1).setValue(String(data.phone));
 *     }
 *
 *     return ContentService
 *       .createTextOutput(JSON.stringify({ success: true }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *
 *   } catch (err) {
 *     Logger.log('LỖI: ' + err.message);
 *     const ss2 = SpreadsheetApp.getActiveSpreadsheet();
 *     const logSheet = ss2.getSheetByName('Logs') || ss2.insertSheet('Logs');
 *     logSheet.appendRow([new Date(), err.message, err.stack]);
 *     return ContentService
 *       .createTextOutput(JSON.stringify({ success: false, error: err.message }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   } finally {
 *     try { lock.releaseLock(); } catch(_) {}
 *   }
 * }
 *
 * // Test đọc header — chạy trong Editor để kiểm tra
 * function testHeaders() {
 *   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
 *   const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
 *   Logger.log(headers);
 * }
 *
 * // Test insert thủ công
 * function testDoPost() {
 *   const fakeEvent = {
 *     postData: {
 *       contents: JSON.stringify({
 *         created_at: new Date().toISOString(),
 *         last_updated_at: new Date().toISOString(),
 *         created_by: 'KOSAD',
 *         candidate_name: 'Test User',
 *         gender: 'Nam',
 *         date_of_birth: '1995-01-01',
 *         phone: '0912345678',
 *         company: 'Test Co',
 *         position: 'Test Pos',
 *         project_id: 'TEST01',
 *         project: 'Test Project',
 *         project_type: 'Test',
 *         take_note: '',
 *         assigned_user: 'KOSAD',
 *         assigned_user_name: 'KOS Admin',
 *         assigned_user_group: 'admin',
 *         data_source_dept: 'Marketing',
 *         data_source_type_group: 'MKT Organic khác',
 *         data_source_type: 'LadiPage',
 *         new: true,
 *       })
 *     }
 *   };
 *   doPost(fakeEvent);
 * }
 * ═══════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { getAssignedUser } from '@/lib/assignmentRules';

// ── Types ──────────────────────────────────────────────────────────────────
interface ApplyModalProps {
  open: boolean;
  onClose: () => void;
  company: string;
  positions: string[];
  projectId: string;
  projectName: string;
  projectType: string;
  addressCity?: string;
}

interface FormData {
  candidate_name: string;
  gender: string;
  date_of_birth: string;
  phone: string;
  company: string;
  position: string;
  referrer_name: string;
  referrer_phone: string;
}

interface FormErrors {
  candidate_name?: string;
  gender?: string;
  date_of_birth?: string;
  phone?: string;
  position?: string;
  referrer_phone?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getIsoString(): string {
  return new Date().toISOString();
}

function validatePhone(phone: string): boolean {
  return /^0\d{9}$/.test(phone.trim());
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.candidate_name.trim()) errors.candidate_name = 'Vui lòng nhập họ tên';
  if (!data.gender) errors.gender = 'Vui lòng chọn giới tính';
  if (!data.date_of_birth) errors.date_of_birth = 'Vui lòng nhập ngày sinh';
  if (!data.phone.trim()) {
    errors.phone = 'Vui lòng nhập số điện thoại';
  } else if (!validatePhone(data.phone)) {
    errors.phone = 'Số điện thoại phải có 10 chữ số, bắt đầu bằng 0';
  }
  if (!data.position) errors.position = 'Vui lòng chọn vị trí ứng tuyển';
  if (data.referrer_phone && !validatePhone(data.referrer_phone)) {
    errors.referrer_phone = 'Số điện thoại người giới thiệu phải có 10 chữ số, bắt đầu bằng 0';
  }
  return errors;
}

// ── Input Components ───────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[11px] text-red-500 font-medium">{msg}</p>;
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

// ── Main Component ─────────────────────────────────────────────────────────
export default function ApplyModal({
  open, onClose,
  company, positions,
  projectId, projectName, projectType,
  addressCity,
}: ApplyModalProps) {
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwCRMgc3rqlSyZFSvsXCd0vtwVWp8UjJRz4gwjFb7LpLnP-3CKJPd8C0iAHfSx8MYHJ/exec';

  const [form, setForm] = useState<FormData>({
    candidate_name: '',
    gender: '',
    date_of_birth: '',
    phone: '',
    company,
    position: positions.length === 1 ? positions[0] : '',
    referrer_name: '',
    referrer_phone: '',
  });
  const [errors, setErrors]     = useState<FormErrors>({});
  const [submitting, setSubmit] = useState(false);
  const [submitted, setDone]    = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync company nếu prop thay đổi
  useEffect(() => {
    setForm(f => ({ ...f, company, position: positions.length === 1 ? positions[0] : f.position }));
  }, [company, positions]);

  // Reset khi mở lại
  useEffect(() => {
    if (open) {
      setForm({
        candidate_name: '', gender: '', date_of_birth: '', phone: '',
        company,
        position: positions.length === 1 ? positions[0] : '',
        referrer_name: '', referrer_phone: '',
      });
      setErrors({}); setSubmit(false); setDone(false); setSubmitErr(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (!ENDPOINT) {
      setSubmitErr('Chưa cấu hình endpoint Google Sheet. Vui lòng liên hệ quản trị viên.');
      return;
    }

    setSubmit(true); setSubmitErr(null);

    const timestamp = getIsoString();
    const assignment = getAssignedUser({ project_type: projectType, address_city: addressCity });

    // Xây dựng take_note từ người giới thiệu
    let take_note = '';
    if (form.referrer_name.trim()) {
      take_note = `Giới thiệu bởi ${form.referrer_name.trim()}`;
      if (form.referrer_phone.trim()) take_note += ` - ${form.referrer_phone.trim()}`;
    }

    const payload = {
      created_at:             timestamp,
      last_updated_at:        timestamp,
      created_by:             'KOSAD',
      candidate_name:         form.candidate_name.trim(),
      gender:                 form.gender,
      date_of_birth:          form.date_of_birth,
      phone:                  form.phone.trim(),
      company:                form.company,
      position:               form.position,
      project_id:             projectId,
      project:                projectName,
      project_type:           projectType,
      take_note,
      assigned_user:          assignment.assigned_user,
      assigned_user_name:     assignment.assigned_user_name,
      assigned_user_group:    assignment.assigned_user_group,
      data_source_dept:       'Marketing',
      data_source_type_group: 'MKT Organic khác',
      data_source_type:       'LadiPage',
      new:                    true,
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        // no-cors vì Apps Script không trả CORS header khi mode='cors'
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // no-cors → opaque response, không đọc được body nhưng request đã gửi thành công
      void res;
      setDone(true);
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitErr('Có lỗi khi gửi đơn. Vui lòng thử lại hoặc liên hệ hotline.');
    } finally {
      setSubmit(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Form ứng tuyển"
    >
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[95dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-black text-gray-900 text-base">Ứng tuyển ngay</h2>
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{company}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-lg"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-5">

          {/* ── Thành công ── */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg">Đã gửi đơn thành công!</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Cảm ơn bạn đã ứng tuyển.<br/>
                  Chúng tôi sẽ liên hệ trong thời gian sớm nhất.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition text-sm"
              >
                Đóng
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Thông tin cá nhân */}
              <div className="space-y-4">
                <p className="text-[11px] font-black text-orange-500 uppercase tracking-widest">Thông tin cá nhân</p>

                <InputField
                  label="Họ và tên" required
                  placeholder="Nguyễn Văn A"
                  value={form.candidate_name}
                  onChange={set('candidate_name')}
                  error={errors.candidate_name}
                  autoComplete="name"
                />

                {/* Giới tính */}
                <div>
                  <Label required>Giới tính</Label>
                  <select
                    value={form.gender}
                    onChange={set('gender')}
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
                  label="Ngày sinh" required
                  type="date"
                  value={form.date_of_birth}
                  onChange={set('date_of_birth')}
                  error={errors.date_of_birth}
                  max={new Date().toISOString().split('T')[0]}
                />

                <InputField
                  label="Số điện thoại" required
                  type="tel"
                  placeholder="0912345678"
                  value={form.phone}
                  onChange={set('phone')}
                  error={errors.phone}
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </div>

              {/* Thông tin ứng tuyển */}
              <div className="space-y-4 pt-1">
                <p className="text-[11px] font-black text-orange-500 uppercase tracking-widest">Vị trí ứng tuyển</p>

                {/* Công ty — autofill, readonly */}
                <div>
                  <Label>Công ty ứng tuyển</Label>
                  <div className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-600 font-medium">
                    {form.company}
                  </div>
                </div>

                {/* Vị trí */}
                <div>
                  <Label required>Vị trí ứng tuyển</Label>
                  {positions.length <= 1 ? (
                    <div className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[13px] text-gray-700 font-medium">
                      {positions[0] ?? '—'}
                    </div>
                  ) : (
                    <select
                      value={form.position}
                      onChange={set('position')}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-gray-800 bg-white outline-none transition
                        focus:ring-2 focus:ring-orange-300 focus:border-orange-400
                        ${errors.position ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    >
                      <option value="">-- Chọn vị trí --</option>
                      {positions.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  )}
                  <FieldError msg={errors.position} />
                </div>
              </div>

              {/* Người giới thiệu */}
              <div className="space-y-4 pt-1">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Người giới thiệu <span className="text-gray-300 font-normal normal-case">(nếu có)</span></p>

                <InputField
                  label="Tên người giới thiệu"
                  placeholder="Nguyễn Thị B"
                  value={form.referrer_name}
                  onChange={set('referrer_name')}
                />

                <InputField
                  label="SĐT người giới thiệu"
                  type="tel"
                  placeholder="0987654321"
                  value={form.referrer_phone}
                  onChange={set('referrer_phone')}
                  error={errors.referrer_phone}
                  maxLength={10}
                  inputMode="numeric"
                />
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
              ) : 'Gửi đơn ứng tuyển →'}
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
