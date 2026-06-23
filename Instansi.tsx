import React, { useEffect, useState } from 'react';
import { Home, ChevronRight, Loader2, Save, Upload, Image } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Instansi, TahunPelajaran } from '../../lib/types';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

export default function AdminInstansi() {
  const { showToast } = useToast();
  const [instansi, setInstansi] = useState<Instansi | null>(null);
  const [tpList, setTpList] = useState<TahunPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tpModal, setTpModal] = useState(false);
  const [tpForm, setTpForm] = useState({ nama: '', semester: 'Ganjil' as 'Ganjil' | 'Genap', aktif: false });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    npsn: '', nama_instansi: '', alamat: '', email: '',
    nama_kepsek: '', nip_kepsek: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: inst }, { data: tp }] = await Promise.all([
      supabase.from('instansi').select('*').maybeSingle(),
      supabase.from('tahun_pelajaran').select('*').order('created_at', { ascending: false }),
    ]);
    if (inst) {
      setInstansi(inst);
      setForm({ npsn: inst.npsn, nama_instansi: inst.nama_instansi, alamat: inst.alamat, email: inst.email || '', nama_kepsek: inst.nama_kepsek, nip_kepsek: inst.nip_kepsek });
    }
    setTpList(tp ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    const { error } = instansi
      ? await supabase.from('instansi').update(payload).eq('id', instansi.id)
      : await supabase.from('instansi').insert(payload);
    setSaving(false);
    if (error) { showToast('Gagal menyimpan', 'error'); return; }
    showToast('Data instansi berhasil disimpan', 'success');
    await fetchData();
  };

  const handleSaveTp = async () => {
    if (!tpForm.nama) { showToast('Nama tahun pelajaran wajib diisi', 'error'); return; }
    if (tpForm.aktif) {
      await supabase.from('tahun_pelajaran').update({ aktif: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    }
    const { error } = await supabase.from('tahun_pelajaran').insert(tpForm);
    if (error) { showToast('Gagal menyimpan', 'error'); return; }
    showToast('Tahun pelajaran berhasil ditambahkan', 'success');
    setTpModal(false);
    await fetchData();
  };

  const handleSetAktif = async (id: string) => {
    await supabase.from('tahun_pelajaran').update({ aktif: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tahun_pelajaran').update({ aktif: true }).eq('id', id);
    showToast('Tahun pelajaran aktif diubah', 'success');
    await fetchData();
  };

  const handleDeleteTp = async (id: string) => {
    await supabase.from('tahun_pelajaran').delete().eq('id', id);
    showToast('Tahun pelajaran dihapus', 'success');
    await fetchData();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !instansi) return;

    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file maksimal 2MB', 'error');
      return;
    }

    setUploadingLogo(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('instansi')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      showToast('Gagal mengupload logo', 'error');
      setUploadingLogo(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('instansi')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('instansi')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', instansi.id);

    setUploadingLogo(false);

    if (updateError) {
      showToast('Gagal menyimpan URL logo', 'error');
      return;
    }

    showToast('Logo berhasil diupload', 'success');
    await fetchData();
  };

  const handleDeleteLogo = async () => {
    if (!instansi?.logo_url) return;

    const { error } = await supabase
      .from('instansi')
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq('id', instansi.id);

    if (error) {
      showToast('Gagal menghapus logo', 'error');
      return;
    }

    showToast('Logo berhasil dihapus', 'success');
    await fetchData();
  };

  const labelCls = "block text-sm font-medium text-gray-500 text-right pr-6 py-1.5";
  const inputCls = "w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Home className="w-4 h-4" /><ChevronRight className="w-3 h-3" /><span>Data</span>
        <ChevronRight className="w-3 h-3" /><span className="text-gray-800 font-medium">Instansi</span>
        <span className="ml-auto text-gray-400">Data &gt; Instansi</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instansi Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Data Instansi</h2>
            <button className="text-gray-400 hover:text-gray-600 text-lg font-bold">−</button>
          </div>
          <div className="p-6 space-y-4">
            {[
              ['NPSN', 'npsn', 'text'],
              ['Nama Instansi', 'nama_instansi', 'text'],
              ['Nama Kepala Sekolah', 'nama_kepsek', 'text'],
              ['NIP Kepala Sekolah', 'nip_kepsek', 'text'],
              ['Email', 'email', 'email'],
            ].map(([label, key, type]) => (
              <div key={key} className="grid grid-cols-3 items-start gap-4">
                <label className={labelCls}>{label}</label>
                <div className="col-span-2">
                  <input type={type} value={form[key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className={inputCls} />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-3 items-start gap-4">
              <label className={labelCls}>Alamat Instansi</label>
              <div className="col-span-2">
                <textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })}
                  rows={3} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 items-start gap-4">
              <label className={labelCls}>Logo Sekolah</label>
              <div className="col-span-2">
                <div className="space-y-3">
                  {instansi?.logo_url ? (
                    <div className="flex items-start gap-4">
                      <img
                        src={instansi.logo_url}
                        alt="Logo Sekolah"
                        className="w-24 h-24 object-contain border border-gray-200 rounded-lg p-1"
                      />
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                            className="hidden"
                          />
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors">
                            <Upload className="w-4 h-4" />
                            {uploadingLogo ? 'Mengupload...' : 'Ganti Logo'}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={handleDeleteLogo}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
                        >
                          Hapus Logo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <Image className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          {uploadingLogo ? 'Mengupload...' : 'Klik untuk upload logo'}
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG, atau SVG (maks. 2MB)</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan
              </button>
            </div>
          </div>
        </div>

        {/* Tahun Pelajaran */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Tahun Pelajaran</h2>
            <button onClick={() => { setTpForm({ nama: '', semester: 'Ganjil', aktif: false }); setTpModal(true); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
              + Tambah
            </button>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {tpList.map(tp => (
                <div key={tp.id} className={`flex items-center gap-3 p-3 rounded-lg border ${tp.aktif ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-800">{tp.nama}</div>
                    <div className="text-xs text-gray-500">Semester {tp.semester}</div>
                  </div>
                  {tp.aktif && <span className="text-xs px-2 py-0.5 bg-green-600 text-white rounded-full font-medium">Aktif</span>}
                  <div className="flex gap-1">
                    {!tp.aktif && (
                      <button onClick={() => handleSetAktif(tp.id)}
                        className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors">
                        Aktifkan
                      </button>
                    )}
                    <button onClick={() => handleDeleteTp(tp.id)}
                      className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors">
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
              {tpList.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Belum ada tahun pelajaran</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={tpModal} onClose={() => setTpModal(false)} title="Tambah Tahun Pelajaran">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Pelajaran</label>
            <input type="text" value={tpForm.nama} onChange={e => setTpForm({ ...tpForm, nama: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: 2026/2027" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select value={tpForm.semester} onChange={e => setTpForm({ ...tpForm, semester: e.target.value as 'Ganjil' | 'Genap' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={tpForm.aktif} onChange={e => setTpForm({ ...tpForm, aktif: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-gray-700">Jadikan Tahun Pelajaran Aktif</span>
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setTpModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
            <button onClick={handleSaveTp} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Simpan</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
