import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Users, UserPlus, Trash2, Mail, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CompanyTeamsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/company/members');
      setMembers(res.data);
    } catch (error) {
      console.error('Fetch Members Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post('/company/members', { email, role });
      toast.success('Member invited successfully!');
      setEmail('');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/company/members/${userId}`);
      toast.success('Member removed successfully');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--text-main))]">Team Management</h1>
            <p className="text-[hsl(var(--text-muted))] mt-2">Manage access and roles for your organization.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invite Section */}
          <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl p-8 space-y-6 h-fit shadow-lg shadow-black/5">
            <h3 className="font-bold text-[hsl(var(--text-main))] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Invite New Member
            </h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl py-3 pl-10 pr-4 text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all placeholder-[hsl(var(--text-muted))]/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase">Role</label>
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl py-3 px-4 text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={inviting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              >
                {inviting ? 'Inviting...' : 'Send Invitation'}
              </button>
            </form>
          </div>

          {/* Members List */}
          <div className="lg:col-span-2 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.02]">
                <h3 className="font-bold text-[hsl(var(--text-main))] flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Current Members
                </h3>
             </div>
             <div className="divide-y divide-[hsl(var(--border-subtle))]">
               {loading ? (
                 <div className="p-8 text-center text-slate-500">Loading members...</div>
               ) : members.length === 0 ? (
                 <div className="p-8 text-center text-slate-500">No members found.</div>
               ) : (
                 members.map(member => (
                   <div key={member.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
                          <span className="text-indigo-400 font-bold">{member.user.firstName[0]}</span>
                        </div>
                        <div>
                          <p className="text-[hsl(var(--text-main))] font-bold">{member.user.firstName} {member.user.lastName}</p>
                          <p className="text-xs text-[hsl(var(--text-muted))]">{member.user.email}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-[hsl(var(--bg-main))] text-[hsl(var(--text-muted))] text-[10px] font-black uppercase rounded-full border border-[hsl(var(--border-subtle))]">
                           <Shield className="w-3 h-3" /> {member.role}
                        </span>
                        <button 
                          onClick={() => handleRemove(member.user.id)}
                          className="p-2 text-[hsl(var(--text-muted))] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
