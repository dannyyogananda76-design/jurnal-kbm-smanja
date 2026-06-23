import React from 'react';
import type { Agenda, Guru, Kelas, Mapel, TahunPelajaran, Instansi } from '../../lib/types';

interface PrintPreviewProps {
  instansi: Instansi | null;
  guru: Guru | null;
  agendaData: Agenda[];
  tahunPelajaran: TahunPelajaran | null;
  mapel: Mapel | null;
  kelas: Kelas | null;
  periode: string;
}

export default function PrintPreview({
  instansi, guru, agendaData, tahunPelajaran, mapel, kelas, periode
}: PrintPreviewProps) {
  const namaInstansi = instansi?.nama_instansi ?? 'SMA NEGERI 1 JATIBARANG';
  const alamat = instansi?.alamat ?? 'Jl. Raya Karanglo - Tegalwulung Kec. Jatibarang';
  const email = instansi?.email ?? '';
  const alamatLengkap = email ? `${alamat}, Email : ${email}` : alamat;
  const logoUrl = instansi?.logo_url;
  const tahunAjaran = tahunPelajaran?.nama ?? '-';
  const namaGuru = guru?.nama ?? '-';
  const nipNuptk = [guru?.nip, guru?.nuptk].filter(Boolean).join(' / ') || '-';
  const namaMapel = mapel?.nama_mapel ?? 'Semua Mata Pelajaran';
  const namaKelas = kelas?.nama_kelas ?? 'Semua Kelas';

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const totalHadir = agendaData.reduce((s, a) => s + a.jumlah_hadir, 0);
  const totalIzin = agendaData.reduce((s, a) => s + a.jumlah_izin, 0);
  const totalSakit = agendaData.reduce((s, a) => s + a.jumlah_sakit, 0);
  const totalAlpha = agendaData.reduce((s, a) => s + a.jumlah_alpha, 0);

  return (
    <div className="print-container space-y-6">
      {/* ==================== COVER PAGE ==================== */}
      <div className="bg-white print-page cover-page-print">
        <div className="cover-border border-2 border-dashed border-gray-400 p-10 flex flex-col items-center justify-center min-h-[700px] text-center">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-black uppercase tracking-wide mb-1">
              LAPORAN JURNAL AGENDA GURU
            </h1>
            <h2 className="text-xl font-bold uppercase">
              TAHUN AJARAN {tahunAjaran}
            </h2>
          </div>

          {/* Logo */}
          <div className="my-6">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo Sekolah" className="w-40 h-40 object-contain" />
            ) : (
              <div className="w-40 h-40 rounded-full bg-blue-100 border-4 border-blue-300 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm text-center leading-tight px-2">SMA NEGERI 1<br />JATIBARANG<br />KEC. JATIBARANG</span>
              </div>
            )}
          </div>

          {/* Teacher Info */}
          <div className="mb-10 space-y-1">
            <div className="text-base font-bold" style={{ fontFamily: 'Courier New, monospace', letterSpacing: '0.12em' }}>
              Nama Lengkap &nbsp;&nbsp; : {namaGuru}
            </div>
            <div className="text-base font-bold" style={{ fontFamily: 'Courier New, monospace', letterSpacing: '0.12em' }}>
              NIP / NUPTK &nbsp;&nbsp;&nbsp;&nbsp; : {nipNuptk}
            </div>
          </div>

          {/* School Info */}
          <div className="space-y-1">
            <div className="text-sm font-bold uppercase tracking-widest">Pemerintah Provinsi Jawa Tengah</div>
            <div className="text-base font-bold uppercase tracking-wider">Dinas Pendidikan</div>
            <div className="text-3xl font-black uppercase mt-1">{namaInstansi}</div>
            <div className="text-sm text-gray-600 mt-1">{alamatLengkap}</div>
          </div>
        </div>
      </div>

      {/* ==================== CONTENT PAGE ==================== */}
      <div className="bg-white print-page">
        {/* Journal title */}
        <div className="text-center mb-5 pb-3 border-b-2 border-gray-800">
          <h3 className="text-lg font-black uppercase tracking-wide">Jurnal Agenda Mengajar</h3>
        </div>

        <div className="mb-4 text-sm space-y-0.5">
          {[
            ['Guru Pengampu', namaGuru],
            ['Mata Pelajaran', namaMapel],
            ['Kelas', namaKelas],
            ['Tahun Ajaran', tahunAjaran],
            ['Periode', periode],
          ].map(([l, v]) => (
            <div key={l} className="flex gap-2">
              <span className="w-32 font-medium text-gray-700 shrink-0">{l}</span>
              <span>:</span>
              <span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <table className="w-full text-xs border-collapse border border-gray-600 mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-center font-bold w-8">No</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-center font-bold">Hari/<br />Tanggal</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-center font-bold">Kelas</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-center font-bold">Jam<br />Ke</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-center font-bold">Materi</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-center font-bold">Selesai/<br />Belum</th>
              <th colSpan={4} className="border border-gray-600 px-2 py-1 text-center font-bold">Absensi</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-center font-bold">Keterangan<br />(Tindak Lanjut)</th>
            </tr>
            <tr className="bg-gray-100">
              {['H', 'I', 'S', 'A'].map(h => (
                <th key={h} className="border border-gray-600 px-1 py-1 text-center font-bold w-6">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agendaData.length === 0 ? (
              <tr>
                <td colSpan={11} className="border border-gray-600 px-2 py-6 text-center text-gray-400">
                  Tidak ada data agenda
                </td>
              </tr>
            ) : (
              agendaData.map((a, i) => {
                const jdwl = a.jadwal as { jam_ke_mulai: number; jam_ke_selesai: number; jam_mulai: string; jam_selesai: string } | null;
                const jamKe = jdwl ? `${jdwl.jam_ke_mulai}-${jdwl.jam_ke_selesai}` : '-';
                const selesai = a.status === 'Terlaksana' ? 'Selesai' : 'Belum';
                return (
                  <tr key={a.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                    <td className="border border-gray-600 px-2 py-1.5 text-center">{i + 1}</td>
                    <td className="border border-gray-600 px-2 py-1.5">{fmtDate(a.tanggal)}</td>
                    <td className="border border-gray-600 px-2 py-1.5 text-center">{(a.kelas as Kelas)?.nama_kelas ?? '-'}</td>
                    <td className="border border-gray-600 px-2 py-1.5 text-center">{jamKe}</td>
                    <td className="border border-gray-600 px-2 py-1.5">{a.materi || '-'}</td>
                    <td className="border border-gray-600 px-2 py-1.5 text-center">
                      <span className={a.status === 'Terlaksana' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                        {selesai}
                      </span>
                    </td>
                    <td className="border border-gray-600 px-1 py-1.5 text-center">{a.jumlah_hadir}</td>
                    <td className="border border-gray-600 px-1 py-1.5 text-center">{a.jumlah_izin}</td>
                    <td className="border border-gray-600 px-1 py-1.5 text-center">{a.jumlah_sakit}</td>
                    <td className="border border-gray-600 px-1 py-1.5 text-center">{a.jumlah_alpha}</td>
                    <td className="border border-gray-600 px-2 py-1.5 text-center">{a.catatan || '-'}</td>
                  </tr>
                );
              })
            )}
            {/* Totals row */}
            {agendaData.length > 0 && (
              <tr className="bg-gray-100 font-bold">
                <td colSpan={6} className="border border-gray-600 px-2 py-1.5 text-right">Total</td>
                <td className="border border-gray-600 px-1 py-1.5 text-center">{totalHadir}</td>
                <td className="border border-gray-600 px-1 py-1.5 text-center">{totalIzin}</td>
                <td className="border border-gray-600 px-1 py-1.5 text-center">{totalSakit}</td>
                <td className="border border-gray-600 px-1 py-1.5 text-center">{totalAlpha}</td>
                <td className="border border-gray-600 px-2 py-1.5"></td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Rekap */}
        <div className="mb-6 text-xs">
          <div className="font-bold mb-1.5">Rekapitulasi</div>
          <div className="grid grid-cols-5 gap-2">
            {[
              ['Jumlah Pertemuan', agendaData.length],
              ['Total Hadir', totalHadir],
              ['Total Izin', totalIzin],
              ['Total Sakit', totalSakit],
              ['Total Alpha', totalAlpha],
            ].map(([l, v]) => (
              <div key={String(l)} className="border border-gray-400 rounded p-2 text-center">
                <div className="font-bold text-base">{v}</div>
                <div className="text-gray-500 text-xs leading-tight">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Signature */}
        <div className="grid grid-cols-2 gap-12 text-sm mt-8">
          <div className="text-center">
            <p className="mb-1">Mengetahui,</p>
            <p className="font-medium mb-16">Kepala Sekolah</p>
            <div className="border-t border-gray-600 pt-1">
              <p className="font-bold">{instansi?.nama_kepsek ?? '_______________'}</p>
              <p className="text-xs text-gray-500">NIP. {instansi?.nip_kepsek ?? '-'}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="mb-1">Jatibarang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-medium mb-16">Guru Mata Pelajaran</p>
            <div className="border-t border-gray-600 pt-1">
              <p className="font-bold">{namaGuru}</p>
              <p className="text-xs text-gray-500">NIP. {guru?.nip ?? '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
