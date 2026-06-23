import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Jadwal, Kelas, Mapel, Agenda } from '../../lib/types';

const HARI_ID: Record<number, string> = { 0: 'Minggu', 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu' };

export default function GuruDashboard() {
  const { guru } = useAuth();
  const [activeTab, setActiveTab] = useState<'jadwal' | 'materi' | 'absensi'>('jadwal');
  const [jadwalHariIni, setJadwalHariIni] = useState<Jadwal[]>([]);
  const [materiTerakhir, setMateriTerakhir] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const hariIni = HARI_ID[today.getDay()];
  const tanggalStr = today.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    if (!guru) return;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: jadwal }, { data: agenda }] = await Promise.all([
        supabase.from('jadwal')
          .select('*, kelas(nama_kelas), mapel(nama_mapel)')
          .eq('guru_id', guru.id)
          .eq('hari', hariIni)
          .order('jam_mulai'),
        supabase.from('agenda')
          .select('*, kelas(nama_kelas), mapel(nama_mapel)')
          .eq('guru_id', guru.id)
          .order('tanggal', { ascending: false })
          .limit(5),
      ]);
      setJadwalHariIni(jadwal ?? []);
      setMateriTerakhir(agenda ?? []);
      setLoading(false);
    };
    fetchData();
  }, [guru, hariIni]);

  const fmt = (t: string) => t?.substring(0, 5) ?? '';

  const tabs = [
    { key: 'jadwal', label: 'JADWAL MENGAJAR' },
    { key: 'materi', label: 'MATERI TERAKHIR' },
    { key: 'absensi', label: 'ABSENSI SISWA' },
  ] as const;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>

      {/* Tanggal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-400" />
        <div className="p-5">
          <table className="text-sm">
            <tbody>
              <tr>
                <td className="text-gray-500 pr-12 py-1">Hari</td>
                <td className="text-gray-800 font-medium">{hariIni}</td>
              </tr>
              <tr>
                <td className="text-gray-500 py-1">Tanggal</td>
                <td className="text-gray-800 font-medium">{tanggalStr}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Jadwal Hari Ini Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab bar */}
        <div className="bg-purple-600 px-5 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-white text-sm font-medium">Menu:</span>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5
                ${activeTab === tab.key ? 'bg-purple-800 text-white' : 'text-purple-200 hover:text-white hover:bg-purple-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === 'jadwal' ? (
            jadwalHariIni.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">🎉</div>
                <p>Tidak ada jadwal mengajar hari ini ({hariIni})</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['No', 'Kelas', 'Jam ke', 'Mengajar Pukul', 'Mata Pelajaran'].map(h => (
                        <th key={h} className="pb-3 text-left text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {jadwalHariIni.map((j, i) => (
                      <tr key={j.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 text-gray-600">{i + 1}</td>
                        <td className="py-3 pr-4 font-medium text-gray-800">{(j.kelas as Kelas)?.nama_kelas}</td>
                        <td className="py-3 pr-4 text-gray-600">{j.jam_ke_mulai} - {j.jam_ke_selesai}</td>
                        <td className="py-3 pr-4 text-gray-600">{fmt(j.jam_mulai)} - {fmt(j.jam_selesai)}</td>
                        <td className="py-3 text-gray-800">{(j.mapel as Mapel)?.nama_mapel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === 'materi' ? (
            materiTerakhir.length === 0 ? (
              <p className="text-center py-8 text-gray-400">Belum ada materi yang diisi</p>
            ) : (
              <div className="space-y-3">
                {materiTerakhir.map(a => (
                  <div key={a.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase">
                        {new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'Terlaksana' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-800">{a.materi || '(Belum diisi)'}</div>
                    <div className="text-xs text-gray-500 mt-1">{(a.kelas as Kelas)?.nama_kelas} &bull; {(a.mapel as Mapel)?.nama_mapel}</div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-center py-8 text-gray-400">Pilih jadwal untuk melihat absensi siswa</p>
          )}
        </div>
      </div>
    </div>
  );
}
