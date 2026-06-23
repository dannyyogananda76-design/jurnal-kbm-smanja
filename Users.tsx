import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Home, ChevronRight, Loader2, Shield, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/types';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export default function AdminUsers() {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'guru' as 'admin' | 'guru' });
  const [editId, setEditId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ nama: '', email: '', password: '', role: 'guru' });
    setModalOpen(true);
  };

  const openEdit = (p: Profile) => {
    setEditId(p.id);
    setForm({ nama: p.nama, email: p.email, password: '', role: p.role });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.email) {
      showToast('Nama dan email wajib diisi', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const { error } = await supabase
          .from('profiles')
          .update({ nama: form.nama, email: form.email, role: form.role, updated_at: new Date().toISOString() })
          .eq('id', editId);
        if (error) throw error;
        if (form.password) {
          await supabase.auth.admin.updateUserById(editId, { password: form.password });
        }
        showToast('User berhasil diperbarui', 'success');
      } else {
        if (!form.password) {
          showToast('Password wajib diisi untuk user baru', 'error');
          setSaving(false);
          return;
        }
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { nama: form.nama, role: form.role } }
        });
        if (authErr) throw authErr;
        if (authData.user) {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            nama: form.nama,
            email: form.email,
            role: form.role,
          });
        }
        showToast('User berhasil ditambahkan', 'success');
      }
      setModalOpen(false);
      await fetch();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Terjadi kesalahan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('profiles').delete().eq('id', deleteId);
    if (error) { showToast('Gagal menghapus user', 'error'); return; }
    showToast('User berhasil dihapus', 'success');
    setDeleteId(null);
    await fetch();
  };

  const roleBadge = (role: string) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
      ${role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
      {role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {role}
    </span>
  );

  const columns = [
    { key: 'no', label: 'No', width: '60px', render: (_: unknown, i?: number) => (i ?? 0) + 1 },
    { key: 'nama', label: 'Nama' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (row: Profile) => roleBadge(row.role) },
    {
      key: 'actions', label: 'Aksi', width: '120px',
      render: (row: Profile) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Home className="w-4 h-4" />
        <ChevronRight className="w-3 h-3" />
        <span>Data</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-800 font-medium">User</span>
        <span className="ml-auto text-gray-400">Data &gt; User</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Data User</h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah User
          </button>
        </div>
        <div className="p-5">
          <DataTable
            data={profiles as unknown as Record<string, unknown>[]}
            columns={columns as never}
            searchKeys={['nama', 'email', 'role']}
            loading={loading}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit User' : 'Tambah User'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={form.nama}
              onChange={e => setForm({ ...form, nama: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama lengkap"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@sekolah.sch.id"
              disabled={!!editId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editId && <span className="text-gray-400 font-normal">(kosongkan jika tidak ingin mengubah)</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'guru' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="guru">Guru</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Konfirmasi Hapus" size="sm">
        <p className="text-sm text-gray-600 mb-4">Apakah Anda yakin ingin menghapus user ini?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Batal
          </button>
          <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">
            Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
}
