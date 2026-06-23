import React, { useEffect, useState } from 'react';
import { Printer, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Agenda, Kelas, Mapel, TahunPelajaran, Instansi } from '../../lib/types';
import PrintPreview from '../../components/ui/PrintPreview';

export default function GuruCetakAgenda() {
  const { guru } = useAuth();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [tpList, setTpList] = useState<TahunPelajaran[]>([]);
  const [instansi, setInstansi] = useState<Instansi | null>(null);
  const [agendaData, setAgendaData] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [filter, setFilter] = useState({
    kelas_id: '', mapel_id: '', tahun_pelajaran_id: '',
    tanggal_awal: '', tanggal_akhir: ''
  });

  useEffect(() => {
    const load = async () => {
      const [{ data: k }, { data: m }, { data: tp }, { data: inst }] = await Promise.all([
        supabase.from('kelas').select('*').order('nama_kelas'),
        supabase.from('mapel').select('*').order('nama_mapel'),
        supabase.from('tahun_pelajaran').select('*').order('created_at', { ascending: false }),
        supabase.from('instansi').select('*').maybeSingle(),
      ]);
      setKelasList(k ?? []);
      setMapelList(m ?? []);
      setTpList(tp ?? []);
      setInstansi(inst);
      const activeTp = tp?.find(t => t.aktif);
      if (activeTp) setFilter(f => ({ ...f, tahun_pelajaran_id: activeTp.id }));
    };
    load();
  }, []);

  const handlePreview = async () => {
    if (!guru) return;
    setLoading(true);
    let query = supabase.from('agenda')
      .select('*, kelas(nama_kelas), mapel(nama_mapel), tahun_pelajaran(nama,semester), jadwal(jam_ke_mulai,jam_ke_selesai,jam_mulai,jam_selesai)')
      .eq('guru_id', guru.id)
      .order('tanggal');

    if (filter.kelas_id) query = query.eq('kelas_id', filter.kelas_id);
    if (filter.mapel_id) query = query.eq('mapel_id', filter.mapel_id);
    if (filter.tahun_pelajaran_id) query = query.eq('tahun_pelajaran_id', filter.tahun_pelajaran_id);
    if (filter.tanggal_awal) query = query.gte('tanggal', filter.tanggal_awal);
    if (filter.tanggal_akhir) query = query.lte('tanggal', filter.tanggal_akhir);

    const { data } = await query;
    setAgendaData(data ?? []);
    setLoading(false);
    setPreviewing(true);
  };

  const activeTp = tpList.find(t => t.id === filter.tahun_pelajaran_id);
  const selectedMapel = mapelList.find(m => m.id === filter.mapel_id);
  const selectedKelas = kelasList.find(k => k.id === filter.kelas_id);

  const periodeText = (() => {
    if (filter.tanggal_awal && filter.tanggal_akhir) {
      return `${new Date(filter.tanggal_awal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s/d ${new Date(filter.tanggal_akhir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return 'Semua Periode';
  })();

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-5 print:hidden">Cetak Jurnal Mengajar</h1>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 print:hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Filter Jurnal</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Pelajaran</label>
              <select value={filter.tahun_pelajaran_id} onChange={e => setFilter({ ...filter, tahun_pelajaran_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Semua --</option>
                {tpList.map(t => <option key={t.id} value={t.id}>{t.nama} - {t.semester}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
              <select value={filter.mapel_id} onChange={e => setFilter({ ...filter, mapel_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Mapel</option>
                {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <select value={filter.kelas_id} onChange={e => setFilter({ ...filter, kelas_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Awal</label>
              <input type="date" value={filter.tanggal_awal} onChange={e => setFilter({ ...filter, tanggal_awal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
              <input type="date" value={filter.tanggal_akhir} onChange={e => setFilter({ ...filter, tanggal_akhir: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handlePreview} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70">
              <Eye className="w-4 h-4" />{loading ? 'Memuat...' : 'Preview'}
            </button>
            {previewing && (
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                <Printer className="w-4 h-4" />Cetak / Simpan PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {previewing && (
        <PrintPreview
          instansi={instansi}
          guru={guru}
          agendaData={agendaData}
          tahunPelajaran={activeTp ?? null}
          mapel={selectedMapel ?? null}
          kelas={selectedKelas ?? null}
          periode={periodeText}
        />
      )}
    </div>
  );
}
