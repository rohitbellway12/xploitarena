import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Shield, Plus, Trash2, Key, Info, Tag } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
}

export default function PermissionRegistryPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPermission, setNewPermission] = useState({
    key: '',
    name: '',
    description: '',
    category: 'COMPANY'
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/rbac/permissions/all');
      setPermissions(res.data);
    } catch (err) {
      toast.error('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/rbac/permissions', newPermission);
      toast.success('Permission added successfully');
      setShowAddModal(false);
      setNewPermission({ key: '', name: '', description: '', category: 'COMPANY' });
      fetchPermissions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add permission');
    }
  };

  const handleDelete = async (id: string, key: string) => {
    if (!confirm(`Are you sure? Deleting "${key}" might break existing custom roles.`)) return;
    try {
      await api.delete(`/rbac/permissions/${id}`);
      toast.success('Permission deleted');
      fetchPermissions();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-400" />
              Permission Registry
            </h1>
            <p className="text-[hsl(var(--text-muted))] text-sm">Manage global system permissions without scripts</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Permission
          </button>
        </div>

        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                <th className="px-6 py-4">Permission Name & Key</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border-subtle))] text-sm">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center">Loading...</td></tr>
              ) : (
                permissions.map(p => (
                  <tr key={p.id} className="hover:bg-[hsl(var(--text-main))]/[0.01] transition-all">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-[hsl(var(--text-main))] uppercase tracking-tight">{p.name}</p>
                        <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{p.key}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] text-[9px] font-black uppercase tracking-widest text-[hsl(var(--text-muted))]">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[hsl(var(--text-muted))] max-w-xs truncate">
                      {p.description || 'No description provided'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(p.id, p.key)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.02]">
                <h3 className="text-lg font-bold text-[hsl(var(--text-main))] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Define New Permission
                </h3>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest pl-1">Permission Name</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-[hsl(var(--text-muted))]" />
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Export Audit Logs"
                      value={newPermission.name}
                      onChange={(e) => setNewPermission({...newPermission, name: e.target.value})}
                      className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl pl-10 pr-4 py-2 text-sm text-[hsl(var(--text-main))] focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest pl-1">Identifier Key (Constant)</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 w-4 h-4 text-[hsl(var(--text-muted))]" />
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. audit:export"
                      value={newPermission.key}
                      onChange={(e) => setNewPermission({...newPermission, key: e.target.value.toLowerCase().replace(/\s+/g, ':')})}
                      className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl pl-10 pr-4 py-2 text-sm font-mono text-indigo-400 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest pl-1">Target Role Category</label>
                  <select 
                    value={newPermission.category}
                    onChange={(e) => setNewPermission({...newPermission, category: e.target.value})}
                    className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2 text-sm text-[hsl(var(--text-main))] focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="COMPANY">COMPANY</option>
                    <option value="RESEARCHER">RESEARCHER</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest pl-1">Description</label>
                  <div className="relative">
                    <Info className="absolute left-3 top-2.5 w-4 h-4 text-[hsl(var(--text-muted))]" />
                    <textarea 
                      placeholder="What does this permission allow?"
                      value={newPermission.description}
                      onChange={(e) => setNewPermission({...newPermission, description: e.target.value})}
                      className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl pl-10 pr-4 py-2 text-sm text-[hsl(var(--text-main))] focus:outline-none focus:border-indigo-500/50 h-24"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl text-xs font-bold text-[hsl(var(--text-main))] hover:bg-[hsl(var(--text-main))]/[0.1]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-500 rounded-xl text-xs font-bold text-white hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Register Permission
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
