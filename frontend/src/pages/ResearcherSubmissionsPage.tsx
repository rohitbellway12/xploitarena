import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { 
  FileText, 
  Search, 
  Shield,
  Clock,
  DollarSign,
  
} from 'lucide-react';
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
      case 'PAID': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500/20';
      case 'ACCEPTED': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500/20';
      case 'TRIAGED': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-500/20';
      case 'REJECTED': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-500/20';
      case 'DRAFT': return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 border-slate-500/20';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 p-4 md:p-8">
        
        {/* Simplified Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
               <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Submissions</h1>
              <p className="text-slate-500 text-sm">Review your security research findings</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-sm overflow-x-auto no-scrollbar">
           {['ALL', 'TRIAGED', 'ACCEPTED', 'PAID', 'DRAFT'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  filterStatus === status 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status}
              </button>
           ))}
        </div>

        {/* Reports Table - Compact and Clean */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Report Detail</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Program</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                       <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payout</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-6 py-6"><div className="h-4 w-1/3 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                        </tr>
                      ))
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-sm italic">
                          No submissions found. 
                          <button 
                            onClick={() => navigate('/researcher/programs')} 
                            className="ml-2 text-indigo-600 font-bold hover:underline"
                          >
                            Browse Programs
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr 
                          key={report.id} 
                          onClick={() => navigate(`/reports/${report.id}`)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4 text-sm">
                             <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-all line-clamp-1">{report.title}</span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-2 mt-1">
                                   <Clock size={10} /> {new Date(report.createdAt).toLocaleDateString()} • ID: {report.id.slice(-6).toUpperCase()}
                                </span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400">
                                   <Shield size={12} />
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{report.program.name}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(report.status)}`}>
                                {report.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-sm font-bold font-mono text-emerald-600">
                                {report.bountyAmount > 0 ? `$${report.bountyAmount.toLocaleString()}` : <span className="text-slate-400 text-[10px]">PENDING</span>}
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Footer Stats - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
           {[
             { label: 'Submissions', value: reports.length, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
             { label: 'Accepted', value: reports.filter(r => ['TRIAGED', 'ACCEPTED', 'PAID'].includes(r.status)).length, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
             { label: 'Total Payout', value: `$${reports.reduce((p, c) => p + (c.bountyAmount || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
           ].map((stat) => (
             <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stat.value}</p>
                </div>
                <div className={`p-3 ${stat.bg} ${stat.color} rounded-lg`}>
                   <stat.icon size={18} />
                </div>
             </div>
           ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
