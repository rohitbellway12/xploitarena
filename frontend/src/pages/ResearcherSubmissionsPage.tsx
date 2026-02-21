import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { 
  FileText, 
  Search, 
  ExternalLink,
  Shield,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function ResearcherSubmissionsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/researcher/reports');
        setReports(res.data);
      } catch (error: any) {
        console.error('Failed to fetch reports:', error);
        toast.error('Could not load your submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.program.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'ACCEPTED': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'TRIAGED': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'DRAFT': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
           <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                    <FileText className="w-6 h-6" />
                 </div>
                 <h1 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight uppercase">My Submissions</h1>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">Central Repository of Security Intel</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                 <input 
                   type="text"
                   placeholder="SEARCH REPORTS..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl pl-11 pr-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--text-main))] focus:border-indigo-500/50 outline-none w-full md:w-64 transition-all"
                 />
              </div>
              <div className="flex items-center gap-2 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-1">
                 {['ALL', 'TRIAGED', 'ACCEPTED', 'PAID', 'DRAFT'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        filterStatus === status 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {status}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Content Section */}
        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/20">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-white/[0.01] border-b border-[hsl(var(--border-subtle))]">
                       <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Report Detail</th>
                       <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Program / Target</th>
                       <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Current Status</th>
                       <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Est. Payout</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                    {loading ? (
                      [1, 2, 3, 4].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-10 py-8 bg-white/[0.01]">
                             <div className="h-4 w-1/3 bg-white/5 rounded-full mb-2"></div>
                             <div className="h-3 w-1/4 bg-white/5 rounded-full opacity-50"></div>
                          </td>
                        </tr>
                      ))
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-10 py-32 text-center space-y-4">
                           <div className="w-16 h-16 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto text-slate-500 border border-white/5">
                              <Shield className="w-8 h-8 opacity-20" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">No corresponding signals found</p>
                           <button 
                             onClick={() => navigate('/researcher/programs')}
                             className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 underline"
                           >
                             Discovery New Programs
                           </button>
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence>
                        {filteredReports.map((report, idx) => (
                          <motion.tr 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            key={report.id} 
                            onClick={() => navigate(`/reports/${report.id}`)}
                            className="hover:bg-[hsl(var(--text-main))]/[0.02] transition-all cursor-pointer group relative"
                          >
                            <td className="px-10 py-7">
                               <div className="flex flex-col gap-1.5 min-w-[300px]">
                                  <div className="flex items-center gap-3">
                                     <span className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors leading-tight truncate">{report.title}</span>
                                     <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                                  </div>
                                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                     <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(report.createdAt).toLocaleDateString()}</span>
                                     <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                     <span className="flex items-center gap-1 text-slate-400">ID: {report.id.slice(-8).toUpperCase()}</span>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-7">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10 text-indigo-400">
                                     <AlertCircle className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-xs font-black text-slate-300 uppercase tracking-tight">{report.program.name}</span>
                                     <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mt-0.5">Verified Asset</span>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-7">
                               <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(report.status)} shadow-sm`}>
                                  {report.status}
                               </span>
                            </td>
                            <td className="px-10 py-7 text-right">
                               <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1.5 text-base font-black font-mono text-emerald-400">
                                     {report.bountyAmount > 0 ? (
                                       <>
                                         <DollarSign className="w-4 h-4" />
                                         {report.bountyAmount.toLocaleString()}
                                       </>
                                     ) : (
                                       <span className="text-slate-600">PENDING</span>
                                     )}
                                  </div>
                                  {report.status === 'PAID' && (
                                    <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Transaction Settled</span>
                                  )}
                               </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Global Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
           {[
             { label: 'Total Submissions', value: reports.length, icon: FileText, color: 'text-indigo-500' },
             { label: 'Verified Findings', value: reports.filter(r => ['TRIAGED', 'ACCEPTED', 'PAID'].includes(r.status)).length, icon: Shield, color: 'text-emerald-500' },
             { label: 'Cumulative Yield', value: `$${reports.reduce((p, c) => p + (c.bountyAmount || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-500' }
           ].map((stat) => (
             <div key={stat.label} className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-6 rounded-[2rem] flex items-center justify-between group hover:border-white/10 transition-all">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                   <p className="text-2xl font-black text-white">{stat.value}</p>
                </div>
                <div className={`p-4 bg-[hsl(var(--text-main))]/[0.02] rounded-2xl ${stat.color} group-hover:scale-110 transition-transform`}>
                   <stat.icon className="w-6 h-6" />
                </div>
             </div>
           ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
