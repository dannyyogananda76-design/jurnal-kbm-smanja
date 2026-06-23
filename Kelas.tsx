import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Home, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Kelas, JamPelajaran } from '../../lib/types';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export default function AdminKelas() {
  const { showToast } = useToast();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jamList, setJamList] = useState<JamPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'kelas' | 'jam'>('kelas');

  // Kelas state
  const [kelasModal, setKelasModal] = useState(false);
  const [kelasForm, setKelasForm] = useState({ nama_kelas: '' });
  const [kelasEditId, setKelasEditId] = useState<string | null>(null);
  const [kelasDeleteId, setKelasDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Jam state
  const [jamModal, setJamModal] = useState(false);
  const [jamForm, setJamForm] = useState({ jam_ke: '', jam_mulai: '', jam_selesai: '' });
  const [jamEditId, setJamEditId] = useState<string | null>(null);
  const [jamDeleteId, setJamDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: kelas }, { data: jam }] = await Promise.all([
      supabase.from('kelas').select('*').order('nama_kelas'),
      supabase.from('jam_pelajaran').select('*').order('jam_ke'),
    ]);
    setKelasList(kelas ?? []);
    setJamList(jam ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveKelas = async () => {
    if (!kelasForm.nama_kelas) { showToast('Nama kelas wajib diisi', 'error'); return; }
    setSaving(true);
    const { error } = kelasEditId
      ? await supabase.from('kelas').update({ nama_kelas: kelasForm.nama_kelas }).eq('id', kelasEditId)
      : await supabase.from('kelas').insert({ nama_kelas: kelasForm.nama_kelas });
    setSaving(false);
    if (error) { showToast('Gagal menyimpan', 'error'); return; }
    showToast(`Kelas berhasil ${kelasEditId ? 'diperbarui' : 'ditambahkan'}`, 'success');
    setKelasModal(false);
    await fetchData();
  };

  const handleDeleteKelas = async () => {
    if (!kelasDeleteId) return;
    const { error } = await supabase.from('kelas').delete().eq('id', kelasDeleteId);
    if (error) { showToast('Gagal menghapus', 'error'); return; }
    showToast('Kelas berhasil dihapus', 'success');
    setKelasDeleteId(null);
    await fetchData();
  };

  const handleSaveJam = async () => {
    if (!jamForm.jam_ke || !jamForm.jam_mulai || !jamForm.jam_selesai) { showToast('Semua field wajib diisi', 'error'); return; }
    setSaving(true);
    const payload = { jam_ke: Number(jamForm.jam_ke), jam_mulai: jamForm.jam_mulai, jam_selesai: jamForm.jam_selesai };
    const { error } = jamEditId
      ? await supabase.from('jam_pelajaran').update(payload).eq('id', jamEditId)
      : await supabase.from('jam_pelajaran').insert(payload);
    setSaving(false);
    if (error) { showToast('Gagal menyimpan', 'error'); return; }
    showToast(`Jam pelajaran berhasil ${jamEditId ? 'diperbarui' : 'ditambahkan'}`, 'success');
    setJamModal(false);
    await fetchData();
  };

  const handleDeleteJam = async () => {
    if (!jamDeleteId) return;
    const { error } = await supabase.from('jam_pelajaran').delete().eq('id', jamDeleteId);
    if (error) { showToast('Gagal menghapus', 'error'); return; }
    showToast('Jam pelajaran berhasil dihapus', 'success');
    setJamDeleteId(null);
    await fetchData();
  };

  const fmt = (t: string) => t ? t.substring(0, 5) : '';

  const kelasColumns = [
    { key: 'no', label: 'No', width: '60px', render: (_: unknown, i?: number) => (i ?? 0) + 1 },
    { key: 'nama_kelas', label: 'Nama Kelas' },
    {
      key: 'actions', label: 'Aksi', width: '100px',
      render: (row: Kelas) => (
        <div className="flex gap-1">
          <button onClick={() => { setKelasEditId(row.id); setKelasForm({ nama_kelas: row.nama_kelas }); setKelasModal(true); }} className="p-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setKelasDeleteId(row.id)} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )
    },
  ];

  const jamColumns = [
    { key: 'no', label: 'No', width: '60px', render: (_: unknown, i?: number) => (i ?? 0) + 1 },
    { key: 'jam_ke', label: 'Jam Ke' },
    { key: 'jam_mulai', label: 'Jam Mulai', render: (row: JamPelajaran) => fmt(row.jam_mulai) },
    { key: 'jam_selesai', label: 'Jam Selesai', render: (row: JamPelajaran) => fmt(row.jam_selesai) },
    {
      key: 'actions', label: 'Aksi', width: '100px',
      render: (row: JamPelajaran) => (
        <div className="flex gap-1">
          <button onClick={() => { setJamEditId(row.id); setJamForm({ jam_ke: String(row.jam_ke), jam_mulai: fmt(row.jam_mulai), jam_selesai: fmt(row.jam_selesai) }); setJamModal(true); }} className="p-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setJamDeleteId(row.id)} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Home className="w-4 h-4" /><ChevronRight className="w-3 h-3" /><span>Data</span>
        <ChevronRight className="w-3 h-3" /><span className="text-gray-800 font-medium">Kelas & Jam Pelajaran</span>
        <span className="ml-auto text-gray-400">Data &gt; Kelas & Jampel</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('kelas')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'kelas' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Kelas
        </button>
        <button onClick={() => setTab('jam')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'jam' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Jam Pelajaran
        </button>
      </div>

      {tab === 'kelas' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Data Kelas</h2>
            <button onClick={() => { setKelasEditId(null); setKelasForm({ nama_kelas: '' }); setKelasModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" />Tambah Kelas
            </button>
          </div>
          <div className="p-5">
            <DataTable data={kelasList as unknown as Record<string, unknown>[]} columns={kelasColumns as never} searchKeys={['nama_kelas']} loading={loading} />
          </div>
        </div>
      )}

      {tab === 'jam' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Data Jam Pelajaran</h2>
            <button onClick={() => { setJamEditId(null); setJamForm({ jam_ke: '', jam_mulai: '', jam_selesai: '' }); setJamModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" />Tambah Jam
            </button>
          </div>
          <div className="p-5">
            <DataTable data={jamList as unknown as Record<string, unknown>[]} columns={jamColumns as never} searchKeys={['jam_ke']} loading={loading} />
          </div>
        </div>
      )}

      {/* Kelas Modal */}
      <Modal isOpen={kelasModal} onClose={() => setKelasModal(false)} title={kelasEditId ? 'Edit Kelas' : 'Tambah Kelas'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
            <input type="text" value={kelasForm.nama_kelas} onChange={e => setKelasForm({ nama_kelas: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: X.1" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setKelasModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
            <button onClick={handleSaveKelas} disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-70">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Simpan
            </button>
          </div>
        </div>
      </Modal>

      {/* Jam Modal */}
      <Modal isOpen={jamModal} onClose={() => setJamModal(false)} title={jamEditId ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Ke</label>
            <input type="number" value={jamForm.jam_ke} onChange={e => setJamForm({ ...jamForm, jam_ke: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1" min="1" max="12" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
              <input type="time" value={jamForm.jam_mulai} onChange={e => setJamForm({ ...jamForm, jam_mulai: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
              <input type="time" value={jamForm.jam_selesai} onChange={e => setJamForm({ ...jamForm, jam_selesai: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setJamModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
            <button onClick={handleSaveJam} disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-70">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Simpan
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirms */}
      <Modal isOpen={!!kelasDeleteId} onClose={() => setKelasDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600 mb-4">Hapus kelas ini? Data jadwal terkait akan terpengaruh.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setKelasDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleDeleteKelas} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">Hapus</button>
        </div>
      </Modal>
      <Modal isOpen={!!jamDeleteId} onClose={() => setJamDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600 mb-4">Hapus jam pelajaran ini?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setJamDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleDeleteJam} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">Hapus</button>
        </div>
      </Modal>
    </div>
  );
}
