export type Role = 'admin' | 'guru';

export interface Profile {
  id: string;
  nama: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Instansi {
  id: string;
  npsn: string;
  nama_instansi: string;
  alamat: string;
  email: string;
  nama_kepsek: string;
  nip_kepsek: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TahunPelajaran {
  id: string;
  nama: string;
  semester: 'Ganjil' | 'Genap';
  aktif: boolean;
  created_at: string;
}

export interface Guru {
  id: string;
  user_id: string | null;
  nama: string;
  nip: string;
  nuptk: string;
  alamat: string;
  hp: string;
  wa: string;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Kelas {
  id: string;
  nama_kelas: string;
  created_at: string;
}

export interface Mapel {
  id: string;
  nama_mapel: string;
  created_at: string;
}

export interface JamPelajaran {
  id: string;
  jam_ke: number;
  jam_mulai: string;
  jam_selesai: string;
  created_at: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string | null;
  created_at: string;
  kelas?: Kelas;
}

export interface Jadwal {
  id: string;
  guru_id: string;
  kelas_id: string;
  mapel_id: string;
  tahun_pelajaran_id: string;
  hari: string;
  jam_ke_mulai: number;
  jam_ke_selesai: number;
  jam_mulai: string;
  jam_selesai: string;
  created_at: string;
  guru?: Guru;
  kelas?: Kelas;
  mapel?: Mapel;
  tahun_pelajaran?: TahunPelajaran;
}

export interface Agenda {
  id: string;
  guru_id: string;
  jadwal_id: string | null;
  kelas_id: string | null;
  mapel_id: string | null;
  tahun_pelajaran_id: string | null;
  tanggal: string;
  materi: string;
  tujuan: string;
  metode: string;
  kegiatan: string;
  media: string;
  jumlah_hadir: number;
  jumlah_izin: number;
  jumlah_sakit: number;
  jumlah_alpha: number;
  status: 'Terlaksana' | 'Tidak Terlaksana';
  catatan: string;
  created_at: string;
  updated_at: string;
  guru?: Guru;
  kelas?: Kelas;
  mapel?: Mapel;
  tahun_pelajaran?: TahunPelajaran;
  jadwal?: Jadwal;
}

export interface Absensi {
  id: string;
  agenda_id: string;
  siswa_id: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
  created_at: string;
  siswa?: Siswa;
}

export const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const STATUS_ABSENSI = ['Hadir', 'Izin', 'Sakit', 'Alpha'] as const;
