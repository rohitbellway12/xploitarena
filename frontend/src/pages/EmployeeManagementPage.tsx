import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  Users, UserPlus, Search, Trash2, Edit2,
  ToggleLeft, ToggleRight, X, ShieldCheck, CheckSquare, Square
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  customRole?: { id: string; name: string };
}

interface CustomRole {
  id: string;
  name: string;
}

const defaultForm = { email: '', firstName: '', lastName: '', password: '', customRoleId: '' };

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, roleRes] = await Promise.all([
        api.get('/employees'),
        api.get('/rbac/my-roles'),
      ]);
      setEmployees(empRes.data);
      setRoles(roleRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setFormData(defaultForm); setShowModal(true); };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setFormData({ email: e.email, firstName: e.firstName, lastName: e.lastName, password: '', customRoleId: e.customRole?.id || '' });
    setShowModal(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/employees/${editing.id}`, formData);
        toast.success('Employee updated');
      } else {
        await api.post('/employees', formData);
        toast.success('Employee created');
      }
      setShowModal(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/employees/${id}/toggle-status`);
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e));
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this employee permanently?')) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee removed');
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleBulkToggle = async (isActive: boolean) => {
    if (!selectedIds.length) return;
    setBulkLoading(true);
    try {
      await api.patch('/employees/bulk/toggle-status', { employeeIds: selectedIds, isActive });
      toast.success(`Updated ${selectedIds.length} employees`);
      setSelectedIds([]);
      fetchAll();
    } catch { toast.error('Bulk action failed'); }
    finally { setBulkLoading(false); }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () =>
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(e => e.id));

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500 text-white uppercase tracking-wider">Team</span>
              <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">/ Employees</span>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-400" />
              Employee Management
            </h1>
          </div>

          {/* Bulk Action Bar */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-[100] bg-slate-900 border border-violet-500/30 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-[9px] font-bold text-white">{selectedIds.length}</div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Selected</span>
                </div>
                <div className="h-5 w-px bg-slate-700" />
                <div className="flex items-center gap-2">
                  <button disabled={bulkLoading} onClick={() => handleBulkToggle(true)} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all">Activate</button>
                  <button disabled={bulkLoading} onClick={() => handleBulkToggle(false)} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-500/20 transition-all">Suspend</button>
                  <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
              <input
                type="text" placeholder="Search employees..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm focus:outline-none focus:border-violet-500/50 w-full md:w-64 transition-all"
              />
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-violet-600/20 active:scale-95">
              <UserPlus className="w-4 h-4" /> Add Employee
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-[hsl(var(--text-muted))] border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-main))]/[0.02]">
                  <th className="p-4 w-10">
                    <button onClick={toggleAll} className="text-[hsl(var(--text-muted))] hover:text-violet-400 transition-colors">
                      {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="p-4 font-bold uppercase tracking-wider">Employee</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Email</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Role</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[hsl(var(--text-main))] divide-y divide-[hsl(var(--border-subtle))]">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="p-4"><div className="h-10 bg-[hsl(var(--border-subtle))] rounded-xl w-full" /></td>
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map(emp => (
                    <tr key={emp.id} className={`hover:bg-violet-500/[0.02] transition-colors group ${selectedIds.includes(emp.id) ? 'bg-violet-500/[0.04]' : ''}`}>
                      <td className="p-4">
                        <button onClick={() => toggleSelect(emp.id)} className="text-[hsl(var(--text-muted))] hover:text-violet-400 transition-colors">
                          {selectedIds.includes(emp.id) ? <CheckSquare className="w-4 h-4 text-violet-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-400 border border-violet-500/20 group-hover:scale-110 transition-transform">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <div className="font-semibold">{emp.firstName} {emp.lastName}</div>
                            <div className="text-[10px] text-[hsl(var(--text-muted))] uppercase font-bold tracking-wider">ID: {emp.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-[hsl(var(--text-muted))]">{emp.email}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-violet-400/60" />
                          <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-black tracking-widest border border-violet-500/20 uppercase">
                            {emp.customRole?.name || emp.role}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase flex w-fit items-center gap-1.5 border ${emp.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {emp.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(emp)} className="p-2 text-[hsl(var(--text-muted))] hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggle(emp.id)} className={`p-2 rounded-lg transition-all ${emp.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-500/10'}`} title={emp.isActive ? 'Deactivate' : 'Activate'}>
                            {emp.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button onClick={() => handleDelete(emp.id)} className="p-2 text-[hsl(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-40">
                        <Users className="w-12 h-12" />
                        <p className="font-bold">No employees found</p>
                        <p className="text-xs text-[hsl(var(--text-muted))]">Click "Add Employee" to create your first team member</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2.5rem] shadow-2xl p-8 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl" />

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[hsl(var(--text-main))] tracking-tight">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
                    <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Team Member Setup</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[hsl(var(--text-main))]/[0.05] rounded-full transition-colors">
                  <X className="w-5 h-5 text-[hsl(var(--text-muted))]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">First Name</label>
                    <input required type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-violet-500/50 transition-all" placeholder="John" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">Last Name</label>
                    <input required type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-violet-500/50 transition-all" placeholder="Doe" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-violet-500/50 transition-all" placeholder="john@company.com" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">Password {editing && '(leave blank to keep current)'}</label>
                  <input required={!editing} type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-violet-500/50 transition-all" placeholder="Min. 8 characters" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">Assigned Role</label>
                  <select value={formData.customRoleId} onChange={e => setFormData({ ...formData, customRoleId: e.target.value })} className="w-full px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer">
                    <option value="">Standard (Inherit all permissions)</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-600/20 transition-all disabled:opacity-50">
                    {submitting ? 'Saving...' : editing ? 'Update' : 'Create Employee'}
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
