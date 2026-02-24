import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
        toast.error('Failed to load admin dashboard');
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
    { name: 'Total Payouts', value: stats?.totalBounties || '$0', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { name: 'Researchers', value: stats?.totalResearchers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Companies', value: stats?.totalCompanies || 0, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { name: 'Reports', value: stats?.reportsFiled || 0, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full space-y-6 animate-pulse p-4 md:p-8 max-w-6xl mx-auto">
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-20">
        
        {/* Simplified Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
               SYS
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-slate-500 text-sm">System intelligence and partner management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Send size={16} /> Invite Company
            </button>
          </div>
        </div>

        {/* Stats Grid - High Density */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className={`p-3 ${card.bg} ${card.color} rounded-lg shrink-0`}>
                <card.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{card.name}</p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{card.value}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* SLA Compliance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
           <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Timer size={16} className="text-indigo-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white">Compliance Metrics</h3>
           </div>
           <SlaDashboard role="admin" />
        </div>

        {/* Action Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div 
             onClick={() => navigate('/admin/approvals')}
             className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 p-5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 transition-all shadow-sm"
           >
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                 <Inbox size={20} />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pending Approvals</h4>
                 <p className="text-[10px] text-slate-500 font-bold uppercase">Review partner applications</p>
               </div>
             </div>
             {stats?.pendingApprovals && stats.pendingApprovals > 0 ? (
               <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold animate-pulse">
                 {stats.pendingApprovals} NEW
               </span>
             ) : (
               <ChevronRight size={16} className="text-slate-400" />
             )}
           </div>

           <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 p-5 rounded-xl flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                 <CheckCircle2 size={20} />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-slate-900 dark:text-white">System Status</h4>
                 <p className="text-[10px] text-emerald-600 font-bold uppercase">Operational</p>
               </div>
             </div>
             <div className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded text-[8px] font-bold text-emerald-600 uppercase border border-emerald-200 dark:border-emerald-800/50">
               Nominal
             </div>
           </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/30">
            <h3 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" /> Activity Stream
            </h3>
            <button onClick={() => navigate('/admin/logs')} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors">View All Logs</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.01] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Researcher</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Program</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Impact</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats?.latestActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {activity.researcher.firstName[0]}{activity.researcher.lastName[0]}
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{activity.researcher.firstName} {activity.researcher.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{activity.program.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                        activity.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        activity.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {activity.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400">
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {(!stats?.latestActivity || stats.latestActivity.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                      Zero activity detected.
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
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setIsInviteModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Invite Partner</h3>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <X size={16} />
                </button>
              </div>
              
              <form onSubmit={handleInviteCompany} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Company Email</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Message (Optional)</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Brief intro..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                  >
                    {isSending ? 'Sending...' : 'Send Invite'}
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
