import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import type { Instansi } from '../lib/types';

export default function LoginPage() {
  const { signIn, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [instansi, setInstansi] = useState<Instansi | null>(null);

  useEffect(() => {
    const fetchInstansi = async () => {
      const { data } = await supabase.from('instansi').select('*').maybeSingle();
      if (data) setInstansi(data);
    };
    fetchInstansi();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Email dan password wajib diisi', 'error');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      showToast('Email atau password salah', 'error');
    } else {
      showToast('Login berhasil', 'success');
    }
  };

  // Redirect after profile is loaded
  React.useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') navigate('/admin', { replace: true });
      else navigate('/guru', { replace: true });
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-100 flex">
      {/* Left: Login Form */}
      <div className="w-full max-w-sm flex flex-col justify-center px-10 py-12 bg-white/90 backdrop-blur-sm shadow-2xl z-10">
        {/* Jateng Logo + School Logo — left-aligned above "Login" */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/Logo_Provinsi_Jateng.png"
            alt="Logo Provinsi Jawa Tengah"
            className="w-12 h-12 object-contain"
          />
          {instansi?.logo_url ? (
            <img
              src={instansi.logo_url}
              alt="Logo Sekolah"
              className="w-12 h-12 object-contain"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 border-4 border-blue-200 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">Login Jurnal Guru</h1>
        <p className="text-sm text-gray-500 mb-7">{instansi?.nama_instansi ?? 'SMA Negeri 1 Jatibarang'}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-10 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Masuk...</>
            ) : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-400">
          &copy; 2026. Design By{' '}
          <span className="text-blue-500 font-medium">IT SMAN 1 Jatibarang</span>
        </p>
      </div>

      {/* Right: Decorative Panel */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative circles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-300/20 border border-blue-300/30"
            style={{
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              top: `${10 + Math.sin(i) * 15}%`,
              left: `${10 + Math.cos(i) * 20}%`,
            }}
          />
        ))}

        {/* Dot grids */}
        <div className="absolute top-8 right-8 grid grid-cols-6 gap-2">
          {[...Array(36)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-blue-500/30" />
          ))}
        </div>
        <div className="absolute bottom-8 left-8 grid grid-cols-6 gap-2">
          {[...Array(36)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-blue-500/30" />
          ))}
        </div>

        {/* Big blue semicircle */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-600 rounded-t-full flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-32 h-20 bg-blue-400 rounded-lg flex items-center justify-center mb-2">
              <div className="w-24 h-14 bg-gray-800 rounded flex items-center justify-center">
                <div className="text-green-400 font-mono text-xs">&lt;/&gt;</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top: school logo + welcome text */}
        <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-8 z-10 px-8">
          {/* School logo above welcome text */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/30 border-4 border-white/50 overflow-hidden mb-4">
            {instansi?.logo_url ? (
              <img
                src={instansi.logo_url}
                alt="Logo Sekolah"
                className="w-20 h-20 object-contain"
              />
            ) : (
              <GraduationCap className="w-10 h-10 text-blue-700" />
            )}
          </div>
          <p className="text-red-600 font-semibold text-lg mb-1">Selamat Datang!</p>
          <h2 className="text-red-600 font-bold text-2xl mb-1 text-center">
            Aplikasi Jadwal dan Agenda Mengajar
          </h2>
          <h3 className="text-red-600 font-bold text-xl mb-1 text-center">{instansi?.nama_instansi ?? 'SMA NEGERI 1 JATIBARANG'}</h3>
          <p className="text-red-500 font-semibold">Tahun Pelajaran 2026/2027</p>
        </div>
      </div>
    </div>
  );
}
