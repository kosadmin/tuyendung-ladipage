'use client';
import { useState } from 'react';

interface Props { open: boolean; onClose: () => void; }

export default function CTVModal({ open, onClose }: Props) {
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '',
    gender: '', district: '', referrer: '', referrerPhone: '',
    agreed: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const set = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.fullName || !form.phone) return alert('Vui lòng điền Họ tên và Số điện thoại');
    if (!form.agreed) return alert('Vui lòng đồng ý điều khoản dịch vụ');
    setLoading(true);
    // TODO: gọi API / Supabase insert ở đây
    // await supabase.from('ctv_registrations').insert([form]);
    await new Promise(r => setTimeout(r, 800)); // giả lập
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-orange-500 mb-1">Đăng ký</p>
            <h2 className="text-xl font-black text-gray-900">Trở thành Cộng tác viên</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">✕</button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <span className="text-5xl block mb-4">🎉</span>
            <p className="font-black text-gray-900 text-lg mb-2">Đăng ký thành công!</p>
            <p className="text-gray-500 text-sm">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
            <button onClick={onClose} className="mt-6 px-6 py-3 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 transition">Đóng</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
              <input value={form.fullName} onChange={e => set('fullName', e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400 transition" />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="0xxx xxx xxx" type="tel"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400 transition" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="example@email.com" type="email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400 transition" />
            </div>

            {/* Giới tính */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Giới tính</label>
              <div className="flex gap-3">
                {['Nam', 'Nữ', 'Khác'].map(g => (
                  <label key={g} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
                    <input type="radio" name="gender" value={g} checked={form.gender === g}
                      onChange={() => set('gender', g)} className="accent-orange-500" />
                    {g}
                  </label>
                ))}
              </div>
            </div>

            {/* Địa bàn */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Địa bàn tuyển dụng <span className="text-gray-400 font-normal">(nếu có)</span></label>
              <input value={form.district} onChange={e => set('district', e.target.value)}
                placeholder="VD: Hà Nội, Hải Phòng..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400 transition" />
            </div>

            {/* Người giới thiệu */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Người giới thiệu <span className="text-gray-400 font-normal">(nếu có)</span></label>
              <input value={form.referrer} onChange={e => set('referrer', e.target.value)}
                placeholder="Họ tên người giới thiệu"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400 transition" />
            </div>

            {/* SĐT người giới thiệu */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">SĐT người giới thiệu <span className="text-gray-400 font-normal">(nếu có)</span></label>
              <input value={form.referrerPhone} onChange={e => set('referrerPhone', e.target.value)}
                placeholder="0xxx xxx xxx" type="tel"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400 transition" />
            </div>

            {/* Điều khoản */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form.agreed} onChange={e => set('agreed', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0" />
              <span className="text-xs text-gray-500 leading-relaxed">
                Tôi đã đọc và đồng ý{' '}
                <a href="/terms" target="_blank" className="text-orange-500 font-bold hover:underline">Điều khoản dịch vụ</a>
                {' '}và{' '}
                <a href="/privacy" target="_blank" className="text-orange-500 font-bold hover:underline">Chính sách bảo mật</a>
              </span>
            </label>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-200 transition-all active:scale-95">
              {loading ? 'Đang gửi...' : 'Đăng ký làm Cộng tác viên →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
