import React, { useEffect, useState } from 'react';
import { Eye, Trash2, Home, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Agenda, Guru, Kelas, Mapel } from '../../lib/types';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export default function AdminAgenda() {
  const { showToast } = useToast();
  const [agendaList, setAgendaList] = useState<Agenda[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterGuru, setFilterGuru] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [{ data: agenda }, { data: guru }] = await Promise.all([
      supabase.from('agenda').select('*, guru(nama), kelas(nama_kelas), mapel(nama_mapel), tahun_pelajaran(nama,semester)').order('tanggal', { ascending: false }),
      supabase.from('guru').select('id, nama').order('nama'),
    ]);
    setAgendaList(agenda ?? []);
    setGuruList(guru ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = agendaList.filter(a => {
    const guruOk = !filterGuru || a.guru_id === filterGuru;
    const statusOk = !filterStatus || a.status === filterStatus;
    return guruOk && statusOk;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('agenda').delete().eq('id', deleteId);
    if (error) { showToast('Gagal menghapus', 'error'); return; }
    showToast('Agenda berhasil dihapus', 'success');
    setDeleteId(null);
    await fetchData();
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const columns = [
    { key: 'no', label: 'No', width: '50px', render: (_: unknown, i?: number) => (i ?? 0) + 1 },
    { key: 'tanggal', label: 'Tanggal', render: (r: Agenda) => new Date(r.tanggal).toLocaleDateString('id-ID') },
    { key: 'guru', label: 'Guru', render: (r: Agenda) => (r.guru as Guru)?.nama ?? '-' },
    { key: 'kelas', label: 'Kelas', render: (r: Agenda) => (r.kelas as Kelas)?.nama_kelas ?? '-' },
    { key: 'mapel', label: 'Mapel', render: (r: Agenda) => (r.mapel as Mapel)?.nama_mapel ?? '-' },
    { key: 'materi', label: 'Materi', render: (r: Agenda) => <span className="max-w-xs truncate block">{r.materi || '-'}</span> },
    {
      key: 'status', label: 'Status', render: (r: Agenda) => (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${r.status === 'Terlaksana' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {r.status}
        </span>
      )
    },
    {
      key: 'actions', label: 'Aksi', width: '100px',
      render: (r: Agenda) => (
        <div className="flex gap-1">
          <button onClick={() => setSelectedAgenda(r)} className="p-1.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700"><Eye className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Home className="w-4 h-4" /><ChevronRight className="w-3 h-3" /><span>Agenda</span>
        <ChevronRight className="w-3 h-3" /><span className="text-gray-800 font-medium">Agenda Mengajar</span>
        <span className="ml-auto text-gray-400">Agenda &gt; Agenda Mengajar</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Data Agenda Mengajar</h2>
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
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Semua Status</option>
                  <option value="Terlaksana">Terlaksana</option>
                  <option value="Tidak Terlaksana">Tidak Terlaksana</option>
                </select>
              </div>
            }
          />
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedAgenda} onClose={() => setSelectedAgenda(null)} title="Detail Agenda Mengajar" size="xl">
        {selectedAgenda && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Tanggal" value={fmtDate(selectedAgenda.tanggal)} />
              <InfoRow label="Guru" value={(selectedAgenda.guru as Guru)?.nama ?? '-'} />
              <InfoRow label="Kelas" value={(selectedAgenda.kelas as Kelas)?.nama_kelas ?? '-'} />
              <InfoRow label="Mata Pelajaran" value={(selectedAgenda.mapel as Mapel)?.nama_mapel ?? '-'} />
            </div>
            <hr />
            <InfoRow label="Materi Pembelajaran" value={selectedAgenda.materi || '-'} />
            <InfoRow label="Tujuan Pembelajaran" value={selectedAgenda.tujuan || '-'} />
            <InfoRow label="Metode Pembelajaran" value={selectedAgenda.metode || '-'} />
            <InfoRow label="Media Pembelajaran" value={selectedAgenda.media || '-'} />
            <InfoRow label="Kegiatan Pembelajaran" value={selectedAgenda.kegiatan || '-'} />
            <div className="grid grid-cols-4 gap-3">
              {[['Hadir', selectedAgenda.jumlah_hadir, 'green'], ['Izin', selectedAgenda.jumlah_izin, 'blue'], ['Sakit', selectedAgenda.jumlah_sakit, 'amber'], ['Alpha', selectedAgenda.jumlah_alpha, 'red']].map(([l, v, c]) => (
                <div key={String(l)} className={`bg-${c}-50 rounded-lg p-3 text-center`}>
                  <div className={`text-2xl font-bold text-${c}-600`}>{v}</div>
                  <div className={`text-xs text-${c}-600 font-medium`}>{l}</div>
                </div>
              ))}
            </div>
            <InfoRow label="Status" value={selectedAgenda.status} />
            {selectedAgenda.catatan && <InfoRow label="Catatan" value={selectedAgenda.catatan} />}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600 mb-4">Hapus agenda ini?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
          <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">Hapus</button>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}
