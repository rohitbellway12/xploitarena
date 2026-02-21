import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  ChevronRight, 
  X, 
  ShieldAlert,
  CreditCard, 
  DollarSign,
  FileText,
  Clock
} from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SlaDashboard from '../components/SlaDashboard';
import BudgetTrendChart from '../components/BudgetTrendChart';
import ReportTimeline from '../components/ReportTimeline';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardStats {
  programCount: number;
  reportCount: number;
  criticalCount: number;
  recentReports: any[];
  spendingBySeverity?: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
}

export default function CompanyDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [kybStatus, setKybStatus] = useState<string>('UNVERIFIED');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, userRes] = await Promise.all([
          api.get('/company/stats'),
          api.get('/auth/me')
        ]);
        setStats(statsRes.data);
        setKybStatus(userRes.data.kybStatus || 'UNVERIFIED');
      } catch (error: any) {
        console.error('Fetch Stats Error:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load dashboard data';
        toast.error(errorMessage);
        // Set default values to prevent UI breakage
        setStats({
          programCount: 0,
          reportCount: 0,
          criticalCount: 0,
          recentReports: []
        });
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
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight">Organization <span className="text-indigo-500">Intelligence</span></h1>
            <p className="text-[hsl(var(--text-muted))] text-xs font-semibold uppercase tracking-wider mt-0.5 opacity-70">Infrastructure security assessment & telemetry</p>
          </div>
          <div className="flex items-center gap-2">
             <button 
                onClick={() => navigate('/company/create-program')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold border border-transparent transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Launch Program
             </button>
          </div>
        </div>

        {/* Verification Banner (Compact) */}
        {kybStatus !== 'VERIFIED' && (
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
            kybStatus === 'PENDING' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/10'
          }`}>
             <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                   kybStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                   <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="text-xs font-bold text-[hsl(var(--text-main))] uppercase tracking-wider">
                     {kybStatus === 'PENDING' ? 'Verification Under Review' : 'Identity Verification Required'}
                   </h4>
                   <p className="text-[10px] font-medium text-[hsl(var(--text-muted))] uppercase tracking-tight mt-0.5">
                     {kybStatus === 'PENDING' ? 'Intelligence files are being processed. Full access pending.' : 'Please provide business credentials to enable full program management.'}
                   </p>
                </div>
             </div>
             {kybStatus === 'UNVERIFIED' && (
                <button 
                  onClick={() => navigate('/company/verify')}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-md transition-all whitespace-nowrap"
                >
                  Verify Now
                </button>
             )}
             {kybStatus === 'REJECTED' && (
                <button 
                  onClick={() => navigate('/company/verify')}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-md transition-all whitespace-nowrap"
                >
                  Retry Verification
                </button>
             )}
          </div>
        )}

        {/* Stats Grid (Compact) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayStats.map((stat, index) => (
            <motion.div 
              key={stat.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-5 rounded-2xl hover:border-indigo-500/20 transition-all group shadow-sm flex items-center gap-4"
            >
              <div className={`p-3 ${stat.bg} rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider">{stat.name}</p>
                <h2 className="text-xl font-black text-[hsl(var(--text-main))]">{stat.value}</h2>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SLA Intelligence Layer */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--text-main))]">SLA Compliance Hub</h3>
           </div>
           <SlaDashboard role="company" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <BudgetTrendChart />
           
           {/* Spending By Severity */}
           <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-6 rounded-2xl shadow-sm flex flex-col min-h-[400px]">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-[hsl(var(--text-main))] uppercase tracking-wider">Severity Allocation</h3>
              </div>
              <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase font-bold tracking-widest mb-6">Bounty distribution by priority</p>
              
              <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Critical', value: stats?.spendingBySeverity?.CRITICAL || 0, color: '#f43f5e' },
                        { name: 'High', value: stats?.spendingBySeverity?.HIGH || 0, color: '#f97316' },
                        { name: 'Medium', value: stats?.spendingBySeverity?.MEDIUM || 0, color: '#6366f1' },
                        { name: 'Low', value: stats?.spendingBySeverity?.LOW || 0, color: '#3b82f6' },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { severity: 'CRITICAL', color: '#f43f5e' },
                        { severity: 'HIGH', color: '#f97316' },
                        { severity: 'MEDIUM', color: '#6366f1' },
                        { severity: 'LOW', color: '#3b82f6' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--bg-card))', 
                        borderColor: 'hsl(var(--border-subtle))',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: 'hsl(var(--text-main))'
                      }}
                      itemStyle={{ color: 'inherit' }}
                      formatter={(value: number | string | undefined) => [`$${Number(value || 0).toLocaleString()}`, 'Spent']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--text-muted))]">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Total Overlay */}
                <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-[9px] font-black text-[hsl(var(--text-muted))] uppercase tracking-tighter">Total Paid</p>
                  <p className="text-sm font-black text-[hsl(var(--text-main))] tracking-tight">
                    ${Object.values(stats?.spendingBySeverity || {}).reduce((a, b) => a + (b as number), 0).toLocaleString()}
                  </p>
                </div>
              </div>
           </div>
        </div>

        {/* Disclosures Table (Refined) */}
        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between bg-[hsl(var(--text-main))]/[0.01]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                 <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[hsl(var(--text-main))] uppercase tracking-wider">Security Disclosures</h3>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {!stats?.recentReports || stats.recentReports.length === 0 ? (
              <div className="py-20 text-center">
                <AlertCircle className="w-8 h-8 text-[hsl(var(--text-muted))] mx-auto mb-3 opacity-20" />
                <p className="text-[10px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest">Awaiting system incoming signals</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider border-b border-[hsl(var(--border-subtle))]">
                    <th className="px-6 py-3">Infiltration Signal</th>
                    <th className="px-6 py-3">Analyst</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3 text-right">Action</th>
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
                          <span className="text-sm font-semibold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors line-clamp-1">{report.title}</span>
                          <span className="text-[10px] text-[hsl(var(--text-muted))] font-medium mt-0.5">{report.program.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[hsl(var(--text-muted))]">{report.researcher.firstName} {report.researcher.lastName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                          report.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          report.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          {report.severity}
                        </span>
                        {report.status === 'SUBMITTED' && !report.firstRespondedAt && (
                            (() => {
                              const deadline = new Date(report.submittedAt).getTime() + (report.program.slaFirstResponse || 24) * 60 * 60 * 1000;
                              const isBreached = Date.now() > deadline;
                              if (isBreached) {
                                return <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter animate-pulse ml-2">SLA BREACH</span>;
                              }
                              return null;
                            })()
                          )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <ChevronRight className="w-4 h-4 ml-auto text-[hsl(var(--text-muted))] group-hover:text-indigo-400 transition-all group-hover:translate-x-0.5" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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

                {/* SLA Intelligence Tracking */}
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      SLA Performance Tracking
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Response SLA */}
                    <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">First Response</span>
                        {selectedReport.firstRespondedAt ? (
                          <span className="text-[10px] font-black text-emerald-500 uppercase">Acheived</span>
                        ) : (
                          (() => {
                            const deadline = new Date(selectedReport.submittedAt).getTime() + (selectedReport.program.slaFirstResponse || 24) * 60 * 60 * 1000;
                            const isBreached = Date.now() > deadline;
                            return isBreached ? (
                              <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter bg-rose-500/10 px-1.5 py-0.5 rounded">Breached</span>
                            ) : (
                              <span className="text-[10px] font-black text-amber-500 uppercase">Pending</span>
                            );
                          })()
                        )}
                      </div>
                      <div className="text-xs font-bold text-[hsl(var(--text-main))]">
                        Target: {selectedReport.program.slaFirstResponse ? `${selectedReport.program.slaFirstResponse}h` : '24h (Std)'}
                      </div>
                    </div>

                    {/* Triage SLA */}
                    <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-4 rounded-xl space-y-2">
                       <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Triage Completion</span>
                        {selectedReport.triagedAt ? (
                          <span className="text-[10px] font-black text-emerald-500 uppercase">Acheived</span>
                        ) : (
                          (() => {
                            const deadline = new Date(selectedReport.submittedAt).getTime() + (selectedReport.program.slaTriage || 72) * 60 * 60 * 1000;
                            const isBreached = Date.now() > deadline;
                            return isBreached ? (
                              <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter bg-rose-500/10 px-1.5 py-0.5 rounded">Breached</span>
                            ) : (
                              <span className="text-[10px] font-black text-amber-500 uppercase">Active</span>
                            );
                          })()
                        )}
                      </div>
                      <div className="text-xs font-bold text-[hsl(var(--text-main))]">
                        Target: {selectedReport.program.slaTriage ? `${selectedReport.program.slaTriage}h` : '72h (Std)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Timeline Tracking */}
                <div className="bg-[hsl(var(--bg-main))]/[0.02] border border-[hsl(var(--border-subtle))] p-6 rounded-2xl">
                   <ReportTimeline report={selectedReport} />
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
