import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Users, UserPlus, X, ShieldCheck, Search, Trash2, Shield, Edit2 } from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  customRole?: { id: string; name: string };
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: { permission: { id: string; name: string; key: string } }[];
}

export default function ResearcherTeamsPage() {
  const [tab, setTab] = useState<'members' | 'roles'>('members');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [members, setMembers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState({ email: '', firstName: '', lastName: '', password: '', roleId: '' });
  const [editForm, setEditForm]   = useState({ firstName: '', lastName: '', email: '', roleId: '', password: '' });

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissionIds: [] as string[] });
  const [permSearch, setPermSearch] = useState('');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editRoleForm, setEditRoleForm] = useState({ name: '', description: '', permissionIds: [] as string[] });
  const [editPermSearch, setEditPermSearch] = useState('');

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isRoot = !currentUser?.parentId;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [memberRes, roleRes, permRes] = await Promise.all([
        api.get('/team'),
        api.get('/rbac/my-roles'),
        api.get('/rbac/permissions'),
      ]);
      setMembers(memberRes.data);
      setRoles(roleRes.data);
      setAllPermissions(permRes.data);
    } catch {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (m: Member) => {
    setEditingMember(m);
    setEditForm({
      firstName: m.firstName,
      lastName:  m.lastName,
      email:     m.email,
      roleId:    m.customRole?.id || '',
      password:  '',
    });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/team/add', newMember);
      toast.success('Member added successfully');
      setShowAddModal(false);
      setNewMember({ email: '', firstName: '', lastName: '', password: '', roleId: '' });
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const payload: any = {
        firstName: editForm.firstName,
        lastName:  editForm.lastName,
        email:     editForm.email,
        roleId:    editForm.roleId || null,
      };
      if (editForm.password) payload.password = editForm.password;

      await api.patch(`/team/${editingMember.id}`, payload);
      toast.success('Member updated successfully');
      setEditingMember(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update member');
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Remove this member? Their account will be deleted.')) return;
    try {
      await api.delete(`/team/${id}`);
      toast.success('Member removed');
      fetchAll();
    } catch { toast.error('Failed to remove member'); }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roleForm.permissionIds.length === 0) { toast.error('Select at least one permission'); return; }
    try {
      await api.post('/rbac/create-role', roleForm);
      toast.success('Role created');
      setShowRoleModal(false);
      setRoleForm({ name: '', description: '', permissionIds: [] });
      fetchAll();
    } catch { toast.error('Failed to create role'); }
  };

  const openEditRole = (r: Role) => {
    setEditingRole(r);
    setEditRoleForm({
      name: r.name,
      description: r.description || '',
      permissionIds: r.permissions.map(p => p.permission.id),
    });
    setEditPermSearch('');
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    if (editRoleForm.permissionIds.length === 0) { toast.error('Select at least one permission'); return; }
    try {
      await api.patch(`/rbac/roles/${editingRole.id}`, editRoleForm);
      toast.success('Role updated successfully');
      setEditingRole(null);
      fetchAll();
    } catch { toast.error('Failed to update role'); }
  };

  const togglePerm = (id: string) => setRoleForm(p => ({
    ...p,
    permissionIds: p.permissionIds.includes(id) ? p.permissionIds.filter(x => x !== id) : [...p.permissionIds, id]
  }));

  const toggleEditPerm = (id: string) => setEditRoleForm(p => ({
    ...p,
    permissionIds: p.permissionIds.includes(id) ? p.permissionIds.filter(x => x !== id) : [...p.permissionIds, id]
  }));

  const filteredMembers = members.filter(m =>
    `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'w-full px-3 py-2.5 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm focus:outline-none focus:border-indigo-500/50 transition-all';
  const labelCls = 'text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest';

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              Team Management
            </h1>
            <p className="text-[hsl(var(--text-muted))] text-sm mt-0.5">Manage your team members and access roles.</p>
          </div>
          {isRoot && (
            <div className="flex gap-3">
              {tab === 'roles' && (
                <button onClick={() => setShowRoleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] hover:border-indigo-500/40 rounded-xl text-sm font-semibold transition-all">
                  <Shield className="w-4 h-4 text-indigo-400" /> Create Role
                </button>
              )}
              {tab === 'members' && (
                <button onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all">
                  <UserPlus className="w-4 h-4" /> Add Member
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl p-1">
            {([
              { key: 'members', label: 'Members', count: members.length },
              { key: 'roles',   label: 'Roles',   count: roles.length },
            ] as const).map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.key ? 'bg-indigo-500 text-white shadow' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))]'
                }`}>
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-white/25 text-white' : 'bg-[hsl(var(--border-subtle))]'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
            <input type="text" placeholder={tab === 'members' ? 'Search members...' : 'Search roles...'}
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm focus:outline-none focus:border-indigo-500/50 transition-all" />
          </div>
        </div>

        {/* Table */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden shadow-sm">

              {/* MEMBERS TABLE */}
              {tab === 'members' && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-main))]/[0.02]">
                      <th className="px-6 py-4">Member</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      {isRoot && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border-subtle))] text-sm">
                    {loading ? (
                      Array(3).fill(0).map((_, i) => (
                        <tr key={i}><td colSpan={isRoot ? 4 : 3} className="px-6 py-4">
                          <div className="h-8 rounded-xl bg-[hsl(var(--border-subtle))]/50 animate-pulse" />
                        </td></tr>
                      ))
                    ) : filteredMembers.length > 0 ? filteredMembers.map(m => (
                      <tr key={m.id} className="hover:bg-[hsl(var(--bg-main))]/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 border border-indigo-500/20 shrink-0">
                              {m.firstName[0]}{m.lastName[0]}
                            </div>
                            <p className="font-semibold text-[hsl(var(--text-main))]">{m.firstName} {m.lastName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[hsl(var(--text-muted))]">{m.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black border border-indigo-500/20 uppercase tracking-wider">
                            {m.customRole?.name || 'Standard Member'}
                          </span>
                        </td>
                        {isRoot && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEdit(m)}
                                className="p-2 text-[hsl(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                title="Edit member">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleRemoveMember(m.id)}
                                className="p-2 text-[hsl(var(--text-muted))] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                title="Remove member">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr><td colSpan={isRoot ? 4 : 3} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center gap-3 text-[hsl(var(--text-muted))] opacity-40">
                          <Users className="w-10 h-10" />
                          <p className="font-bold">{search ? `No results for "${search}"` : 'No team members yet'}</p>
                        </div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* ROLES TABLE */}
              {tab === 'roles' && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-main))]/[0.02]">
                      <th className="px-6 py-4">Role Name</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Permissions</th>
                      {isRoot && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border-subtle))] text-sm">
                    {loading ? (
                      Array(2).fill(0).map((_, i) => (
                        <tr key={i}><td colSpan={3} className="px-6 py-4">
                          <div className="h-8 rounded-xl bg-[hsl(var(--border-subtle))]/50 animate-pulse" />
                        </td></tr>
                      ))
                    ) : roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).length > 0
                      ? roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map(r => (
                      <tr key={r.id} className="hover:bg-[hsl(var(--bg-main))]/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="font-semibold text-[hsl(var(--text-main))]">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[hsl(var(--text-muted))]">{r.description || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {r.permissions.slice(0, 4).map(p => (
                              <span key={p.permission.id} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[9px] font-black border border-indigo-500/20 uppercase">
                                {p.permission.key.split(':').pop()}
                              </span>
                            ))}
                            {r.permissions.length > 4 && (
                              <span className="text-[9px] text-[hsl(var(--text-muted))]">+{r.permissions.length - 4} more</span>
                            )}
                          </div>
                        </td>
                        {isRoot && (
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => openEditRole(r)}
                              className="p-2 text-[hsl(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                              title="Edit role">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr><td colSpan={isRoot ? 4 : 3} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center gap-3 text-[hsl(var(--text-muted))] opacity-40">
                          <ShieldCheck className="w-10 h-10" />
                          <p className="font-bold">{search ? `No results for "${search}"` : 'No roles defined yet'}</p>
                        </div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              )}

            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══ ADD MEMBER MODAL ══ */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              className="relative w-full max-w-md bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
                <h3 className="text-base font-bold text-[hsl(var(--text-main))] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" /> Add New Member
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-[hsl(var(--bg-main))] rounded-lg transition-colors text-[hsl(var(--text-muted))]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelCls}>First Name</label>
                    <input required value={newMember.firstName} onChange={e => setNewMember({...newMember, firstName: e.target.value})} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Last Name</label>
                    <input required value={newMember.lastName} onChange={e => setNewMember({...newMember, lastName: e.target.value})} className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Email</label>
                  <input required type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Password</label>
                  <input required type="password" value={newMember.password} onChange={e => setNewMember({...newMember, password: e.target.value})} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Assign Role</label>
                  <select value={newMember.roleId} onChange={e => setNewMember({...newMember, roleId: e.target.value})} className={`${inputCls} appearance-none`}>
                    <option value="">Standard Member</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm font-semibold hover:bg-[hsl(var(--border-subtle))]/30 transition-all">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all">
                    Add Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ EDIT MEMBER MODAL ══ */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingMember(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              className="relative w-full max-w-md bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl shadow-2xl overflow-hidden">

              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between bg-indigo-500/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-sm font-bold text-indigo-400 border border-indigo-500/20">
                    {editingMember.firstName[0]}{editingMember.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[hsl(var(--text-main))]">Edit Member</h3>
                    <p className="text-[10px] text-[hsl(var(--text-muted))]">{editingMember.email}</p>
                  </div>
                </div>
                <button onClick={() => setEditingMember(null)} className="p-1.5 hover:bg-[hsl(var(--bg-main))] rounded-lg transition-colors text-[hsl(var(--text-muted))]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditMember} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelCls}>First Name</label>
                    <input required value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Last Name</label>
                    <input required value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Email</label>
                  <input required type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Assign Role</label>
                  <select value={editForm.roleId} onChange={e => setEditForm({...editForm, roleId: e.target.value})} className={`${inputCls} appearance-none`}>
                    <option value="">Standard Member</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>New Password <span className="normal-case text-[hsl(var(--text-muted))]/60 font-normal">(leave blank to keep current)</span></label>
                  <input type="password" placeholder="••••••••" value={editForm.password}
                    onChange={e => setEditForm({...editForm, password: e.target.value})} className={inputCls} />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditingMember(null)}
                    className="flex-1 py-2.5 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm font-semibold hover:bg-[hsl(var(--border-subtle))]/30 transition-all">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                    <Edit2 className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ CREATE ROLE MODAL ══ */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRoleModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              className="relative w-full max-w-lg bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between shrink-0">
                <h3 className="text-base font-bold text-[hsl(var(--text-main))] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" /> Create Role
                </h3>
                <button onClick={() => setShowRoleModal(false)} className="p-1.5 hover:bg-[hsl(var(--bg-main))] rounded-lg transition-colors text-[hsl(var(--text-muted))]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateRole} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className={labelCls}>Role Name</label>
                  <input required placeholder="e.g. Junior Analyst" value={roleForm.name}
                    onChange={e => setRoleForm({...roleForm, name: e.target.value})} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Description (optional)</label>
                  <input placeholder="What can this role do?" value={roleForm.description}
                    onChange={e => setRoleForm({...roleForm, description: e.target.value})} className={inputCls} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Permissions</label>
                    <span className="text-[10px] font-bold text-indigo-400">{roleForm.permissionIds.length} selected</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
                    <input type="text" placeholder="Search permissions..." value={permSearch} onChange={e => setPermSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-xs focus:outline-none focus:border-indigo-500/50 transition-all" />
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {allPermissions.filter(p =>
                      p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
                      p.key.toLowerCase().includes(permSearch.toLowerCase())
                    ).map(p => {
                      const on = roleForm.permissionIds.includes(p.id);
                      return (
                        <div key={p.id} onClick={() => togglePerm(p.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${on ? 'bg-indigo-500/10 border-indigo-500/30' : 'border-[hsl(var(--border-subtle))] hover:border-indigo-500/20'}`}>
                          <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all ${on ? 'bg-indigo-600' : 'border-2 border-[hsl(var(--border-subtle))]'}`}>
                            {on && <ShieldCheck className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className={`text-xs font-semibold ${on ? 'text-[hsl(var(--text-main))]' : 'text-[hsl(var(--text-muted))]'}`}>{p.name}</p>
                            <p className="text-[9px] font-mono text-[hsl(var(--text-muted))]/50">{p.key}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowRoleModal(false)}
                    className="flex-1 py-2.5 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm font-semibold hover:bg-[hsl(var(--border-subtle))]/30 transition-all">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all">
                    Create Role
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ EDIT ROLE MODAL ══ */}
      <AnimatePresence>
        {editingRole && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingRole(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              className="relative w-full max-w-lg bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="px-6 py-4 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between bg-indigo-500/[0.03] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[hsl(var(--text-main))]">Edit Role</h3>
                    <p className="text-[10px] text-[hsl(var(--text-muted))]">{editingRole.name}</p>
                  </div>
                </div>
                <button onClick={() => setEditingRole(null)} className="p-1.5 hover:bg-[hsl(var(--bg-main))] rounded-lg transition-colors text-[hsl(var(--text-muted))]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditRole} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className={labelCls}>Role Name</label>
                  <input required value={editRoleForm.name}
                    onChange={e => setEditRoleForm({...editRoleForm, name: e.target.value})}
                    className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Description (optional)</label>
                  <input value={editRoleForm.description}
                    onChange={e => setEditRoleForm({...editRoleForm, description: e.target.value})}
                    className={inputCls} />
                </div>

                {/* Permissions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Permissions</label>
                    <span className="text-[10px] font-bold text-indigo-400">{editRoleForm.permissionIds.length} selected</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
                    <input type="text" placeholder="Search permissions..." value={editPermSearch}
                      onChange={e => setEditPermSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-xs focus:outline-none focus:border-indigo-500/50 transition-all" />
                  </div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {allPermissions
                      .filter(p =>
                        p.name.toLowerCase().includes(editPermSearch.toLowerCase()) ||
                        p.key.toLowerCase().includes(editPermSearch.toLowerCase())
                      )
                      .map(p => {
                        const on = editRoleForm.permissionIds.includes(p.id);
                        return (
                          <div key={p.id} onClick={() => toggleEditPerm(p.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              on ? 'bg-indigo-500/10 border-indigo-500/30' : 'border-[hsl(var(--border-subtle))] hover:border-indigo-500/20'
                            }`}>
                            <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all ${on ? 'bg-indigo-600' : 'border-2 border-[hsl(var(--border-subtle))]'}`}>
                              {on && <ShieldCheck className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className={`text-xs font-semibold ${on ? 'text-[hsl(var(--text-main))]' : 'text-[hsl(var(--text-muted))]'}`}>{p.name}</p>
                              <p className="text-[9px] font-mono text-[hsl(var(--text-muted))]/50">{p.key}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditingRole(null)}
                    className="flex-1 py-2.5 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm font-semibold hover:bg-[hsl(var(--border-subtle))]/30 transition-all">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                    <Edit2 className="w-4 h-4" /> Save Changes
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
