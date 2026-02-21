import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  Shield, Plus, X, ShieldCheck, Search, Trash2, Edit2, CheckSquare, Square, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
}

interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: { permission: Permission }[];
}

const defaultRoleForm = { name: '', description: '', permissionIds: [] as string[] };

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [roleForm, setRoleForm] = useState(defaultRoleForm);
  const [permSearch, setPermSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/rbac/my-roles'),
        api.get('/rbac/permissions'),
      ]);
      setRoles(rolesRes.data);
      setAllPermissions(permsRes.data);
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const grouped = allPermissions
    .filter(p => p.name.toLowerCase().includes(permSearch.toLowerCase()) || p.key.toLowerCase().includes(permSearch.toLowerCase()))
    .reduce((acc: Record<string, Permission[]>, p) => {
      const cat = p.key.split(':')[0] || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});

  const openCreate = () => {
    setEditingRole(null);
    setRoleForm(defaultRoleForm);
    setShowEditor(true);
  };

  const openEdit = (role: CustomRole) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map(p => p.permission.id),
    });
    setShowEditor(true);
  };

  const togglePerm = (id: string) =>
    setRoleForm(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id) ? prev.permissionIds.filter(i => i !== id) : [...prev.permissionIds, id],
    }));

  const toggleCategory = (perms: Permission[]) => {
    const ids = perms.map(p => p.id);
    const allSelected = ids.every(id => roleForm.permissionIds.includes(id));
    if (allSelected) {
      setRoleForm(prev => ({ ...prev, permissionIds: prev.permissionIds.filter(id => !ids.includes(id)) }));
    } else {
      const merged = [...new Set([...roleForm.permissionIds, ...ids])];
      setRoleForm(prev => ({ ...prev, permissionIds: merged }));
    }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!roleForm.permissionIds.length) { toast.error('Select at least one permission'); return; }
    setSubmitting(true);
    try {
      if (editingRole) {
        await api.patch(`/rbac/roles/${editingRole.id}`, roleForm);
        toast.success('Role updated');
      } else {
        await api.post('/rbac/create-role', roleForm);
        toast.success('Role created');
      }
      setShowEditor(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this role permanently?')) return;
    try {
      await api.delete(`/rbac/roles/${id}`);
      toast.success('Role deleted');
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cannot delete role in use');
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">RBAC</span>
              <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">/ Roles</span>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-400" />
              Role Management
            </h1>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Define custom permission sets for your team members</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            <Plus className="w-4 h-4" /> New Role
          </button>
        </div>

        {/* Role Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-[hsl(var(--border-subtle))] rounded w-1/2 mb-3" />
                <div className="h-3 bg-[hsl(var(--border-subtle))] rounded w-full mb-2" />
                <div className="h-3 bg-[hsl(var(--border-subtle))] rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl p-16 text-center">
            <div className="flex flex-col items-center gap-3 opacity-40">
              <Shield className="w-12 h-12" />
              <p className="font-bold">No roles configured</p>
              <p className="text-xs text-[hsl(var(--text-muted))]">Create your first role to start assigning permissions</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <motion.div key={role.id} layout className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="font-bold text-sm text-[hsl(var(--text-main))] uppercase tracking-tight">{role.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(role)} className="p-1.5 hover:bg-indigo-500/10 text-indigo-400 rounded-lg transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(role.id)} className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {role.description && (
                  <p className="text-xs text-[hsl(var(--text-muted))] mb-3 leading-relaxed">{role.description}</p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-[hsl(var(--border-subtle))]">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--text-muted))]">{role.permissions.length} permissions</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {role.permissions.slice(0, 4).map(({ permission }) => (
                    <span key={permission.id} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-black border border-indigo-500/20 uppercase tracking-tight">
                      {permission.name}
                    </span>
                  ))}
                  {role.permissions.length > 4 && (
                    <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 text-[9px] font-black border border-slate-500/20">
                      +{role.permissions.length - 4} more
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Role Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditor(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2.5rem] shadow-2xl p-8 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />

              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[hsl(var(--text-main))] tracking-tight">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
                    <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Permission Configuration</p>
                  </div>
                </div>
                <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-[hsl(var(--text-main))]/[0.05] rounded-full transition-colors">
                  <X className="w-5 h-5 text-[hsl(var(--text-muted))]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden gap-4">
                <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">Role Name</label>
                    <input required type="text" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} className="w-full px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all" placeholder="e.g. Finance Admin" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">Description</label>
                    <input type="text" value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} className="w-full px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all" placeholder="Short description..." />
                  </div>
                </div>

                <div className="space-y-2 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">Permissions ({roleForm.permissionIds.length} selected)</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400" />
                      <input type="text" placeholder="Filter..." value={permSearch} onChange={e => setPermSearch(e.target.value)} className="pl-7 pr-3 py-1.5 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-lg text-xs focus:outline-none focus:border-indigo-400 transition-all w-40" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {Object.entries(grouped).map(([category, perms]) => {
                    const allSelected = perms.every(p => roleForm.permissionIds.includes(p.id));
                    const isExpanded = expandedCategory === category;
                    return (
                      <div key={category} className="border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden">
                        <button type="button" onClick={() => setExpandedCategory(isExpanded ? null : category)} className="w-full flex items-center justify-between px-4 py-3 bg-[hsl(var(--bg-main))]/[0.03] hover:bg-indigo-500/[0.02] transition-all">
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={e => { e.stopPropagation(); toggleCategory(perms); }} className="text-[hsl(var(--text-muted))] hover:text-indigo-400 transition-colors">
                              {allSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                            </button>
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">{category}</span>
                            <span className="text-[10px] text-[hsl(var(--text-muted))]">{perms.length} permissions</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[hsl(var(--text-muted))]" /> : <ChevronDown className="w-4 h-4 text-[hsl(var(--text-muted))]" />}
                        </button>
                        {isExpanded && (
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {perms.map(p => {
                              const selected = roleForm.permissionIds.includes(p.id);
                              return (
                                <button key={p.id} type="button" onClick={() => togglePerm(p.id)} className={`p-3 rounded-xl border text-left transition-all ${selected ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-[hsl(var(--bg-main))]/[0.1] border-[hsl(var(--border-subtle))] hover:border-indigo-400/30'}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    {selected ? <CheckSquare className="w-3.5 h-3.5 text-white/80 flex-shrink-0" /> : <Square className="w-3.5 h-3.5 text-[hsl(var(--text-muted))] flex-shrink-0" />}
                                    <p className="text-xs font-bold uppercase tracking-tight">{p.name}</p>
                                  </div>
                                  <p className={`text-[10px] leading-relaxed line-clamp-2 ${selected ? 'text-indigo-100/70' : 'text-[hsl(var(--text-muted))]'}`}>{p.description || p.key}</p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-2 flex-shrink-0">
                  <button type="button" onClick={() => setShowEditor(false)} className="flex-1 px-4 py-3 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50">
                    {submitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
