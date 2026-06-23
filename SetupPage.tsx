import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

export default function SetupPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: 'Super Admin', email: 'admin@smajatibarang.sch.id', password: 'admin123' });
  const [done, setDone] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
      setHasAdmin((count ?? 0) > 0);
      setLoading(false);
    };
    check();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.email || !form.password) {
      showToast('Semua field wajib diisi', 'error'); return;
    }
    if (form.password.length < 6) {
      showToast('Password minimal 6 karakter', 'error'); return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { nama: form.nama, role: 'admin' } }
      });
      if (error) throw error;
      if (data.user) {
        // Wait a moment for the trigger to run
        await new Promise(r => setTimeout(r, 1000));
        await supabase.from('profiles').upsert({
          id: data.user.id,
          nama: form.nama,
          email: form.email,
          role: 'admin',
          updated_at: new Date().toISOString(),
        });
      }
      setDone(true);
    } catch (err: unknown) {
      showToast((err as Error).message || 'Gagal membuat akun admin', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full mx-4 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Setup Selesai</h2>
          <p className="text-gray-500 text-sm mb-5">Akun admin sudah ada. Silakan login.</p>
          <button onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
            Ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full mx-4 text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Akun Admin Berhasil Dibuat!</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-5 text-sm space-y-1">
            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{form.email}</span></div>
            <div><span className="text-gray-500">Password:</span> <span className="font-medium">{form.password}</span></div>
          </div>
          <button onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
            Login Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Setup Aplikasi</h1>
        <p className="text-gray-500 text-sm text-center mb-7">Buat akun Administrator pertama</p>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Administrator</label>
            <input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimal 6 karakter" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Buat Akun Admin
          </button>
        </form>

        <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <strong>Catatan:</strong> Halaman ini hanya muncul sekali saat belum ada admin. Setelah admin dibuat, halaman ini tidak bisa diakses lagi.
        </div>
      </div>
    </div>
  );
}
