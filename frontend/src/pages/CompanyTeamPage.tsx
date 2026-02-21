import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  Users, UserPlus, Trash2, X
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface TeamMember {
  userId: string;
  companyId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export default function CompanyTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/company/members');
      setMembers(response.data);
    } catch (error) {
      console.error('Fetch Members Error:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    try {
      await api.post('/company/members', { email: inviteEmail, role: inviteRole });
      toast.success('Member invited successfully');
      setShowInviteModal(false);
      setInviteEmail('');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) return;

    try {
      await api.delete(`/company/members/${userId}`);
      toast.success('Member removed');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-500" />
              Team Management
            </h1>
            <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Manage access and roles for your organization's security team.</p>
          </div>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>

        {/* Member List */}
        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-[hsl(var(--text-muted))] border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-main))]/[0.02]">
                  <th className="p-4 font-bold uppercase tracking-wider">User</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Email</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Role</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[hsl(var(--text-main))] divide-y divide-[hsl(var(--border-subtle))]">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="p-4"><div className="h-10 bg-[hsl(var(--border-subtle))] rounded-xl w-full"></div></td>
                    </tr>
                  ))
                ) : members.length > 0 ? (
                  members.map((member) => (
                    <tr key={member.userId} className="hover:bg-indigo-500/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 border border-indigo-500/20">
                            {member.user.firstName[0]}{member.user.lastName[0]}
                          </div>
                          <div>
                            <div className="font-semibold">{member.user.firstName} {member.user.lastName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[hsl(var(--text-muted))]">{member.user.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black tracking-widest border border-indigo-500/20 uppercase">
                          {member.role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleRemove(member.userId)}
                          className="p-2 text-[hsl(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-16 text-center text-[hsl(var(--text-muted))]">
                      <div className="flex flex-col items-center gap-3 opacity-50">
                        <Users className="w-12 h-12" />
                        <p className="font-bold">No team members found</p>
                        <p className="text-xs">Invite colleagues to collaborate on your programs.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[hsl(var(--text-main))]">Invite Team Member</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-[hsl(var(--text-main))]/[0.05] rounded-full transition-colors">
                  <X className="w-5 h-5 text-[hsl(var(--text-muted))]" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    type="email" required value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    placeholder="colleague@company.com"
                    className="w-full px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-[hsl(var(--text-muted))]/50" 
                  />
                  <p className="text-[10px] text-[hsl(var(--text-muted))] px-1">User must already have a registered account.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">Role</label>
                  <select 
                    value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className="w-full px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-2.5 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Cancel</button>
                  <button type="submit" disabled={inviting} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50">
                    {inviting ? 'Inviting...' : 'Send Invite'}
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
