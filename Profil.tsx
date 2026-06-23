import React, { useState, useEffect } from 'react';
import { Loader2, Save, KeyRound, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';

export default function GuruProfil() {
  const { guru, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [form, setForm] = useState({ nama: '', nip: '', nuptk: '', alamat: '', hp: '', wa: '' });
  const [passForm, setPassForm] = useState({ old: '', newPass: '', confirm: '' });

  useEffect(() => {
    if (guru) {
      setForm({ nama: guru.nama, nip: guru.nip, nuptk: guru.nuptk, alamat: guru.alamat, hp: guru.hp, wa: guru.wa });
    }
  }, [guru]);

  const handleSaveProfil = async () => {
    if (!form.nama) { showToast('Nama wajib diisi', 'error'); return; }
    if (!guru) return;
    setSaving(true);
    const { error } = await supabase.from('guru')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', guru.id);
    setSaving(false);
    if (error) { showToast('Gagal menyimpan profil', 'error'); return; }
    await refreshProfile();
    showToast('Profil berhasil diperbarui', 'success');
  };

  const handleChangePassword = async () => {
    if (!passForm.old || !passForm.newPass || !passForm.confirm) {
      showToast('Semua field password wajib diisi', 'error'); return;
    }
    if (passForm.newPass !== passForm.confirm) {
      showToast('Konfirmasi password tidak cocok', 'error'); return;
    }
    if (passForm.newPass.length < 6) {
      showToast('Password minimal 6 karakter', 'error'); return;
    }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: passForm.newPass });
    setSavingPass(false);
    if (error) { showToast('Gagal mengubah password: ' + error.message, 'error'); return; }
    setPassForm({ old: '', newPass: '', confirm: '' });
    showToast('Password berhasil diubah', 'success');
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Profil Guru</h1>

      {/* Profil Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-semibold text-gray-800">Data Profil</h2>
        </div>

        {/* Avatar */}
        <div className="px-6 pt-5 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
              <span className="text-white text-xs font-bold">+</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Guru</label>
              <input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className={inputCls} placeholder="Nama lengkap" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
              <input type="text" value={form.nip} onChange={e => setForm({ ...form, nip: e.target.value })} className={inputCls} placeholder="Nomor Induk Pegawai" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NUPTK</label>
              <input type="text" value={form.nuptk} onChange={e => setForm({ ...form, nuptk: e.target.value })} className={inputCls} placeholder="Nomor NUPTK" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
              <input type="tel" value={form.hp} onChange={e => setForm({ ...form, hp: e.target.value })} className={inputCls} placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input type="tel" value={form.wa} onChange={e => setForm({ ...form, wa: e.target.value })} className={inputCls} placeholder="08xxxxxxxxxx" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows={3} className={inputCls} placeholder="Alamat lengkap" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveProfil} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Profil
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="font-semibold text-gray-800">Ubah Password</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
            <input type="password" value={passForm.old} onChange={e => setPassForm({ ...passForm, old: e.target.value })} className={inputCls} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input type="password" value={passForm.newPass} onChange={e => setPassForm({ ...passForm, newPass: e.target.value })} className={inputCls} placeholder="Minimal 6 karakter" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <input type="password" value={passForm.confirm} onChange={e => setPassForm({ ...passForm, confirm: e.target.value })} className={inputCls} placeholder="Ulangi password baru" />
          </div>
          <div className="flex justify-end">
            <button onClick={handleChangePassword} disabled={savingPass}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70">
              {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Simpan Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
