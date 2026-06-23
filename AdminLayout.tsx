import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarDays,
  Printer, Building2, ChevronDown, ChevronRight, Menu, X, LogOut,
  UserCircle, Bell, Clock, Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to?: string;
  children?: { label: string; to: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, to: '/admin' },
  {
    label: 'Data Master', icon: <BookOpen className="w-5 h-5" />,
    children: [
      { label: 'Instansi', to: '/admin/instansi' },
      { label: 'User', to: '/admin/users' },
      { label: 'Guru', to: '/admin/guru' },
      { label: 'Kelas & Jam Pelajaran', to: '/admin/kelas' },
      { label: 'Siswa & Mata Pelajaran', to: '/admin/siswa' },
    ]
  },
  {
    label: 'Jadwal & Agenda', icon: <CalendarDays className="w-5 h-5" />,
    children: [
      { label: 'Jadwal Mengajar', to: '/admin/jadwal' },
      { label: 'Agenda Mengajar', to: '/admin/agenda' },
    ]
  },
  {
    label: 'Laporan', icon: <Printer className="w-5 h-5" />,
    children: [
      { label: 'Cetak Agenda', to: '/admin/cetak-agenda' },
    ]
  },
  {
    label: 'Import Data', icon: <Upload className="w-5 h-5" />,
    children: [
      { label: 'Import Guru & Siswa', to: '/admin/import' },
    ]
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(['Data Master', 'Jadwal & Agenda', 'Laporan']);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const isActive = (to: string) => location.pathname === to;
  const isParentActive = (children: { to: string }[]) =>
    children.some(c => location.pathname === c.to);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-gray-900 z-30 transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-700">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Admin</div>
            <div className="text-blue-400 font-semibold text-xs">JANDA</div>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <UserCircle className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{profile?.nama || 'Admin'}</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 text-xs">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-2 mb-2">
            Main Navigation
          </div>
          {navItems.map(item => (
            <div key={item.label}>
              {item.to ? (
                <Link
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-sm font-medium
                    ${isActive(item.to)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-sm font-medium
                      ${isParentActive(item.children || [])
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className={`transition-transform ${openMenus.includes(item.label) ? 'rotate-90' : ''}`}>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                  {openMenus.includes(item.label) && item.children && (
                    <div className="ml-4 mb-1 space-y-0.5">
                      {item.children.map(child => (
                        <Link
                          key={child.to}
                          to={child.to}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm
                            ${isActive(child.to)
                              ? 'bg-blue-600 text-white font-medium'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive(child.to) ? 'bg-white' : 'bg-gray-600'}`} />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-blue-700 text-white px-4 py-3 flex items-center gap-4 sticky top-0 z-10 shadow-md">
          <button
            className="lg:hidden p-1 rounded hover:bg-blue-600 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="relative p-1.5 rounded hover:bg-blue-600 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-400 rounded-full" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <UserCircle className="w-6 h-6" />
            <span className="hidden sm:block font-medium">{profile?.nama || 'SuperAdmin'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-3 px-6 flex items-center justify-between text-xs text-gray-400">
          <span>Copyright &copy; 2026. <span className="text-blue-500 font-medium">IT SMA Negeri 1 Jatibarang</span>. All rights reserved.</span>
          <span>Version 1.0</span>
        </footer>
      </div>
    </div>
  );
}
