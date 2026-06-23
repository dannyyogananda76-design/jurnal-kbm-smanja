import React, { useEffect, useState } from 'react';
import { Loader2, BookOpen, Users, Send, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Jadwal, Kelas, Mapel, TahunPelajaran, Siswa, Agenda } from '../../lib/types';
import { HARI_OPTIONS } from '../../lib/types';
import { useToast } from '../../components/ui/Toast';

interface AbsensiEntry {
  siswa_id: string;
  nama: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
}

interface AgendaForm {
  materi: string; tujuan: string; metode: string;
  kegiatan: string; media: string;
  jumlah_hadir: number; jumlah_izin: number; jumlah_sakit: number; jumlah_alpha: number;
  status: 'Terlaksana' | 'Tidak Terlaksana';
  catatan: string;
}

export default function GuruAgenda() {
  const { guru } = useAuth();
  const { showToast } = useToast();

  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [tpList, setTpList] = useState<TahunPelajaran[]>([]);
  const [agendaList, setAgendaList] = useState<Agenda[]>([]);

  const [filter, setFilter] = useState({ hari: '', kelas_id: '', mapel_id: '', tanggal: '' });
  const [filtered, setFilteredJadwal] = useState<Jadwal[]>([]);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [step, setStep] = useState<'filter' | 'agenda'>('filter');

  const [form, setForm] = useState<AgendaForm>({
    materi: '', tujuan: '', metode: '', kegiatan: '', media: '',
    jumlah_hadir: 0, jumlah_izin: 0, jumlah_sakit: 0, jumlah_alpha: 0,
    status: 'Terlaksana', catatan: ''
  });

  const [siswas, setSiswas] = useState<AbsensiEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [existingAgenda, setExistingAgenda] = useState<Agenda | null>(null);

  useEffect(() => {
    if (!guru) return;
    const load = async () => {
      const [{ data: jadwal }, { data: kelas }, { data: mapel }, { data: tp }, { data: agenda }] = await Promise.all([
        supabase.from('jadwal').select('*, kelas(nama_kelas), mapel(nama_mapel)').eq('guru_id', guru.id).order('hari').order('jam_mulai'),
        supabase.from('kelas').select('*').order('nama_kelas'),
        supabase.from('mapel').select('*').order('nama_mapel'),
        supabase.from('tahun_pelajaran').select('*').order('created_at', { ascending: false }),
        supabase.from('agenda').select('*, kelas(nama_kelas), mapel(nama_mapel)').eq('guru_id', guru.id).order('tanggal', { ascending: false }).limit(20),
      ]);
      setJadwalList(jadwal ?? []);
      setKelasList(kelas ?? []);
      setMapelList(mapel ?? []);
      setTpList(tp ?? []);
      setAgendaList(agenda ?? []);
    };
    load();
  }, [guru]);

  const handleFilter = () => {
    let result = jadwalList;
    if (filter.hari) result = result.filter(j => j.hari === filter.hari);
    if (filter.kelas_id) result = result.filter(j => j.kelas_id === filter.kelas_id);
    if (filter.mapel_id) result = result.filter(j => j.mapel_id === filter.mapel_id);
    setFilteredJadwal(result);
  };

  const handleSelectJadwal = async (j: Jadwal) => {
    if (!filter.tanggal) { showToast('Pilih tanggal terlebih dahulu', 'error'); return; }
    setSelectedJadwal(j);

    // Check existing agenda
    const { data: existing } = await supabase.from('agenda')
      .select('*')
      .eq('guru_id', guru!.id)
      .eq('jadwal_id', j.id)
      .eq('tanggal', filter.tanggal)
      .maybeSingle();

    if (existing) {
      setExistingAgenda(existing);
      setForm({
        materi: existing.materi, tujuan: existing.tujuan, metode: existing.metode,
        kegiatan: existing.kegiatan, media: existing.media,
        jumlah_hadir: existing.jumlah_hadir, jumlah_izin: existing.jumlah_izin,
        jumlah_sakit: existing.jumlah_sakit, jumlah_alpha: existing.jumlah_alpha,
        status: existing.status, catatan: existing.catatan
      });
    } else {
      setExistingAgenda(null);
      setForm({ materi: '', tujuan: '', metode: '', kegiatan: '', media: '', jumlah_hadir: 0, jumlah_izin: 0, jumlah_sakit: 0, jumlah_alpha: 0, status: 'Terlaksana', catatan: '' });
    }

    // Load siswa for this kelas
    const { data: sw } = await supabase.from('siswa').select('*').eq('kelas_id', j.kelas_id).order('nama');
    const agendaId = existing?.id;
    let absensiMap: Record<string, 'Hadir' | 'Izin' | 'Sakit' | 'Alpha'> = {};
    if (agendaId) {
      const { data: ab } = await supabase.from('absensi').select('*').eq('agenda_id', agendaId);
      ab?.forEach(a => { absensiMap[a.siswa_id] = a.status; });
    }
    setSiswas((sw ?? []).map(s => ({ siswa_id: s.id, nama: s.nama, status: absensiMap[s.id] ?? 'Hadir' })));
    setStep('agenda');
  };

  const updateSiswaStatus = (idx: number, status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha') => {
    setSiswas(prev => prev.map((s, i) => i === idx ? { ...s, status } : s));
    // Auto-recalculate counts
  };

  const calcCounts = () => {
    const counts = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
    siswas.forEach(s => {
      if (s.status === 'Hadir') counts.hadir++;
      else if (s.status === 'Izin') counts.izin++;
      else if (s.status === 'Sakit') counts.sakit++;
      else if (s.status === 'Alpha') counts.alpha++;
    });
    return counts;
  };

  const handleSave = async () => {
    if (!guru || !selectedJadwal || !filter.tanggal) return;
    setSaving(true);
    const counts = calcCounts();
    const activeTp = tpList.find(t => t.aktif);

    const agendaPayload = {
      guru_id: guru.id,
      jadwal_id: selectedJadwal.id,
      kelas_id: selectedJadwal.kelas_id,
      mapel_id: selectedJadwal.mapel_id,
      tahun_pelajaran_id: activeTp?.id ?? null,
      tanggal: filter.tanggal,
      ...form,
      jumlah_hadir: siswas.length > 0 ? counts.hadir : form.jumlah_hadir,
      jumlah_izin: siswas.length > 0 ? counts.izin : form.jumlah_izin,
      jumlah_sakit: siswas.length > 0 ? counts.sakit : form.jumlah_sakit,
      jumlah_alpha: siswas.length > 0 ? counts.alpha : form.jumlah_alpha,
      updated_at: new Date().toISOString(),
    };

    let agendaId = existingAgenda?.id;
    if (agendaId) {
      await supabase.from('agenda').update(agendaPayload).eq('id', agendaId);
    } else {
      const { data } = await supabase.from('agenda').insert(agendaPayload).select().maybeSingle();
      agendaId = data?.id;
    }

    // Save absensi
    if (agendaId && siswas.length > 0) {
      await supabase.from('absensi').delete().eq('agenda_id', agendaId);
      const absensiRows = siswas.map(s => ({ agenda_id: agendaId!, siswa_id: s.siswa_id, status: s.status }));
      await supabase.from('absensi').insert(absensiRows);
    }

    setSaving(false);
    showToast('Agenda berhasil disimpan', 'success');
    setStep('filter');
    setSelectedJadwal(null);
  };

  const fmt = (t: string) => t?.substring(0, 5) ?? '';

  if (step === 'agenda' && selectedJadwal) {
    const counts = calcCounts();
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setStep('filter')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">← Kembali</button>
          <h1 className="text-xl font-semibold text-gray-800">Isi Agenda Mengajar</h1>
        </div>

        {/* Info Jadwal */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><div className="text-blue-500 text-xs font-medium">Hari</div><div className="font-semibold">{selectedJadwal.hari}</div></div>
            <div><div className="text-blue-500 text-xs font-medium">Kelas</div><div className="font-semibold">{(selectedJadwal.kelas as Kelas)?.nama_kelas}</div></div>
            <div><div className="text-blue-500 text-xs font-medium">Mapel</div><div className="font-semibold">{(selectedJadwal.mapel as Mapel)?.nama_mapel}</div></div>
            <div><div className="text-blue-500 text-xs font-medium">Jam</div><div className="font-semibold">{fmt(selectedJadwal.jam_mulai)} - {fmt(selectedJadwal.jam_selesai)}</div></div>
          </div>
        </div>

        {/* Form Agenda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-800">Form Agenda</h2>
          </div>
          <div className="p-5 space-y-4">
            {(['materi', 'tujuan', 'metode', 'kegiatan', 'media'] as const).map(key => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {key === 'materi' ? 'Materi Pembelajaran' : key === 'tujuan' ? 'Tujuan Pembelajaran' : key === 'metode' ? 'Metode Pembelajaran' : key === 'kegiatan' ? 'Kegiatan Pembelajaran' : 'Media Pembelajaran'}
                </label>
                <textarea value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Pertemuan</label>
              <div className="flex gap-4">
                {(['Terlaksana', 'Tidak Terlaksana'] as const).map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => setForm({ ...form, status: s })}
                      className="w-4 h-4 text-blue-600" />
                    <span className={`text-sm font-medium ${s === 'Terlaksana' ? 'text-green-600' : 'text-red-600'}`}>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {siswas.length === 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['jumlah_hadir', 'jumlah_izin', 'jumlah_sakit', 'jumlah_alpha'] as const).map(k => (
                  <div key={k}>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{k.split('_')[1]}</label>
                    <input type="number" min="0" value={form[k]} onChange={e => setForm({ ...form, [k]: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Guru</label>
              <textarea value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Absensi Siswa */}
        {siswas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-500" />
                <h2 className="font-semibold text-gray-800">Absensi Siswa ({siswas.length} siswa)</h2>
              </div>
              <div className="flex gap-3 text-xs">
                {[['H', counts.hadir, 'green'], ['I', counts.izin, 'blue'], ['S', counts.sakit, 'amber'], ['A', counts.alpha, 'red']].map(([l, v, c]) => (
                  <span key={String(l)} className={`px-2 py-0.5 bg-${c}-100 text-${c}-700 rounded-full font-semibold`}>{l}:{v}</span>
                ))}
              </div>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase">
                    <th className="pb-2 text-left">Nama Siswa</th>
                    {['Hadir', 'Izin', 'Sakit', 'Alpha'].map(s => <th key={s} className="pb-2 text-center">{s}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {siswas.map((s, i) => (
                    <tr key={s.siswa_id}>
                      <td className="py-2 text-gray-800">{s.nama}</td>
                      {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as const).map(st => (
                        <td key={st} className="py-2 text-center">
                          <input type="radio" name={`status-${i}`} checked={s.status === st}
                            onChange={() => updateSiswaStatus(i, st)}
                            className={`w-4 h-4 ${st === 'Hadir' ? 'accent-green-500' : st === 'Izin' ? 'accent-blue-500' : st === 'Sakit' ? 'accent-amber-500' : 'accent-red-500'}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-70">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Simpan Agenda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-800">Agenda Mengajar</h1>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Pilih Jadwal</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
              <select value={filter.hari} onChange={e => setFilter({ ...filter, hari: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Hari</option>
                {HARI_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
              <select value={filter.mapel_id} onChange={e => setFilter({ ...filter, mapel_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Mapel</option>
                {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal <span className="text-red-500">*</span></label>
              <input type="date" value={filter.tanggal} onChange={e => setFilter({ ...filter, tanggal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button onClick={handleFilter}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            ISI AGENDA
          </button>
        </div>
      </div>

      {/* Filtered Jadwal */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Pilih Jadwal untuk Diisi</h2>
          </div>
          <div className="p-4 space-y-2">
            {filtered.map(j => (
              <button key={j.id} onClick={() => handleSelectJadwal(j)}
                className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-left">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{j.hari} &bull; {(j.kelas as Kelas)?.nama_kelas}</div>
                  <div className="text-sm text-gray-500">{(j.mapel as Mapel)?.nama_mapel} &bull; Jam ke {j.jam_ke_mulai}-{j.jam_ke_selesai} ({fmt(j.jam_mulai)}-{fmt(j.jam_selesai)})</div>
                </div>
                <ChevronDown className="w-5 h-5 text-blue-500 rotate-[-90deg]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Riwayat Agenda */}
      {agendaList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Riwayat Agenda Terakhir</h2>
          </div>
          <div className="p-4 space-y-2">
            {agendaList.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
                  <div className="text-xs text-gray-500">{(a.kelas as Kelas)?.nama_kelas} &bull; {(a.mapel as Mapel)?.nama_mapel} &bull; {a.materi ? a.materi.substring(0, 40) + '...' : '(belum diisi)'}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'Terlaksana' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
