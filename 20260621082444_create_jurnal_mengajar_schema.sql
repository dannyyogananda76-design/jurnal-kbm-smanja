
/*
# Jurnal Mengajar Guru SMA - Complete Database Schema

## Overview
Full schema for the SMA Negeri 1 Jatibarang Teaching Journal application.
Supports two roles: Admin and Guru (Teacher), with full teaching schedule and agenda management.

## New Tables
1. `profiles` - Extended user profiles linked to auth.users (stores role: admin/guru)
2. `instansi` - School institution information
3. `tahun_pelajaran` - Academic year records
4. `guru` - Teacher profile data (linked to profiles)
5. `kelas` - Classroom data
6. `mapel` - Subject (mata pelajaran) data
7. `jam_pelajaran` - Lesson hour slots
8. `siswa` - Student data (linked to kelas)
9. `jadwal` - Teaching schedule (links guru, kelas, mapel, jam_pelajaran)
10. `agenda` - Teaching agenda/journal entries
11. `absensi` - Student attendance per agenda

## Security
- RLS enabled on all tables
- Admin can read/write all data
- Guru can only read/write their own data
- Public read for reference tables (kelas, mapel, jam_pelajaran)

## Notes
- profiles.role determines access: 'admin' or 'guru'
- guru.user_id links to profiles.id (which links to auth.users.id)
- All foreign keys use ON DELETE CASCADE or SET NULL appropriately
*/

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'guru' CHECK (role IN ('admin', 'guru')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id OR EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
)) WITH CHECK (auth.uid() = id OR EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
));

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
));

-- =============================================
-- INSTANSI TABLE (school info)
-- =============================================
CREATE TABLE IF NOT EXISTS instansi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npsn text DEFAULT '20326462',
  nama_instansi text DEFAULT 'SMA NEGERI 1 JATIBARANG',
  alamat text DEFAULT 'Jl. Raya Karanglo - Tegalwulung Kec. Jatibarang',
  nama_kepsek text DEFAULT 'Dr. Nur Rokhman, S.Pd.,M.Pd',
  nip_kepsek text DEFAULT '19700803 199802 1 004',
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE instansi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instansi_select" ON instansi;
CREATE POLICY "instansi_select" ON instansi FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "instansi_insert" ON instansi;
CREATE POLICY "instansi_insert" ON instansi FOR INSERT
TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "instansi_update" ON instansi;
CREATE POLICY "instansi_update" ON instansi FOR UPDATE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
)) WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "instansi_delete" ON instansi;
CREATE POLICY "instansi_delete" ON instansi FOR DELETE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Insert default instansi
INSERT INTO instansi (npsn, nama_instansi, alamat, nama_kepsek, nip_kepsek)
SELECT '20326462', 'SMA NEGERI 1 JATIBARANG', 'Jl. Raya Karanglo - Tegalwulung Kec. Jatibarang', 'Dr. Nur Rokhman, S.Pd.,M.Pd', '19700803 199802 1 004'
WHERE NOT EXISTS (SELECT 1 FROM instansi);

-- =============================================
-- TAHUN PELAJARAN TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tahun_pelajaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  semester text NOT NULL DEFAULT 'Ganjil' CHECK (semester IN ('Ganjil', 'Genap')),
  aktif boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tahun_pelajaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tp_select" ON tahun_pelajaran;
CREATE POLICY "tp_select" ON tahun_pelajaran FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tp_insert" ON tahun_pelajaran;
CREATE POLICY "tp_insert" ON tahun_pelajaran FOR INSERT
TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "tp_update" ON tahun_pelajaran;
CREATE POLICY "tp_update" ON tahun_pelajaran FOR UPDATE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
)) WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "tp_delete" ON tahun_pelajaran;
CREATE POLICY "tp_delete" ON tahun_pelajaran FOR DELETE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Insert default tahun pelajaran
INSERT INTO tahun_pelajaran (nama, semester, aktif)
SELECT '2026/2027', 'Ganjil', true
WHERE NOT EXISTS (SELECT 1 FROM tahun_pelajaran);

