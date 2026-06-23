import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import GuruLayout from './components/layout/GuruLayout';

// Pages
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminGuru from './pages/admin/Guru';
import AdminKelas from './pages/admin/Kelas';
import AdminSiswa from './pages/admin/Siswa';
import AdminJadwal from './pages/admin/Jadwal';
import AdminAgenda from './pages/admin/Agenda';
import AdminCetakAgenda from './pages/admin/CetakAgenda';
import AdminInstansi from './pages/admin/Instansi';
import AdminImport from './pages/admin/Import';

// Guru pages
import GuruDashboard from './pages/guru/Dashboard';
import GuruProfil from './pages/guru/Profil';
import GuruJadwal from './pages/guru/JadwalMengajar';
import GuruAgenda from './pages/guru/AgendaMengajar';
import GuruCetak from './pages/guru/CetakAgenda';

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'admin') return <Navigate to="/guru" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function ProtectedGuru({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  return <GuruLayout>{children}</GuruLayout>;
}

function HomeRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/guru" replace />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Memuat...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup" element={<SetupPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
      <Route path="/admin/instansi" element={<ProtectedAdmin><AdminInstansi /></ProtectedAdmin>} />
      <Route path="/admin/users" element={<ProtectedAdmin><AdminUsers /></ProtectedAdmin>} />
      <Route path="/admin/guru" element={<ProtectedAdmin><AdminGuru /></ProtectedAdmin>} />
      <Route path="/admin/kelas" element={<ProtectedAdmin><AdminKelas /></ProtectedAdmin>} />
      <Route path="/admin/siswa" element={<ProtectedAdmin><AdminSiswa /></ProtectedAdmin>} />
      <Route path="/admin/jadwal" element={<ProtectedAdmin><AdminJadwal /></ProtectedAdmin>} />
      <Route path="/admin/agenda" element={<ProtectedAdmin><AdminAgenda /></ProtectedAdmin>} />
      <Route path="/admin/cetak-agenda" element={<ProtectedAdmin><AdminCetakAgenda /></ProtectedAdmin>} />
      <Route path="/admin/import" element={<ProtectedAdmin><AdminImport /></ProtectedAdmin>} />

      {/* Guru Routes */}
      <Route path="/guru" element={<ProtectedGuru><GuruDashboard /></ProtectedGuru>} />
      <Route path="/guru/profil" element={<ProtectedGuru><GuruProfil /></ProtectedGuru>} />
      <Route path="/guru/jadwal" element={<ProtectedGuru><GuruJadwal /></ProtectedGuru>} />
      <Route path="/guru/agenda" element={<ProtectedGuru><GuruAgenda /></ProtectedGuru>} />
      <Route path="/guru/cetak-agenda" element={<ProtectedGuru><GuruCetak /></ProtectedGuru>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
