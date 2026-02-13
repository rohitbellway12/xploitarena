import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  ShieldAlert, 
  Bug, 
  Trophy, 
  FileText,
  Search,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';

interface ResearcherStats {
  totalReports: number;
  totalRewards: string;
  fixedBugs: number;
  topPrograms: any[];
}

export default function ResearcherDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ResearcherStats | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/researcher/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch researcher stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    const fetchReports = async () => {
      try {
        const response = await api.get('/researcher/reports');
        setReports(response.data);
      } catch (error) {
        console.error('Failed to fetch researcher reports:', error);
      } finally {
        setReportsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const displayStats = [
    { name: 'Submissions', value: stats?.totalReports || 0, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/5' },
    { name: 'Earnings', value: stats?.totalRewards || '$0', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/5' },
    { name: 'Validated', value: stats?.fixedBugs || 0, icon: ShieldAlert, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
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
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight">Researcher Intelligence</h1>
            <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Operational overview of your security audits and findings.</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => navigate('/researcher/programs')}
               className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2"
             >
                <Search className="w-3.5 h-3.5" />
                Browse Directory
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
          <div className="lg:col-span-2 space-y-8">
            {/* My Submissions Table */}
            <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
              <div className="p-6 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
                <h3 className="text-xs font-bold text-[hsl(var(--text-main))] flex items-center gap-2 tracking-wide uppercase">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Audit History
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Program</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Update</th>
                      <th className="px-6 py-4 text-right">Bounty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                    {reportsLoading ? (
                      <tr><td colSpan={5} className="p-12 text-center text-[hsl(var(--text-muted))]">Loading stream...</td></tr>
                    ) : reports.length === 0 ? (
                      <tr><td colSpan={5} className="p-12 text-center text-[hsl(var(--text-muted))] italic">No historical records found.</td></tr>
                    ) : (
                      reports.map((report) => (
                        <tr 
                          key={report.id} 
                          onClick={() => report.status === 'DRAFT' && navigate(`/reports/${report.id}`)}
                          className={`hover:bg-[hsl(var(--text-main))]/[0.01] transition-colors group ${report.status === 'DRAFT' ? 'cursor-pointer' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors">{report.title}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-[hsl(var(--text-muted))] font-medium">{report.program.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tighter ${
                              report.status === 'DRAFT' ? 'bg-slate-800 text-slate-500' :
                              report.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' :
                              'bg-indigo-500/10 text-indigo-400'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] text-[hsl(var(--text-muted))] font-mono">
                               {new Date(report.updatedAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs font-bold text-emerald-500">
                             {report.bountyAmount > 0 ? `$${report.bountyAmount}` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Featured Bug Bounties */}
            <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
                <h3 className="text-xs font-bold text-[hsl(var(--text-main))] flex items-center gap-2 tracking-wide uppercase">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  High Yield Targets
                </h3>
              </div>
              <div className="divide-y divide-[hsl(var(--border-subtle))]">
                {stats?.topPrograms.map((program) => (
                  <div 
                    key={program.id} 
                    onClick={() => navigate(`/programs/${program.id}`)} 
                    className="px-6 py-4 flex items-center justify-between hover:bg-[hsl(var(--text-main))]/[0.01] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex items-center justify-center">
                        <Bug className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors">{program.name}</h4>
                        <p className="text-[10px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-0.5">
                           {program.type} • {program.rewards}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-[hsl(var(--text-main))] transition-all translate-x-0 group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
