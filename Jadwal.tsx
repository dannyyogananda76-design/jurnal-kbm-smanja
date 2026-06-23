import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Home, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Jadwal, Guru, Kelas, Mapel, TahunPelajaran } from '../../lib/types';
import { HARI_OPTIONS } from '../../lib/types';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

interface JadwalForm {
  guru_id: string; kelas_id: string; mapel_id: string;
  tahun_pelajaran_id: string; hari: string;
  jam_ke_mulai: string; jam_ke_selesai: string;
  jam_mulai: string; jam_selesai: string;
}

export default function AdminJadwal() {
  const { showToast } = useToast();
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [tpList, setTpList] = useState<TahunPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterGuru, setFilterGuru] = useState('');
  const [filterHari, setFilterHari] = useState('');
  const [form, setForm] = useState<JadwalForm>({
    guru_id: '', kelas_id: '', mapel_id: '', tahun_pelajaran_id: '',
    hari: 'Senin', jam_ke_mulai: '1', jam_ke_selesai: '2', jam_mulai: '07:00', jam_selesai: '08:30'
  });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: jadwal }, { data: guru }, { data: kelas }, { data: mapel }, { data: tp }] = await Promise.all([
      supabase.from('jadwal').select('*, guru(nama), kelas(nama_kelas), mapel(nama_mapel), tahun_pelajaran(nama,semester)').order('hari').order('jam_mulai'),
      supabase.from('guru').select('*').order('nama'),
      supabase.from('kelas').select('*').order('nama_kelas'),
      supabase.from('mapel').select('*').order('nama_mapel'),
      supabase.from('tahun_pelajaran').select('*').order('created_at', { ascending: false }),
    ]);
    setJadwalList(jadwal ?? []);
    setGuruList(guru ?? []);
    setKelasList(kelas ?? []);
    setMapelList(mapel ?? []);
    setTpList(tp ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = jadwalList.filter(j => {
    const guruOk = !filterGuru || j.guru_id === filterGuru;
    const hariOk = !filterHari || j.hari === filterHari;
    return guruOk && hariOk;
  });

  const openCreate = () => {
    setEditId(null);
    const activeTp = tpList.find(t => t.aktif);
    setForm({
      guru_id: '', kelas_id: '', mapel_id: '',
      tahun_pelajaran_id: activeTp?.id ?? tpList[0]?.id ?? '',
      hari: 'Senin', jam_ke_mulai: '1', jam_ke_selesai: '2', jam_mulai: '07:00', jam_selesai: '08:30'
    });
    setModalOpen(true);
  };

  const openEdit = (j: Jadwal) => {
    setEditId(j.id);
    setForm({
      guru_id: j.guru_id, kelas_id: j.kelas_id, mapel_id: j.mapel_id,
      tahun_pelajaran_id: j.tahun_pelajaran_id, hari: j.hari,
      jam_ke_mulai: String(j.jam_ke_mulai), jam_ke_selesai: String(j.jam_ke_selesai),
      jam_mulai: j.jam_mulai.substring(0, 5), jam_selesai: j.jam_selesai.substring(0, 5)
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.guru_id || !form.kelas_id || !form.mapel_id || !form.hari) {
      showToast('Semua field wajib diisi', 'error'); return;
    }
    setSaving(true);
    const payload = {
      guru_id: form.guru_id, kelas_id: form.kelas_id, mapel_id: form.mapel_id,
      tahun_pelajaran_id: form.tahun_pelajaran_id || null, hari: form.hari,
      jam_ke_mulai: Number(form.jam_ke_mulai), jam_ke_selesai: Number(form.jam_ke_selesai),
      jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai,
    };
    const { error } = editId
      ? await supabase.from('jadwal').update(payload).eq('id', editId)
      : await supabase.from('jadwal').insert(payload);
    setSaving(false);
    if (error) { showToast('Gagal menyimpan jadwal', 'error'); return; }
    showToast(`Jadwal berhasil ${editId ? 'diperbarui' : 'ditambahkan'}`, 'success');
    setModalOpen(false);
    await fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('jadwal').delete().eq('id', deleteId);
    if (error) { showToast('Gagal menghapus', 'error'); return; }
    showToast('Jadwal berhasil dihapus', 'success');
    setDeleteId(null);
    await fetchData();
  };

  const fmt = (t: string) => t?.substring(0, 5) ?? '';

  const columns = [
    { key: 'no', label: 'No', width: '50px', render: (_: unknown, i?: number) => (i ?? 0) + 1 },
    { key: 'hari', label: 'Hari', render: (r: Jadwal) => r.hari },
    { key: 'guru', label: 'Guru', render: (r: Jadwal) => (r.guru as Guru)?.nama ?? '-' },
    { key: 'kelas', label: 'Kelas', render: (r: Jadwal) => (r.kelas as Kelas)?.nama_kelas ?? '-' },
    { key: 'jam', label: 'Jam Ke', render: (r: Jadwal) => `${r.jam_ke_mulai} - ${r.jam_ke_selesai}` },
    { key: 'waktu', label: 'Waktu', render: (r: Jadwal) => `${fmt(r.jam_mulai)} - ${fmt(r.jam_selesai)}` },
    { key: 'mapel', label: 'Mata Pelajaran', render: (r: Jadwal) => (r.mapel as Mapel)?.nama_mapel ?? '-' },
    {
      key: 'actions', label: 'Aksi', width: '100px',
      render: (r: Jadwal) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )
    },
  ];

  const setF = (k: keyof JadwalForm) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Home className="w-4 h-4" /><ChevronRight className="w-3 h-3" /><span>Jadwal</span>
        <ChevronRight className="w-3 h-3" /><span className="text-gray-800 font-medium">Jadwal Mengajar</span>
        <span className="ml-auto text-gray-400">Jadwal &gt; Jadwal Mengajar</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Data Jadwal Mengajar</h2>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />Tambah Jadwal
          </button>
        </div>
        <div className="p-5">
          <DataTable
            data={filtered as unknown as Record<string, unknown>[]}
            columns={columns as never}
            searchKeys={[]}
            loading={loading}
            extraFilters={
              <div className="flex gap-2">
                <select value={filterGuru} onChange={e => setFilterGuru(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Semua Guru</option>
                  {guruList.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
                <select value={filterHari} onChange={e => setFilterHari(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Semua Hari</option>
                  {HARI_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            }
          />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Jadwal' : 'Tambah Jadwal'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Pelajaran</label>
            <select value={form.tahun_pelajaran_id} onChange={setF('tahun_pelajaran_id')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Tahun Pelajaran --</option>
              {tpList.map(t => <option key={t.id} value={t.id}>{t.nama} - {t.semester}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guru</label>
            <select value={form.guru_id} onChange={setF('guru_id')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Guru --</option>
              {guruList.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
            <select value={form.kelas_id} onChange={setF('kelas_id')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
            <select value={form.mapel_id} onChange={setF('mapel_id')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Mapel --</option>
              {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
            <select value={form.hari} onChange={setF('hari')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {HARI_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Ke Mulai</label>
            <input type="number" value={form.jam_ke_mulai} onChange={setF('jam_ke_mulai')} min="1" max="12"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Ke Selesai</label>
            <input type="number" value={form.jam_ke_selesai} onChange={setF('jam_ke_selesai')} min="1" max="12"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
            <input type="time" value={form.jam_mulai} onChange={setF('jam_mulai')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
            <input type="time" value={form.jam_selesai} onChange={setF('jam_selesai')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
        <p className="text-sm text-gray-600 mb-4">Hapus jadwal ini?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">Hapus</button>
        </div>
      </Modal>
    </div>
  );
}
