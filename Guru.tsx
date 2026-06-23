import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Home, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Guru, Profile } from '../../lib/types';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

interface GuruForm {
  nama: string; nip: string; nuptk: string; alamat: string;
  hp: string; wa: string; user_id: string;
}

export default function AdminGuru() {
  const { showToast } = useToast();
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<GuruForm>({ nama: '', nip: '', nuptk: '', alamat: '', hp: '', wa: '', user_id: '' });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: guruData }, { data: profileData }] = await Promise.all([
      supabase.from('guru').select('*, profiles(nama, email, role)').order('nama'),
      supabase.from('profiles').select('*').eq('role', 'guru'),
    ]);
    setGurus(guruData ?? []);
    setProfiles(profileData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ nama: '', nip: '', nuptk: '', alamat: '', hp: '', wa: '', user_id: '' });
    setModalOpen(true);
  };

  const openEdit = (g: Guru) => {
    setEditId(g.id);
    setForm({ nama: g.nama, nip: g.nip, nuptk: g.nuptk, alamat: g.alamat, hp: g.hp, wa: g.wa, user_id: g.user_id ?? '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama) { showToast('Nama wajib diisi', 'error'); return; }
    setSaving(true);
    const payload = { nama: form.nama, nip: form.nip, nuptk: form.nuptk, alamat: form.alamat, hp: form.hp, wa: form.wa, user_id: form.user_id || null };
    const { error } = editId
      ? await supabase.from('guru').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId)
      : await supabase.from('guru').insert(payload);
    setSaving(false);
    if (error) { showToast('Gagal menyimpan data', 'error'); return; }
    showToast(`Guru berhasil ${editId ? 'diperbarui' : 'ditambahkan'}`, 'success');
    setModalOpen(false);
    await fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('guru').delete().eq('id', deleteId);
    if (error) { showToast('Gagal menghapus', 'error'); return; }
    showToast('Guru berhasil dihapus', 'success');
    setDeleteId(null);
    await fetchData();
  };

  const columns = [
    { key: 'no', label: 'No', width: '50px', render: (_: unknown, i?: number) => (i ?? 0) + 1 },
    { key: 'nama', label: 'Nama Guru' },
    { key: 'nip', label: 'NIP' },
    { key: 'nuptk', label: 'NUPTK' },
    { key: 'hp', label: 'No. HP' },
    {
      key: 'user_id', label: 'Akun', render: (row: Guru) => row.user_id
        ? <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Terhubung</span>
        : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Belum</span>
    },
    {
      key: 'actions', label: 'Aksi', width: '100px',
      render: (row: Guru) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )
    },
  ];

  const field = (label: string, key: keyof GuruForm, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder} />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Home className="w-4 h-4" /><ChevronRight className="w-3 h-3" /><span>Data</span>
        <ChevronRight className="w-3 h-3" /><span className="text-gray-800 font-medium">Guru</span>
        <span className="ml-auto text-gray-400">Data &gt; Guru</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Data Guru</h2>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />Tambah Guru
          </button>
        </div>
        <div className="p-5">
          <DataTable data={gurus as unknown as Record<string, unknown>[]} columns={columns as never} searchKeys={['nama', 'nip', 'nuptk']} loading={loading} />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Guru' : 'Tambah Guru'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">{field('Nama Lengkap', 'nama', 'text', 'Nama lengkap guru')}</div>
          {field('NIP', 'nip', 'text', '196XXXXXXXXX')}
          {field('NUPTK', 'nuptk', 'text', 'Nomor NUPTK')}
          {field('No. HP', 'hp', 'tel', '08XXXXXXXXXX')}
          {field('WhatsApp', 'wa', 'tel', '08XXXXXXXXXX')}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Alamat lengkap" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hubungkan ke Akun User</label>
            <select value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih User (opsional) --</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.nama} ({p.email})</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-70">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Simpan
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600 mb-4">Apakah Anda yakin ingin menghapus data guru ini?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">Hapus</button>
        </div>
      </Modal>
    </div>
  );
}