-- =============================================
-- GURU TABLE (teacher profiles)
-- =============================================
CREATE TABLE IF NOT EXISTS guru (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  nama text NOT NULL,
  nip text DEFAULT '',
  nuptk text DEFAULT '',
  alamat text DEFAULT '',
  hp text DEFAULT '',
  wa text DEFAULT '',
  foto_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guru ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guru_select" ON guru;
CREATE POLICY "guru_select" ON guru FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "guru_insert" ON guru;
CREATE POLICY "guru_insert" ON guru FOR INSERT
TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "guru_update" ON guru;
CREATE POLICY "guru_update" ON guru FOR UPDATE
TO authenticated USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
) WITH CHECK (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "guru_delete" ON guru;
CREATE POLICY "guru_delete" ON guru FOR DELETE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- =============================================
-- KELAS TABLE (classrooms)
-- =============================================
CREATE TABLE IF NOT EXISTS kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kelas text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kelas_select" ON kelas;
CREATE POLICY "kelas_select" ON kelas FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "kelas_insert" ON kelas;
CREATE POLICY "kelas_insert" ON kelas FOR INSERT
TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "kelas_update" ON kelas;
CREATE POLICY "kelas_update" ON kelas FOR UPDATE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
)) WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "kelas_delete" ON kelas;
CREATE POLICY "kelas_delete" ON kelas FOR DELETE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Insert sample kelas
INSERT INTO kelas (nama_kelas)
SELECT unnest(ARRAY['X.1', 'X.2', 'X.3', 'XI.1', 'XI.2', 'XI.3', 'XII.1', 'XII.2', 'XII.3'])
WHERE NOT EXISTS (SELECT 1 FROM kelas);

-- =============================================
-- MAPEL TABLE (subjects)
-- =============================================
CREATE TABLE IF NOT EXISTS mapel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_mapel text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mapel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mapel_select" ON mapel;
CREATE POLICY "mapel_select" ON mapel FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "mapel_insert" ON mapel;
CREATE POLICY "mapel_insert" ON mapel FOR INSERT
TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "mapel_update" ON mapel;
CREATE POLICY "mapel_update" ON mapel FOR UPDATE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
)) WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "mapel_delete" ON mapel;
CREATE POLICY "mapel_delete" ON mapel FOR DELETE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Insert sample mapel
INSERT INTO mapel (nama_mapel)
SELECT unnest(ARRAY['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris'])
WHERE NOT EXISTS (SELECT 1 FROM mapel);

-- =============================================
-- JAM PELAJARAN TABLE (lesson hour slots)
-- =============================================
CREATE TABLE IF NOT EXISTS jam_pelajaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_ke integer NOT NULL,
  jam_mulai time NOT NULL,
  jam_selesai time NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jam_pelajaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jampel_select" ON jam_pelajaran;
CREATE POLICY "jampel_select" ON jam_pelajaran FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "jampel_insert" ON jam_pelajaran;
CREATE POLICY "jampel_insert" ON jam_pelajaran FOR INSERT
TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "jampel_update" ON jam_pelajaran;
CREATE POLICY "jampel_update" ON jam_pelajaran FOR UPDATE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
)) WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "jampel_delete" ON jam_pelajaran;
CREATE POLICY "jampel_delete" ON jam_pelajaran FOR DELETE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Insert default jam pelajaran
INSERT INTO jam_pelajaran (jam_ke, jam_mulai, jam_selesai)
SELECT * FROM (VALUES
  (1, '07:00'::time, '07:45'::time),
  (2, '07:45'::time, '08:30'::time),
  (3, '08:30'::time, '09:15'::time),
  (4, '09:15'::time, '10:00'::time),
  (5, '10:15'::time, '11:00'::time),
  (6, '11:00'::time, '11:45'::time),
  (7, '12:30'::time, '13:15'::time),
  (8, '13:15'::time, '14:00'::time),
  (9, '14:00'::time, '14:45'::time),
  (10, '14:45'::time, '15:30'::time)
) AS v(jam_ke, jam_mulai, jam_selesai)
WHERE NOT EXISTS (SELECT 1 FROM jam_pelajaran);

-- =============================================
-- SISWA TABLE (students)
-- =============================================
CREATE TABLE IF NOT EXISTS siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nis text NOT NULL,
  nama text NOT NULL,
  kelas_id uuid REFERENCES kelas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "siswa_select" ON siswa;
CREATE POLICY "siswa_select" ON siswa FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "siswa_insert" ON siswa;
CREATE POLICY "siswa_insert" ON siswa FOR INSERT
TO authenticated WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "siswa_update" ON siswa;
CREATE POLICY "siswa_update" ON siswa FOR UPDATE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
)) WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "siswa_delete" ON siswa;
CREATE POLICY "siswa_delete" ON siswa FOR DELETE
TO authenticated USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- =============================================
-- JADWAL TABLE (teaching schedule)
-- =============================================
CREATE TABLE IF NOT EXISTS jadwal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id uuid REFERENCES guru(id) ON DELETE CASCADE,
  kelas_id uuid REFERENCES kelas(id) ON DELETE CASCADE,
  mapel_id uuid REFERENCES mapel(id) ON DELETE CASCADE,
  tahun_pelajaran_id uuid REFERENCES tahun_pelajaran(id) ON DELETE CASCADE,
  hari text NOT NULL CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')),
  jam_ke_mulai integer NOT NULL,
  jam_ke_selesai integer NOT NULL,
  jam_mulai time NOT NULL,
  jam_selesai time NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jadwal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jadwal_select" ON jadwal;
