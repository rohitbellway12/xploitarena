import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Users, UserPlus, Shield, Trash2, ShieldCheck, Mail, Plus } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions?: {
    permission: {
      id: string;
      key: string;
      name: string;
    }
  }[];
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  customRole?: Role;
}

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // New Member Form
  const [newMember, setNewMember] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleId: ''
  });

  // New Role Form
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[]
  });
  const [allPermissions, setAllPermissions] = useState<any[]>([]);

  useEffect(() => {
    fetchTeam();
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await api.get('/team');
      setMembers(res.data);
    } catch (err) {
      toast.error('Failed to fetch team');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/rbac/my-roles');
      setRoles(res.data);
    } catch (err) {}
  };

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/rbac/permissions');
      setAllPermissions(res.data);
    } catch (err) {}
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/team/add', newMember);
      toast.success('Member added successfully');
      setShowAddModal(false);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/rbac/create-role', newRole);
      toast.success('Role created successfully');
      setShowRoleModal(false);
      fetchRoles();
    } catch (err) {
      toast.error('Failed to create role');
    }
  };

  const removeMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/team/${id}`);
      toast.success('Member removed');
      fetchTeam();
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
              <Users className="w-6 h-6 text-indigo-400" />
              Team Management
            </h1>
            <p className="text-[hsl(var(--text-muted))] text-sm">Manage your employees and collaborators</p>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-lg text-sm font-semibold hover:bg-[hsl(var(--text-main))]/[0.1] transition-all"
            >
              <Shield className="w-4 h-4" />
              Manage Roles
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role / Permissions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border-subtle))] text-sm">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center">Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-[hsl(var(--text-muted))]">No team members yet.</td></tr>
              ) : (
                members.map(member => (
                  <tr key={member.id} className="hover:bg-[hsl(var(--text-main))]/[0.01] transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-sm font-bold">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-[hsl(var(--text-main))]">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-[hsl(var(--text-muted))] flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                        {member.customRole?.name || 'Standard Member'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => removeMember(member.id)}
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

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.02]">
                <h3 className="text-lg font-bold text-[hsl(var(--text-main))] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  Add New Team Member
                </h3>
              </div>
              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest pl-1">First Name</label>
                    <input 
                      required 
                      type="text" 
                      value={newMember.firstName}
                      onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                      className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-[hsl(var(--text-main))] focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest pl-1">Last Name</label>
                    <input 
                      required 
                      type="text" 
                      value={newMember.lastName}
                      onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                      className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-[hsl(var(--text-main))] focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest pl-1">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-[hsl(var(--text-main))] focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest pl-1">Password</label>
                  <input 
                    required 
                    type="password" 
                    value={newMember.password}
                    onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                    className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-[hsl(var(--text-main))] focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest pl-1">Assigned Role</label>
                  <select 
                    value={newMember.roleId}
                    onChange={(e) => setNewMember({...newMember, roleId: e.target.value})}
                    className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-[hsl(var(--text-main))] focus:outline-none focus:border-indigo-500/50 appearance-none"
                  >
                    <option value="">Select a role...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl text-sm font-bold text-[hsl(var(--text-main))] hover:bg-[hsl(var(--text-main))]/[0.1]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-500 rounded-xl text-sm font-bold text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Role Management Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[hsl(var(--bg-card))] border border-white/10 rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)] animate-in fade-in zoom-in duration-300">
               <div className="px-8 py-6 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 to-transparent flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                    Role Architect
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">Design granular access control units</p>
                </div>
                <button 
                  onClick={() => setShowRoleModal(false)} 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-5 gap-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {/* Designer Side */}
                <form onSubmit={handleCreateRole} className="md:col-span-3 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">Identity Details</label>
                      <input 
                        required 
                        placeholder="Role Name (e.g., Triage Specialist)"
                        value={newRole.name}
                        onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                      />
                      <textarea 
                        placeholder="Purpose of this role..."
                        value={newRole.description}
                        onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all h-24 blur-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center pl-1">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Capability Matrix</label>
                        <span className="text-[9px] font-bold text-slate-500">{newRole.permissionIds.length} Selected</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allPermissions.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => {
                              if (newRole.permissionIds.includes(p.id)) {
                                setNewRole({...newRole, permissionIds: newRole.permissionIds.filter(id => id !== p.id)});
                              } else {
                                setNewRole({...newRole, permissionIds: [...newRole.permissionIds, p.id]});
                              }
                            }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 group ${
                              newRole.permissionIds.includes(p.id)
                                ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 w-4 h-4 rounded flex items-center justify-center transition-all ${
                                newRole.permissionIds.includes(p.id) ? 'bg-indigo-500 text-white' : 'border-2 border-slate-600'
                              }`}>
                                {newRole.permissionIds.includes(p.id) && <ShieldCheck className="w-3 h-3" />}
                              </div>
                              <div>
                                <p className={`text-xs font-bold transition-colors ${newRole.permissionIds.includes(p.id) ? 'text-indigo-300' : 'text-slate-300'}`}>
                                  {p.name}
                                </p>
                                <p className="text-[9px] text-slate-500 font-mono mt-0.5 opacity-60 uppercase">{p.key}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                  >
                    Generate Protocol Role
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  </button>
                </form>

                {/* Inventory Side */}
                <div className="md:col-span-2 space-y-4">
                   <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] h-full">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 px-2">Active Protocols</p>
                      <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                        {roles.map(r => (
                          <div key={r.id} className="relative group p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.08] transition-all">
                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Shield className="w-4 h-4 text-indigo-500/50" />
                            </div>
                            <p className="font-bold text-white text-xs uppercase tracking-widest">{r.name}</p>
                            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed italic">"{r.description || 'No operational brief provided.'}"</p>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                               {r.permissions?.slice(0, 3).map((p) => (
                                 <span key={p.permission.id} className="text-[8px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 uppercase">
                                   {p.permission.key.split(':').pop()}
                                 </span>
                               ))}
                               {(r.permissions?.length || 0) > 3 && (
                                 <span className="text-[8px] text-slate-500 px-1.5">+{(r.permissions?.length || 0) - 3} more</span>
                               )}
                            </div>
                          </div>
                        ))}
                        {roles.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                            <Shield className="w-12 h-12 text-slate-700" />
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">No Records Found</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
