import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  ShieldCheck, 
  BarChart3, 
  AlertCircle, 
  Plus, 
  ChevronRight, 
  X, 
  ShieldAlert,
  CreditCard, 
  DollarSign,
  FileText
} from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardStats {
  programCount: number;
  reportCount: number;
  criticalCount: number;
  recentReports: any[];
}

export default function CompanyDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/company/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Fetch Stats Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [bountyAmount, setBountyAmount] = useState('');

  const handlePayBounty = async () => {
    if (!selectedReport || !bountyAmount) return;
    setPaying(true);
    try {
      await api.post(`/reports/${selectedReport.id}/pay`, { amount: parseFloat(bountyAmount) });
      toast.success('Bounty processed successfully');
      setSelectedReport(null);
      setBountyAmount('');
      const response = await api.get('/company/stats');
      setStats(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transaction failed');
    } finally {
      setPaying(false);
    }
  };

  const displayStats = [
    { name: 'Active Programs', value: stats?.programCount ?? 0, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
    { name: 'Total Disclosures', value: stats?.reportCount ?? 0, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/5' },
    { name: 'Critical Findings', value: stats?.criticalCount ?? 0, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/5' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full space-y-8 animate-pulse p-4">
          <div className="h-20 bg-white/5 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-white/5 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
        {/* Professional Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[hsl(var(--border-subtle))] pb-8">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight">Organization Intelligence</h1>
            <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Infrastructure security assessment and collaboration telemetry.</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => navigate('/company/create-program')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Establish Program
             </button>
          </div>
        </div>

        {/* Stats Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayStats.map((stat, index) => (
            <motion.div 
              key={stat.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-6 rounded-xl hover:border-indigo-500/20 transition-all group shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 ${stat.bg} rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-[hsl(var(--text-muted))] uppercase tracking-wider">{stat.name}</p>
                <h2 className="text-2xl font-bold text-[hsl(var(--text-main))] mt-1">{stat.value}</h2>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Professional Vulnerability Table */}
          <div className="lg:col-span-3 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
            <div className="p-6 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[hsl(var(--text-main))] flex items-center gap-2 tracking-wide uppercase">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Received Disclosures
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              {!stats?.recentReports || stats.recentReports.length === 0 ? (
                <div className="p-24 text-center">
                  <AlertCircle className="w-10 h-10 text-[hsl(var(--text-muted))] mx-auto mb-4 opacity-20" />
                  <p className="text-[hsl(var(--text-muted))] text-xs font-bold uppercase tracking-widest">Awaiting system incoming signals</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Analyst</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4 text-right">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                    {stats.recentReports.map((report) => (
                      <tr 
                        key={report.id} 
                        className="hover:bg-[hsl(var(--text-main))]/[0.01] transition-colors group cursor-pointer"
                        onClick={() => setSelectedReport(report)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{report.title}</span>
                            <span className="text-[9px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-0.5">{report.program.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-[hsl(var(--text-muted))]">{report.researcher.firstName} {report.researcher.lastName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tighter ${
                            report.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                            report.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}>
                            {report.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 hover:bg-[hsl(var(--text-main))]/[0.05] rounded-lg text-[hsl(var(--text-muted))] hover:text-indigo-400 transition-all">
                             <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Analysis Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between bg-[hsl(var(--text-main))]/[0.01]">
                <h3 className="font-bold text-[hsl(var(--text-main))] text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Disclosure Analysis
                </h3>
                <button onClick={() => setSelectedReport(null)} className="p-1.5 hover:bg-[hsl(var(--text-main))]/[0.05] rounded-lg text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div>
                  <h2 className="text-xl font-bold text-[hsl(var(--text-main))] uppercase tracking-tight">{selectedReport.title}</h2>
                  <div className="flex gap-2 mt-3">
                     <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded border border-indigo-500/20">
                       {selectedReport.program.name}
                     </span>
                     <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${
                        selectedReport.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                     }`}>
                       {selectedReport.severity}
                     </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Finding Summary</label>
                  <div className="bg-[hsl(var(--text-main))]/[0.02] p-5 rounded-xl border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedReport.description}
                  </div>
                </div>

                {selectedReport.status !== 'PAID' && (
                  <div className="pt-6 border-t border-[hsl(var(--border-subtle))] space-y-4">
                    <h4 className="text-[10px] font-black text-[hsl(var(--text-main))] uppercase tracking-[0.2em] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      Grant Bounty Transaction
                    </h4>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
                        <input 
                          type="number"
                          placeholder="Amount in USD"
                          value={bountyAmount}
                          onChange={(e) => setBountyAmount(e.target.value)}
                          className="w-full bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-xl py-3 pl-9 pr-4 text-xs text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <button 
                        onClick={handlePayBounty}
                        disabled={paying || !bountyAmount}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/10"
                      >
                        {paying ? 'Authorizing...' : 'Settle Payout'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
