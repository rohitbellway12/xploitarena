import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Users,
  UserPlus, 
  X, 
  ShieldCheck, 
  Search, 
  Trash2, 
  Plus, 
  Shield,
  ToggleLeft,
  ToggleRight,
  Edit2
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface AdminMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  customRole?: {
    id: string;
    name: string;
  };
}

interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: {
    permission: {
      id: string;
      name: string;
      description: string;
    }
  }[];
}

export default function AdminTeamPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'members' | 'architect'>('members');
  const [editingMember, setEditingMember] = useState<AdminMember | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Create/Edit Role State
  const [editingRole, setEditingRole] = useState<any>(null);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[]
  });

  // Group permissions by category (prefix before colon)
  const groupedPermissions = allPermissions.reduce((acc: any, p: any) => {
    const category = p.key.split(':')[0] || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(p);
    return acc;
  }, {});

  const filteredPermissions = (perms: any[]) => perms.filter(p => 
    p.name.toLowerCase().includes(permissionSearch.toLowerCase()) || 
    p.key.toLowerCase().includes(permissionSearch.toLowerCase())
  );

  // Create Member Form State
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    customRoleId: ''
  });

  const selectedRole = roles.find(r => r.id === formData.customRoleId);

  useEffect(() => {
    fetchTeam();
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await api.get('/admin/team');
      setMembers(response.data);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/rbac/my-roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/rbac/permissions');
      setAllPermissions(response.data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await api.patch(`/admin/team/${editingMember.id}`, formData);
        toast.success('Member updated');
      } else {
        await api.post('/admin/team', formData);
        toast.success('Team member created');
      }
      setShowCreateModal(false);
      setEditingMember(null);
      setFormData({ email: '', firstName: '', lastName: '', password: '', customRoleId: '' });
      fetchTeam();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/admin/team/${id}/toggle-status`);
      toast.success('Status updated');
      fetchTeam();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently remove this team member?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Member removed');
      fetchTeam();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete member');
    }
  };

  const filteredMembers = members.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBulkToggleStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    
    setBulkLoading(true);
    try {
      await api.patch('/admin/users/bulk-toggle-status', { 
        userIds: selectedIds,
        isActive 
      });
      
      toast.success(`Updated ${selectedIds.length} members`);
      setSelectedIds([]);
      fetchTeam();
    } catch (error: any) {
      console.error('Bulk Toggle Status Error:', error);
      toast.error(error.response?.data?.message || 'Failed to update members');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers.map(m => m.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roleFormData.permissionIds.length === 0) {
      toast.error('Select at least one permission');
      return;
    }
    try {
      if (editingRole) {
        await api.patch(`/rbac/roles/${editingRole.id}`, roleFormData);
        toast.success('Protocol updated');
      } else {
        await api.post('/rbac/create-role', roleFormData);
        toast.success('Protocol deployed');
      }
      setView('members');
      setEditingRole(null);
      setRoleFormData({ name: '', description: '', permissionIds: [] });
      fetchRoles();
    } catch (error) {
      toast.error('Deployment failed');
    }
  };

  const startEditRole = (role: CustomRole) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map(p => p.permission.id)
    });
  };


  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {view === 'members' ? (
          <>
            {/* Team Members List View */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
              <div className="flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                   <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">Internal</span>
                   <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">/ Admin Hub</span>
                </div>
                <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-400" />
                  Admin Team
                </h1>
              </div>

              <AnimatePresence>
                {selectedIds.length > 0 && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-[100] bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white shadow-lg shadow-indigo-500/20">
                        {selectedIds.length}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Selected</span>
                    </div>
                    
                    <div className="h-5 w-px bg-slate-700"></div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={bulkLoading}
                        onClick={() => handleBulkToggleStatus(true)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        Activate
                      </button>
                      <button 
                        disabled={bulkLoading}
                        onClick={() => handleBulkToggleStatus(false)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-500/20 transition-all disabled:opacity-50"
                      >
                        Suspend
                      </button>
                      <button 
                        onClick={() => setSelectedIds([])}
                        className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[hsl(var(--text-muted))] hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                  <input 
                    type="text" 
                    placeholder="Search employees..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm focus:outline-none focus:border-indigo-500/50 w-full md:w-64 transition-all"
                  />
                </div>
                <button 
                  onClick={() => setView('architect')}
                  className="flex items-center gap-2 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-indigo-500/5 hover:border-indigo-500/30"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Roles
                </button>
                <button 
                  onClick={() => {
                    setEditingMember(null);
                    setFormData({ email: '', firstName: '', lastName: '', password: '', customRoleId: '' });
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
            <div className="relative bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-[hsl(var(--text-muted))] border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-main))]/[0.02]">
                      <th className="p-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
                          onChange={toggleSelectAll}
                          className="rounded border-[hsl(var(--border-subtle))] bg-slate-800 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                        />
                      </th>
                      <th className="p-4 font-bold uppercase tracking-wider">Member</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Login Details</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Assigned Role</th>
                      <th className="p-4 font-bold uppercase tracking-wider">Status</th>
                      <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-[hsl(var(--text-main))] divide-y divide-[hsl(var(--border-subtle))]">
                    {loading ? (
                      Array(3).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="p-4"><div className="h-10 bg-[hsl(var(--border-subtle))] rounded-xl w-full"></div></td>
                        </tr>
                      ))
                    ) : filteredMembers.length > 0 ? (
                      filteredMembers.map((m) => (
                        <tr key={m.id} className={`hover:bg-indigo-500/[0.02] transition-colors group ${selectedIds.includes(m.id) ? 'bg-indigo-500/[0.04]' : ''}`}>
                          <td className="p-4">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(m.id)}
                              onChange={() => toggleSelect(m.id)}
                              className="rounded border-[hsl(var(--border-subtle))] bg-slate-800 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 border border-indigo-500/20 shadow-sm transition-transform group-hover:scale-110">
                                {m.firstName[0]}{m.lastName[0]}
                              </div>
                              <div>
                                <div className="font-semibold">{m.firstName} {m.lastName}</div>
                                <div className="text-[10px] text-[hsl(var(--text-muted))] uppercase font-bold tracking-wider">ID: {m.id.slice(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-medium text-[hsl(var(--text-muted))]">{m.email}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-indigo-400/60" />
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black tracking-widest border border-indigo-500/20 uppercase shadow-sm">
                                {m.customRole?.name || 'Standard Admin'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase flex w-fit items-center gap-1.5 border ${m.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${m.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                              {m.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => {
                                  setEditingMember(m);
                                  setFormData({
                                    email: m.email,
                                    firstName: m.firstName,
                                    lastName: m.lastName,
                                    password: '', // Password usually blank on edit unless we want to reset it
                                    customRoleId: m.customRole?.id || ''
                                  });
                                  setShowCreateModal(true);
                                }}
                                className="p-2 text-[hsl(var(--text-muted))] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                title="Edit Member"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleStatus(m.id)}
                                className={`p-2 rounded-lg transition-all ${m.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-500/10'}`}
                                title={m.isActive ? 'Deactivate Member' : 'Activate Member'}
                              >
                                {m.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                              </button>
                              <button 
                                onClick={() => handleDeleteMember(m.id)}
                                className="p-2 text-[hsl(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                title="Delete Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-[hsl(var(--text-muted))]">
                          <div className="flex flex-col items-center gap-2 opacity-50">
                            <Users className="w-12 h-12" />
                            <p className="font-bold">No team members found.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Role Architect View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setView('members')}
                  className="p-2 hover:bg-indigo-500/10 text-indigo-400 rounded-xl transition-all border border-transparent hover:border-indigo-500/20"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight">Role Architect</h1>
                  <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider">Configure System Permissions</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
              {/* Left Column: Role Registry */}
              <div className="w-full lg:w-80 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-main))]/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Protocols</h3>
                    <button 
                      onClick={() => {
                        setEditingRole(null);
                        setRoleFormData({ name: '', description: '', permissionIds: [] });
                      }}
                      className="p-1.5 hover:bg-indigo-500/10 text-indigo-400 rounded-lg transition-all border border-transparent hover:border-indigo-500/20"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-lg font-bold text-[hsl(var(--text-main))] tracking-tight">Registry</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {roles.map(role => (
                    <button 
                      key={role.id}
                      onClick={() => startEditRole(role)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                        editingRole?.id === role.id 
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' 
                        : 'bg-[hsl(var(--bg-card))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] hover:border-indigo-400/30 hover:bg-indigo-500/[0.02]'
                      }`}
                    >
                      <p className="text-sm font-bold uppercase tracking-tight">{role.name}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Shield className={`w-3.5 h-3.5 ${editingRole?.id === role.id ? 'text-indigo-200' : 'text-indigo-400'}`} />
                        <p className={`text-xs font-bold uppercase tracking-widest ${editingRole?.id === role.id ? 'text-indigo-100' : 'text-[hsl(var(--text-muted))]'}`}>
                          {role.permissions.length} nodes
                        </p>
                      </div>
                    </button>
                  ))}
                  {roles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-30">
                       <Shield className="w-8 h-8 mb-2" />
                       <p className="text-xs font-black uppercase tracking-widest">Empty Registry</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Editor */}
              <div className="flex-1 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between bg-[hsl(var(--bg-main))]/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[hsl(var(--text-main))] uppercase tracking-tight">
                        {editingRole ? 'Edit Protocol' : 'Deploy New Protocol'}
                      </h2>
                      <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Configuration Engine</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  <form onSubmit={handleSaveRole} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-indigo-400 uppercase tracking-widest px-1">Identity Name</label>
                        <input 
                          required type="text" value={roleFormData.name}
                          onChange={(e) => setRoleFormData({...roleFormData, name: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 transition-all outline-none"
                          placeholder="e.g. Master Payout Controller"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Operational Scope</label>
                        <input 
                          type="text" value={roleFormData.description}
                          onChange={(e) => setRoleFormData({...roleFormData, description: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all outline-none"
                          placeholder="Short description..."
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[hsl(var(--border-subtle))] pb-4">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-[hsl(var(--text-main))] uppercase tracking-widest">Capability Nodes</h4>
                          <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Authorization Matrix</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="relative w-full md:w-56">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                             <input 
                               type="text"
                               placeholder="Filter nodes..."
                               value={permissionSearch}
                               onChange={(e) => setPermissionSearch(e.target.value)}
                               className="w-full pl-9 pr-3 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-400 transition-all outline-none"
                             />
                           </div>
                        </div>
                      </div>

                      <div className="space-y-10 pb-20">
                        {Object.entries(groupedPermissions).map(([category, perms]: [string, any]) => {
                          const matchingPerms = filteredPermissions(perms);
                          if (matchingPerms.length === 0) return null;
                          
                          const allSelectedInCategory = matchingPerms.every(p => roleFormData.permissionIds.includes(p.id));
                          
                          const toggleCategory = () => {
                            if (allSelectedInCategory) {
                              setRoleFormData({
                                ...roleFormData,
                                permissionIds: roleFormData.permissionIds.filter(id => !matchingPerms.find(p => p.id === id))
                              });
                            } else {
                              const newIds = [...new Set([...roleFormData.permissionIds, ...matchingPerms.map(p => p.id)])];
                              setRoleFormData({ ...roleFormData, permissionIds: newIds });
                            }
                          };

                          return (
                            <div key={category} className="space-y-4">
                              <div className="flex items-center justify-between">
                                 <h5 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                  {category} System
                                </h5>
                                 <button 
                                   type="button"
                                   onClick={toggleCategory}
                                   className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                                     allSelectedInCategory ? 'text-rose-400 hover:text-rose-500' : 'text-indigo-400 hover:text-indigo-500'
                                   }`}
                                >
                                  {allSelectedInCategory ? 'Purge Category' : 'Authorize Category'}
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {matchingPerms.map((p: any) => {
                                  const isSelected = roleFormData.permissionIds.includes(p.id);
                                  return (
                                    <div 
                                      key={p.id}
                                      onClick={() => {
                                        if (isSelected) {
                                          setRoleFormData({...roleFormData, permissionIds: roleFormData.permissionIds.filter(id => id !== p.id)});
                                        } else {
                                          setRoleFormData({...roleFormData, permissionIds: [...roleFormData.permissionIds, p.id]});
                                        }
                                      }}
                                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-400'
                                          : 'bg-[hsl(var(--bg-main))]/[0.1] border-[hsl(var(--border-subtle))] hover:border-indigo-400/30'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
                                          <ShieldCheck className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-tight">{p.name}</p>
                                      </div>
                                       <p className={`text-[11px] leading-relaxed transition-colors line-clamp-2 ${isSelected ? 'text-indigo-100/70' : 'text-[hsl(var(--text-muted))]'}`}>
                                         {p.description || "Node access point."}
                                       </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </form>
                </div>

                <div className="p-6 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-main))]/[0.02]">
                  <div className="flex items-center justify-between">
                     <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">
                       {roleFormData.permissionIds.length} Nodes Configured
                     </p>
                     <div className="flex gap-3">
                       <button 
                         onClick={() => setView('members')}
                         className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] transition-colors"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={handleSaveRole}
                         className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                       >
                         Deploy Protocol
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Create Member Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                    <UserPlus className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[hsl(var(--text-main))] tracking-tight">
                      {editingMember ? 'Edit Team Member' : 'Add Team Member'}
                    </h2>
                    <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Employee Invitation</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-[hsl(var(--text-main))]/[0.05] rounded-full transition-colors">
                  <X className="w-5 h-5 text-[hsl(var(--text-muted))]" />
                </button>
              </div>

              <form onSubmit={handleSubmitMember} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">First Name</label>
                    <input 
                      required type="text" value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-5 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. John"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">Last Name</label>
                    <input 
                      required type="text" value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-5 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      placeholder="e.g. Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">Corporate Email</label>
                  <input 
                    required type="email" value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-5 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                    placeholder="john.doe@company.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">Temporary Access Key (Password)</label>
                  <input 
                    required={!editingMember} type="password" value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-5 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                    placeholder={editingMember ? "Leave blank to keep current" : "Min. 8 characters"}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">Departmental Role (Permissions)</label>
                  <select 
                    value={formData.customRoleId}
                    onChange={(e) => setFormData({...formData, customRoleId: e.target.value})}
                    className="w-full px-5 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-indigo-500/50 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Full System Admin (Default)</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                {/* Permission Preview Section */}
                {selectedRole && selectedRole.permissions && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Included Permissions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {selectedRole.permissions && selectedRole.permissions.map(({ permission }: any) => (
                         <div key={permission.id} className="group relative">
                           <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-black border border-indigo-500/20 uppercase tracking-tighter">
                             {permission.name}
                           </span>
                           {/* Hover Description Tooltip */}
                           <div className="absolute bottom-full left-0 mb-2 invisible group-hover:visible w-48 p-2 bg-slate-900 text-white text-[9px] rounded-lg shadow-xl z-10 border border-slate-700 leading-tight">
                              {permission.description}
                           </div>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-4 mt-10">
                  <button 
                    type="button" onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-4 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]"
                  >
                    {editingMember ? 'Update Protocol' : 'Generate Invite'}
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
