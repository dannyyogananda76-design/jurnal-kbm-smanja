import React, { useEffect, useState } from 'react';
import {
  Upload, Download, Home, ChevronRight, CheckCircle,
  XCircle, Loader2, FileText, Users, GraduationCap, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Kelas } from '../../lib/types';
import { useToast } from '../../components/ui/Toast';

type ImportMode = 'guru' | 'siswa';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function AdminImport() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<ImportMode>('guru');
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    supabase.from('kelas').select('*').order('nama_kelas').then(({ data }) => setKelasList(data ?? []));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setPreview(rows.slice(0, 6));
    };
    reader.readAsText(f, 'UTF-8');
  };

  const parseCSV = (text: string): string[][] => {
    return text.trim().split('\n').map(line =>
      line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    );
  };

  const handleImport = async () => {
    if (!file) { showToast('Pilih file CSV terlebih dahulu', 'error'); return; }
    setImporting(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        showToast('File CSV kosong atau tidak valid', 'error');
        setImporting(false);
        return;
      }

      const dataRows = rows.slice(1); // skip header
      const res: ImportResult = { success: 0, failed: 0, errors: [] };

      if (mode === 'guru') {
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (row.length < 1 || !row[0]) continue;
          const [nama, nip = '', nuptk = '', alamat = '', hp = '', wa = ''] = row;
          if (!nama) { res.failed++; res.errors.push(`Baris ${i + 2}: Nama kosong`); continue; }
          const { error } = await supabase.from('guru').insert({ nama, nip, nuptk, alamat, hp, wa });
          if (error) { res.failed++; res.errors.push(`Baris ${i + 2}: ${error.message}`); }
          else res.success++;
        }
      } else {
        // Build kelas map
        const kelasMap: Record<string, string> = {};
        kelasList.forEach(k => { kelasMap[k.nama_kelas.toLowerCase()] = k.id; });

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (row.length < 2 || !row[0]) continue;
          const [nis, nama, nama_kelas = ''] = row;
          if (!nis || !nama) { res.failed++; res.errors.push(`Baris ${i + 2}: NIS atau Nama kosong`); continue; }
          const kelas_id = kelasMap[nama_kelas.toLowerCase()] ?? null;
          const { error } = await supabase.from('siswa').insert({ nis, nama, kelas_id });
          if (error) { res.failed++; res.errors.push(`Baris ${i + 2}: ${error.message}`); }
          else res.success++;
        }
      }

      setResult(res);
      setImporting(false);
      if (res.success > 0) showToast(`${res.success} data berhasil diimpor`, 'success');
      if (res.failed > 0) showToast(`${res.failed} data gagal diimpor`, 'error');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const downloadTemplate = (type: ImportMode) => {
    let content = '';
    if (type === 'guru') {
      content = 'nama,nip,nuptk,alamat,hp,wa\n';
      content += 'Danny Yogananda S.Kom,19900617202221 1 005,1234567890123456,Jl. Contoh No. 1,081234567890,081234567890\n';
      content += 'Siti Rahayu S.Pd,19850512199903 2 001,9876543210987654,Jl. Contoh No. 2,082345678901,082345678901\n';
    } else {
      content = 'nis,nama,nama_kelas\n';
      content += '2024001,Ahmad Fauzi,X.1\n';
      content += '2024002,Budi Santoso,X.1\n';
      content += '2024003,Citra Dewi,X.2\n';
    }
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_import_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFields = {
    guru: ['nama', 'nip', 'nuptk', 'alamat', 'hp', 'wa'],
    siswa: ['nis', 'nama', 'nama_kelas'],
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Home className="w-4 h-4" /><ChevronRight className="w-3 h-3" />
        <span>Data</span><ChevronRight className="w-3 h-3" />
        <span className="text-gray-800 font-medium">Import Data</span>
        <span className="ml-auto text-gray-400">Data &gt; Import</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config */}
        <div className="space-y-5">
          {/* Tab selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Jenis Data</h2>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => { setMode('guru'); setFile(null); setPreview([]); setResult(null); }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${mode === 'guru' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${mode === 'guru' ? 'bg-blue-500' : 'bg-gray-100'}`}>
                  <GraduationCap className={`w-5 h-5 ${mode === 'guru' ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className={`font-medium text-sm ${mode === 'guru' ? 'text-blue-700' : 'text-gray-700'}`}>Import Guru</div>
                  <div className="text-xs text-gray-400">Data guru dari file CSV</div>
                </div>
              </button>
              <button
                onClick={() => { setMode('siswa'); setFile(null); setPreview([]); setResult(null); }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${mode === 'siswa' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${mode === 'siswa' ? 'bg-green-500' : 'bg-gray-100'}`}>
                  <Users className={`w-5 h-5 ${mode === 'siswa' ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className={`font-medium text-sm ${mode === 'siswa' ? 'text-green-700' : 'text-gray-700'}`}>Import Siswa</div>
                  <div className="text-xs text-gray-400">Data siswa dari file CSV</div>
                </div>
              </button>
            </div>
          </div>

          {/* Format info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Format CSV</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {formatFields[mode].map((f, i) => (
                  <span key={f} className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${i === 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {f}{i === 0 ? ' *' : ''}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {mode === 'guru'
                  ? 'Kolom nama wajib diisi. NIP, NUPTK, Alamat, HP, WA bersifat opsional.'
                  : 'Kolom NIS dan nama wajib. nama_kelas harus sesuai dengan data kelas yang ada (misal: X.1, XI.2).'}
              </p>
              <button
                onClick={() => downloadTemplate(mode)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>

          {/* Kelas list for siswa */}
          {mode === 'siswa' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-semibold text-amber-700">Nama Kelas yang Tersedia</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {kelasList.map(k => (
                  <span key={k.id} className="px-2 py-0.5 bg-white border border-amber-300 rounded text-xs font-mono text-amber-800">
                    {k.nama_kelas}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Upload area */}
        <div className="lg:col-span-2 space-y-5">
          {/* Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Upload File CSV</h2>
            </div>
            <div className="p-5">
              <label className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                ${file ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'}`}>
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                <Upload className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-blue-500' : 'text-gray-300'}`} />
                {file ? (
                  <div>
                    <div className="flex items-center justify-center gap-2 text-blue-600 font-medium mb-1">
                      <FileText className="w-4 h-4" />
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB — Klik untuk ganti</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Klik atau drag & drop file CSV</div>
                    <div className="text-sm text-gray-400">Format: .csv (UTF-8)</div>
                  </div>
                )}
              </label>

              {preview.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview ({preview.length - 1} baris pertama)</div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {(preview[0] ?? []).map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.slice(1, 5).map((row, ri) => (
                          <tr key={ri} className="hover:bg-gray-50">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-2 text-gray-700">{cell || <span className="text-gray-300">-</span>}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.length > 5 && (
                    <p className="text-xs text-gray-400 text-center mt-1">... dan lebih banyak baris</p>
                  )}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!file || importing}
                className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-60
                  ${mode === 'guru' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Mengimpor...' : `Import Data ${mode === 'guru' ? 'Guru' : 'Siswa'}`}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Hasil Import</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                    <div>
                      <div className="text-2xl font-bold text-green-700">{result.success}</div>
                      <div className="text-sm text-green-600">Berhasil diimpor</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                    <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                    <div>
                      <div className="text-2xl font-bold text-red-700">{result.failed}</div>
                      <div className="text-sm text-red-600">Gagal diimpor</div>
                    </div>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-xs font-semibold text-red-600 uppercase mb-2">Detail Error</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                          {err}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.success > 0 && result.failed === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">Semua data berhasil diimpor!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