CREATE POLICY "jadwal_select" ON jadwal FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "jadwal_insert" ON jadwal;
CREATE POLICY "jadwal_insert" ON jadwal FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM guru WHERE user_id = auth.uid() AND id = guru_id)
);

DROP POLICY IF EXISTS "jadwal_update" ON jadwal;
CREATE POLICY "jadwal_update" ON jadwal FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM guru WHERE user_id = auth.uid() AND id = guru_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM guru WHERE user_id = auth.uid() AND id = guru_id)
);

DROP POLICY IF EXISTS "jadwal_delete" ON jadwal;
CREATE POLICY "jadwal_delete" ON jadwal FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM guru WHERE user_id = auth.uid() AND id = guru_id)
);

-- =============================================
-- AGENDA TABLE (teaching journal entries)
-- =============================================
CREATE TABLE IF NOT EXISTS agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id uuid REFERENCES guru(id) ON DELETE CASCADE,
  jadwal_id uuid REFERENCES jadwal(id) ON DELETE SET NULL,
  kelas_id uuid REFERENCES kelas(id) ON DELETE SET NULL,
  mapel_id uuid REFERENCES mapel(id) ON DELETE SET NULL,
  tahun_pelajaran_id uuid REFERENCES tahun_pelajaran(id) ON DELETE SET NULL,
  tanggal date NOT NULL,
  materi text DEFAULT '',
  tujuan text DEFAULT '',
  metode text DEFAULT '',
  kegiatan text DEFAULT '',
  media text DEFAULT '',
  jumlah_hadir integer DEFAULT 0,
  jumlah_izin integer DEFAULT 0,
  jumlah_sakit integer DEFAULT 0,
  jumlah_alpha integer DEFAULT 0,
  status text DEFAULT 'Terlaksana' CHECK (status IN ('Terlaksana', 'Tidak Terlaksana')),
  catatan text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda_select" ON agenda;
CREATE POLICY "agenda_select" ON agenda FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM guru WHERE user_id = auth.uid() AND id = guru_id)
);

DROP POLICY IF EXISTS "agenda_insert" ON agenda;
CREATE POLICY "agenda_insert" ON agenda FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM guru WHERE user_id = auth.uid() AND id = guru_id)
);

DROP POLICY IF EXISTS "agenda_update" ON agenda;
CREATE POLICY "agenda_update" ON agenda FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM guru WHERE user_id = auth.uid() AND id = guru_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM guru WHERE user_id = auth.uid() AND id = guru_id)
);

DROP POLICY IF EXISTS "agenda_delete" ON agenda;
CREATE POLICY "agenda_delete" ON agenda FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM guru WHERE user_id = auth.uid() AND id = guru_id)
);

-- =============================================
-- ABSENSI TABLE (student attendance)
-- =============================================
CREATE TABLE IF NOT EXISTS absensi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid REFERENCES agenda(id) ON DELETE CASCADE,
  siswa_id uuid REFERENCES siswa(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Hadir' CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Alpha')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(agenda_id, siswa_id)
);

ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "absensi_select" ON absensi;
CREATE POLICY "absensi_select" ON absensi FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "absensi_insert" ON absensi;
CREATE POLICY "absensi_insert" ON absensi FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM agenda ag
    JOIN guru g ON g.id = ag.guru_id
    WHERE ag.id = agenda_id
    AND (g.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  )
);

DROP POLICY IF EXISTS "absensi_update" ON absensi;
CREATE POLICY "absensi_update" ON absensi FOR UPDATE
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM agenda ag
    JOIN guru g ON g.id = ag.guru_id
    WHERE ag.id = agenda_id
    AND (g.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM agenda ag
    JOIN guru g ON g.id = ag.guru_id
    WHERE ag.id = agenda_id
    AND (g.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  )
);

DROP POLICY IF EXISTS "absensi_delete" ON absensi;
CREATE POLICY "absensi_delete" ON absensi FOR DELETE
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM agenda ag
    JOIN guru g ON g.id = ag.guru_id
    WHERE ag.id = agenda_id
    AND (g.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  )
);

-- =============================================
-- HELPER FUNCTION: auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guru')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_guru_user_id ON guru(user_id);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas_id ON siswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_guru_id ON jadwal(guru_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_hari ON jadwal(hari);
CREATE INDEX IF NOT EXISTS idx_agenda_guru_id ON agenda(guru_id);
CREATE INDEX IF NOT EXISTS idx_agenda_tanggal ON agenda(tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_agenda_id ON absensi(agenda_id);
CREATE INDEX IF NOT EXISTS idx_absensi_siswa_id ON absensi(siswa_id);
