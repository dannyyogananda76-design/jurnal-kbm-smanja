import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Home, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Siswa, Mapel, Kelas } from '../../lib/types';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export default function AdminSiswa() {
  const { showToast } = useToast();
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'siswa' | 'mapel'>('siswa');

  // Siswa state
  const [siswaModal, setSiswaModal] = useState(false);
  const [siswaForm, setSiswaForm] = useState({ nis: '', nama: '', kelas_id: '' });
  const [siswaEditId, setSiswaEditId] = useState<string | null>(null);
  const [siswaDeleteId, setSiswaDeleteId] = useState<string | null>(null);

  // Mapel state
  const [mapelModal, setMapelModal] = useState(false);
  const [mapelForm, setMapelForm] = useState({ nama_mapel: '' });
  const [mapelEditId, setMapelEditId] = useState<string | null>(null);
  const [mapelDeleteId, setMapelDeleteId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [filterKelas, setFilterKelas] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [{ data: sw }, { data: mp }, { data: kl }] = await Promise.all([
      supabase.from('siswa').select('*, kelas(nama_kelas)').order('nama'),
      supabase.from('mapel').select('*').order('nama_mapel'),
      supabase.from('kelas').select('*').order('nama_kelas'),
    ]);
    setSiswaList(sw ?? []);
    setMapelList(mp ?? []);
    setKelasList(kl ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSiswa = filterKelas
    ? siswaList.filter(s => s.kelas_id === filterKelas)
    : siswaList;

  const handleSaveSiswa = async () => {
    if (!siswaForm.nis || !siswaForm.nama) { showToast('NIS dan nama wajib diisi', 'error'); return; }
    setSaving(true);
    const payload = { nis: siswaForm.nis, nama: siswaForm.nama, kelas_id: siswaForm.kelas_id || null };
    const { error } = siswaEditId
      ? await supabase.from('siswa').update(payload).eq('id', siswaEditId)
      : await supabase.from('siswa').insert(payload);
    setSaving(false);
    if (error) { showToast('Gagal menyimpan', 'error'); return; }
    showToast(`Siswa berhasil ${siswaEditId ? 'diperbarui' : 'ditambahkan'}`, 'success');
    setSiswaModal(false);
    await fetchData();
  };

  const handleDeleteSiswa = async () => {
    if (!siswaDeleteId) return;
    const { error } = await supabase.from('siswa').delete().eq('id', siswaDeleteId);
    if (error) { showToast('Gagal menghapus', 'error'); return; }
    showToast('Siswa berhasil dihapus', 'success');
    setSiswaDeleteId(null);
    await fetchData();
  };

  const handleSaveMapel = async () => {
    if (!mapelForm.nama_mapel) { showToast('Nama mata pelajaran wajib diisi', 'error'); return; }
    setSaving(true);
    const { error } = mapelEditId
      ? await supabase.from('mapel').update({ nama_mapel: mapelForm.nama_mapel }).eq('id', mapelEditId)
      : await supabase.from('mapel').insert({ nama_mapel: mapelForm.nama_mapel });
    setSaving(false);
    if (error) { showToast('Gagal menyimpan', 'error'); return; }
    showToast(`Mata pelajaran berhasil ${mapelEditId ? 'diperbarui' : 'ditambahkan'}`, 'success');
    setMapelModal(false);
    await fetchData();
  };

  const handleDeleteMapel = async () => {
    if (!mapelDeleteId) return;
    const { error } = await supabase.from('mapel').delete().eq('id', mapelDeleteId);
    if (error) { showToast('Gagal menghapus', 'error'); return; }
    showToast('Mata pelajaran berhasil dihapus', 'success');
    setMapelDeleteId(null);
    await fetchData();
  };

  const siswaColumns = [
    { key: 'no', label: 'No', width: '50px', render: (_: unknown, i?: number) => (i ?? 0) + 1 },
    { key: 'nis', label: 'NIS' },
    { key: 'nama', label: 'Nama Siswa' },
    { key: 'kelas', label: 'Kelas', render: (row: Siswa) => (row.kelas as Kelas)?.nama_kelas ?? '-' },
    {
      key: 'actions', label: 'Aksi', width: '100px',
      render: (row: Siswa) => (
        <div className="flex gap-1">
          <button onClick={() => { setSiswaEditId(row.id); setSiswaForm({ nis: row.nis, nama: row.nama, kelas_id: row.kelas_id ?? '' }); setSiswaModal(true); }} className="p-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setSiswaDeleteId(row.id)} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )
    },
  ];

  const mapelColumns = [
    { key: 'no', label: 'No', width: '50px', render: (_: unknown, i?: number) => (i ?? 0) + 1 },
    { key: 'nama_mapel', label: 'Nama Mata Pelajaran' },
    {
      key: 'actions', label: 'Aksi', width: '100px',
      render: (row: Mapel) => (
        <div className="flex gap-1">
          <button onClick={() => { setMapelEditId(row.id); setMapelForm({ nama_mapel: row.nama_mapel }); setMapelModal(true); }} className="p-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setMapelDeleteId(row.id)} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Home className="w-4 h-4" /><ChevronRight className="w-3 h-3" /><span>Data</span>
        <ChevronRight className="w-3 h-3" /><span className="text-gray-800 font-medium">Siswa & Mata Pelajaran</span>
        <span className="ml-auto text-gray-400">Data &gt; Siswa & Mapel</span>
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('siswa')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'siswa' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Siswa
        </button>
        <button onClick={() => setTab('mapel')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'mapel' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          Mata Pelajaran
        </button>
      </div>

      {tab === 'siswa' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Data Siswa</h2>
            <button onClick={() => { setSiswaEditId(null); setSiswaForm({ nis: '', nama: '', kelas_id: '' }); setSiswaModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" />Tambah Siswa
            </button>
          </div>
          <div className="p-5">
            <DataTable
              data={filteredSiswa as unknown as Record<string, unknown>[]}
              columns={siswaColumns as never}
              searchKeys={['nis', 'nama']}
              loading={loading}
              extraFilters={
                <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Semua Kelas</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                </select>
              }
            />
          </div>
        </div>
      )}

      {tab === 'mapel' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Data Mata Pelajaran</h2>
            <button onClick={() => { setMapelEditId(null); setMapelForm({ nama_mapel: '' }); setMapelModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" />Tambah Mapel
            </button>
          </div>
          <div className="p-5">
            <DataTable data={mapelList as unknown as Record<string, unknown>[]} columns={mapelColumns as never} searchKeys={['nama_mapel']} loading={loading} />
          </div>
        </div>
      )}

      {/* Siswa Modal */}
      <Modal isOpen={siswaModal} onClose={() => setSiswaModal(false)} title={siswaEditId ? 'Edit Siswa' : 'Tambah Siswa'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIS</label>
            <input type="text" value={siswaForm.nis} onChange={e => setSiswaForm({ ...siswaForm, nis: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nomor Induk Siswa" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siswa</label>
            <input type="text" value={siswaForm.nama} onChange={e => setSiswaForm({ ...siswaForm, nama: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama lengkap" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <select value={siswaForm.kelas_id} onChange={e => setSiswaForm({ ...siswaForm, kelas_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setSiswaModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
            <button onClick={handleSaveSiswa} disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-70">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Simpan
            </button>
          </div>
        </div>
      </Modal>

      {/* Mapel Modal */}
      <Modal isOpen={mapelModal} onClose={() => setMapelModal(false)} title={mapelEditId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mata Pelajaran</label>
            <input type="text" value={mapelForm.nama_mapel} onChange={e => setMapelForm({ nama_mapel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Matematika" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setMapelModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
            <button onClick={handleSaveMapel} disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-70">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Simpan
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirms */}
      <Modal isOpen={!!siswaDeleteId} onClose={() => setSiswaDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600 mb-4">Hapus siswa ini?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setSiswaDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleDeleteSiswa} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">Hapus</button>
        </div>
      </Modal>
      <Modal isOpen={!!mapelDeleteId} onClose={() => setMapelDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600 mb-4">Hapus mata pelajaran ini?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setMapelDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleDeleteMapel} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">Hapus</button>
        </div>
      </Modal>
    </div>
  );
}
