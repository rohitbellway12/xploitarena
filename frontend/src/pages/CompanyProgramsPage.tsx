import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Lock, 
  Globe, 
  UserPlus, 
  X,
  Mail,
  ChevronRight,
  Settings2,
  Users,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Program {
  id: string;
  name: string;
  description: string;
  rewards: string;
  type: 'PUBLIC' | 'PRIVATE';
  status: string;
  createdAt: string;
  invitedResearchers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  _count: { reports: number };
}

export default function CompanyProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [researcherEmail, setResearcherEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const navigate = useNavigate();

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/programs');
      // Filter only my own programs (handled by backend fix but double check role if needed)
      setPrograms(response.data);
    } catch (error) {
      console.error('Fetch Programs Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !researcherEmail) return;

    setInviting(true);
    try {
      await api.post(`/programs/${selectedProgram.id}/invite`, { researcherEmail });
      toast.success(`Invitation sent to ${researcherEmail}`);
      setIsInviteModalOpen(false);
      setResearcherEmail('');
      fetchPrograms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to invite researcher');
    } finally {
      setInviting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[hsl(var(--border-subtle))] pb-8">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight">Security Programs</h1>
            <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Manage your public and private bug bounty campaigns.</p>
          </div>
          <button 
            onClick={() => navigate('/company/create-program')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Program
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <motion.div 
                key={program.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 hover:border-indigo-500/20 transition-all group shadow-sm flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  </div>
                  {program.type === 'PRIVATE' ? (
                    <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-lg text-[9px] font-black uppercase border border-rose-500/20 tracking-widest flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase border border-emerald-500/20 tracking-widest flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  )}
                  {program.type === 'PRIVATE' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/5 text-indigo-400 rounded-lg text-[9px] font-black uppercase border border-indigo-500/10 tracking-widest">
                       <Users className="w-3 h-3" />
                       {program.invitedResearchers?.length || 0} Analysts
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-[hsl(var(--text-main))] mb-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{program.name}</h3>
                <p className="text-[hsl(var(--text-muted))] text-xs line-clamp-2 mb-4 h-8 leading-relaxed font-medium">{program.description}</p>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-[hsl(var(--border-subtle))] mt-auto">
                   <div>
                     <p className="text-[9px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Rewards</p>
                     <p className="text-xs font-bold text-[hsl(var(--text-main))] mt-0.5">{program.rewards}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Reports</p>
                     <p className="text-xs font-bold text-[hsl(var(--text-main))] mt-0.5">{program._count?.reports || 0} Submissions</p>
                   </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-[hsl(var(--border-subtle))]">
                  {program.type === 'PRIVATE' && (
                    <button 
                      onClick={() => { setSelectedProgram(program); setIsInviteModalOpen(true); }}
                      className="flex-1 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-indigo-500/20"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Invite
                    </button>
                  )}
                  <button 
                    onClick={() => navigate(`/company/programs/edit/${program.id}`)}
                    className="flex-1 px-3 py-2 bg-[hsl(var(--text-main))]/[0.02] hover:bg-[hsl(var(--text-main))]/[0.05] text-[hsl(var(--text-muted))] rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-[hsl(var(--border-subtle))]"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Manage
                  </button>
                </div>
              </motion.div>
            ))}

            {programs.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-[hsl(var(--border-subtle))] rounded-3xl">
                 <ShieldCheck className="w-12 h-12 text-[hsl(var(--text-muted))] mx-auto mb-4 opacity-20" />
                 <h3 className="text-lg font-bold text-[hsl(var(--text-main))]">No current active programs</h3>
                 <p className="text-sm text-[hsl(var(--text-muted))] mt-2 font-medium">Initialize your security posture by establishing your first program.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Researcher Modal */}
      <AnimatePresence>
        {isInviteModalOpen && selectedProgram && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsInviteModalOpen(false)}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="relative w-full max-w-md bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between bg-indigo-500/5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                     <UserPlus className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="font-black text-[hsl(var(--text-main))] text-xs uppercase tracking-[0.2em]">Private Invitation</h3>
                     <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">{selectedProgram.name}</p>
                   </div>
                </div>
                <button onClick={() => setIsInviteModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-[hsl(var(--text-muted))] transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleInvite} className="p-8 space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest flex items-center gap-2">
                     <Mail className="w-3.5 h-3.5" />
                     Analyst Email Address
                   </label>
                   <input 
                      type="email"
                      required
                      value={researcherEmail}
                      onChange={(e) => setResearcherEmail(e.target.value)}
                      placeholder="e.g. researcher@gmail.com"
                      className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all placeholder:text-[hsl(var(--text-muted))]/50 font-medium"
                   />
                </div>

                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                   <p className="text-[10px] text-amber-500 uppercase font-black leading-relaxed tracking-wider">
                      Note: This program is private. Only invited analysts can view its scope and submit vulnerabilities. Invitations are permanent.
                   </p>
                </div>

                <div className="flex gap-3">
                   <button 
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="flex-1 py-3 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-main))] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                      type="submit"
                      disabled={inviting || !researcherEmail}
                      className="flex-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                   >
                     {inviting ? 'Sending...' : 'Transmit Access'}
                     <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </form>

              {selectedProgram.type === 'PRIVATE' && selectedProgram.invitedResearchers?.length > 0 && (
                 <div className="px-8 pb-8 space-y-4">
                    <div className="h-px bg-[hsl(var(--border-subtle))] w-full mb-6" />
                    <h4 className="text-[10px] font-black text-[hsl(var(--text-main))] uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                       Authorized Security Analysts ({selectedProgram.invitedResearchers.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                       {selectedProgram.invitedResearchers.map((res) => (
                          <div key={res.id} className="flex items-center justify-between p-3 bg-[hsl(var(--bg-main))] rounded-xl border border-[hsl(var(--border-subtle))] group">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 font-bold text-[10px]">
                                   {res.firstName[0]}{res.lastName[0]}
                                </div>
                                <div>
                                   <p className="text-[10px] font-bold text-[hsl(var(--text-main))]">{res.firstName} {res.lastName}</p>
                                   <p className="text-[9px] text-[hsl(var(--text-muted))]">{res.email}</p>
                                </div>
                             </div>
                             <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20" />
                          </div>
                       ))}
                    </div>
                 </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
