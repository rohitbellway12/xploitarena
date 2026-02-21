import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  Users,
  ShieldAlert,
  CreditCard,
  Building2,
  ChevronRight,
  FileText,
  Send,
  X,
  CheckCircle2,
  Inbox,
  Timer
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import SlaDashboard from '../components/SlaDashboard';

interface AdminStats {
  totalBounties: string;
  totalResearchers: number;
  totalCompanies: number;
  reportsFiled: number;
  activePrograms: number;
  pendingApprovals: number;
  latestActivity: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (error: any) {
        console.error('Failed to fetch admin stats:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load admin dashboard';
        toast.error(errorMessage);
        // Set default values to prevent UI breakage
        setStats({
          totalBounties: '$0',
          totalResearchers: 0,
          totalCompanies: 0,
          reportsFiled: 0,
          activePrograms: 0,
          pendingApprovals: 0,
          latestActivity: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleInviteCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSending(true);
    try {
      await api.post('/admin/invite-company', { email: inviteEmail, message: customMessage });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setCustomMessage('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  };

  const cards = [
    { name: 'Total Payouts', value: stats?.totalBounties || '$0', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
    { name: 'Active Researchers', value: stats?.totalResearchers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/5' },
    { name: 'Partner Companies', value: stats?.totalCompanies || 0, icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/5' },
    { name: 'Security Reports', value: stats?.reportsFiled || 0, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/5' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full space-y-8 animate-pulse p-4">
          <div className="h-8 w-48 bg-white/5 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-white/5 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
        {/* Professional Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight uppercase tracking-widest text-sm text-indigo-500">Infrastructure <span className="text-[hsl(var(--text-main))]">Command Center</span></h1>
            <h2 className="text-2xl font-black text-[hsl(var(--text-main))] tracking-tight mt-1">System Intelligence</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-indigo-600/20 active:scale-95 text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              Invite Partner
            </button>
          </div>
        </div>

        {/* Stats Matrix - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => (
            <motion.div 
              key={card.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-5 rounded-2xl hover:border-indigo-500/20 transition-all group shadow-sm flex items-center gap-4"
            >
              <div className={`p-3 ${card.bg} rounded-xl ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider opacity-70">{card.name}</p>
                <h2 className="text-xl font-black text-[hsl(var(--text-main))] mt-0.5">{card.value}</h2>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SLA Compliance Terminal */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
              <Timer className="w-4 h-4 text-indigo-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--text-main))] opacity-80">SLA Compliance Matrix</h3>
           </div>
           <SlaDashboard role="admin" />
        </div>

        {/* Action Banners - Refined */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-indigo-500/40 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[hsl(var(--text-main))]">Pending Approvals</h4>
                <p className="text-[10px] text-[hsl(var(--text-muted))] opacity-70">Review partner credentials</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stats?.pendingApprovals && stats.pendingApprovals > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black animate-pulse">
                  {stats.pendingApprovals} NEW
                </span>
              )}
              <a href="/admin/approvals" className="p-2 rounded-lg bg-[hsl(var(--text-main))]/[0.05] group-hover:bg-indigo-500 group-hover:text-white transition-all text-indigo-400">
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-emerald-500/40 transition-all text-emerald-400"
          >
             <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[hsl(var(--text-main))]">Security Health</h4>
                <p className="text-[10px] text-[hsl(var(--text-muted))] opacity-70">Platform telemetry: Nominal</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-emerald-500/10 rounded-md text-[9px] font-bold tracking-widest uppercase border border-emerald-500/20">
              Stable
            </div>
          </motion.div>
        </div>

        {/* Recent Activity Table - Professional Layout */}
        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between bg-[hsl(var(--text-main))]/[0.01]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[hsl(var(--text-main))] uppercase tracking-wider">Signals Infiltration Stream</h3>
            </div>
            <a href="/admin/logs" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-1">
              Deep Analysis <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider border-b border-[hsl(var(--border-subtle))]">
                  <th className="px-6 py-3">Analyst</th>
                  <th className="px-6 py-3">Target Node</th>
                  <th className="px-6 py-3">Impact</th>
                  <th className="px-6 py-3">Telemetry</th>
                  <th className="px-6 py-3 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                {stats?.latestActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-[hsl(var(--text-main))]/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 ring-4 ring-[hsl(var(--bg-card))]">
                          {activity.researcher.firstName[0]}{activity.researcher.lastName[0]}
                        </div>
                        <span className="text-sm font-semibold text-[hsl(var(--text-main))]">{activity.researcher.firstName} {activity.researcher.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-[hsl(var(--text-muted))] opacity-80">{activity.program.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                        activity.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        activity.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {activity.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-tight opacity-70">
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(activity.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <ChevronRight className="w-4 h-4 ml-auto text-[hsl(var(--text-muted))] group-hover:text-indigo-400 transition-all group-hover:translate-x-0.5" />
                    </td>
                  </tr>
                ))}
                {(!stats?.latestActivity || stats.latestActivity.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[hsl(var(--text-muted))] text-[10px] font-bold uppercase tracking-widest opacity-50">
                      Zero infiltration signals active.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite Modal - Refined */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between bg-[hsl(var(--text-main))]/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-[hsl(var(--text-main))] uppercase tracking-widest">Infiltrate Partner</h3>
                </div>
                <button 
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-1.5 hover:bg-[hsl(var(--text-main))]/[0.05] rounded-lg text-[hsl(var(--text-muted))] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleInviteCompany} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">
                    Partner Intelligence Alias (Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="security-alias@partner.node"
                    className="w-full bg-[hsl(var(--bg-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-xs text-[hsl(var(--text-main))] placeholder:opacity-30 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">
                    Encrypted Protocol Message
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Briefly describe the extraction parameters..."
                    rows={4}
                    className="w-full bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-xs text-[hsl(var(--text-main))] placeholder:opacity-30 focus:border-indigo-500 outline-none transition-all resize-none font-medium"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-main))] text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    {isSending ? 'Transmitting...' : (
                      <>
                        Transmit Invite
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
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
