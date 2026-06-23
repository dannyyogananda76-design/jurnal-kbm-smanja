import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, User, CalendarDays, BookOpen, Printer, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, to: '/guru' },
  { label: 'Profile', icon: <User className="w-5 h-5" />, to: '/guru/profil' },
  { label: 'Jadwal Mengajar', icon: <CalendarDays className="w-5 h-5" />, to: '/guru/jadwal' },
  { label: 'Agenda Mengajar', icon: <BookOpen className="w-5 h-5" />, to: '/guru/agenda' },
  { label: 'Cetak Agenda', icon: <Printer className="w-5 h-5" />, to: '/guru/cetak-agenda' },
];

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  const { profile, guru, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (to: string) => location.pathname === to;

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
      <aside className={`fixed top-0 left-0 h-full w-56 bg-white shadow-xl z-30 transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Header */}
        <div className="bg-gray-800 px-4 py-4 text-center">
          <div className="text-white font-bold text-base tracking-wide">JURNAL - GURU</div>
          <button
            className="absolute top-3 right-3 lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors
                ${isActive(item.to)
                  ? 'bg-red-500 text-white'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              {React.cloneElement(item.icon as React.ReactElement, {
                className: `w-5 h-5 ${isActive(item.to) ? 'text-white' : 'text-gray-400'}`
              })}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
          <div className="px-5 py-3 text-xs text-gray-400 font-medium tracking-wider">
            YOGAYASNUR
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Header bar */}
        <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <button
            className="lg:hidden p-1 rounded text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="text-sm text-gray-500 font-medium">
            {guru?.nama || profile?.nama || 'Guru'}
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-3">
            <User className="w-5 h-5 text-gray-500" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-3 px-6 text-center text-xs text-gray-400">
          &copy; 2026, made with ❤️ by <span className="text-blue-500 font-medium">Creative Tim</span> for a better web.
        </footer>
      </div>
    </div>
  );
}
