import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  ShieldAlert, 
  Bug, 
  Trophy, 
  FileText,
  ChevronRight,
  Zap,
  Target,
  ShieldCheck,
  Bookmark
} from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

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
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, reportsRes, bookmarksRes, eventsRes] = await Promise.all([
          api.get('/researcher/stats'),
          api.get('/researcher/reports'),
          api.get('/researcher/bookmarks'),
          api.get('/events')
        ]);
        setStats(statsRes.data);
        setReports(reportsRes.data);
        setBookmarks(bookmarksRes.data);
        setEvents(eventsRes.data);
      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
        setReportsLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeEvents = events.filter(e => {
    const now = new Date();
    return now >= new Date(e.startDate) && now <= new Date(e.endDate);
  });

  const statCards = [
    { 
      name: 'Findings', 
      value: stats?.totalReports || 0, 
      icon: Bug, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10',
      trend: '+12%',
    },
    { 
      name: 'Earnings', 
      value: stats?.totalRewards || '$0', 
      icon: Trophy, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10',
      trend: 'Top 5%',
    },
    { 
      name: 'Impact', 
      value: (stats?.fixedBugs || 0) * 100, 
      icon: Zap, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      trend: 'Elite',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full space-y-6 animate-pulse p-4 max-w-7xl mx-auto">
          <div className="h-32 bg-[hsl(var(--bg-card))] rounded-[2.5rem] border border-[hsl(var(--border-subtle))]"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-[hsl(var(--bg-card))] rounded-[1.5rem] border border-[hsl(var(--border-subtle))]"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-80 bg-[hsl(var(--bg-card))] rounded-[2rem] border border-[hsl(var(--border-subtle))]"></div>
            <div className="h-80 bg-[hsl(var(--bg-card))] rounded-[2rem] border border-[hsl(var(--border-subtle))]"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 px-4 md:px-6">
        
        {/* Compact Header Section */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-6 md:p-8 shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.08),transparent)] pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                 <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="relative"
                 >
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-600 to-rose-500 rounded-2xl p-0.5 shadow-xl shadow-indigo-500/20">
                       <div className="w-full h-full bg-[hsl(var(--bg-card))] rounded-[0.9rem] flex items-center justify-center text-[hsl(var(--text-main))]">
                          <ShieldAlert className="w-8 h-8 text-indigo-400" />
                       </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[hsl(var(--bg-card))] rounded-full shadow-lg"></div>
                 </motion.div>

                 <div className="space-y-1.5">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                       <Zap className="w-3 h-3 text-indigo-500" />
                       <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-500/80">Clearance L-04</span>
                       <div className="w-1 h-1 rounded-full bg-[hsl(var(--border-subtle))]" />
                       <span className="text-amber-500 text-[8px] font-black uppercase tracking-widest">Elite Member</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-[hsl(var(--text-main))] tracking-tight uppercase">
                      GM, <span className="text-[hsl(var(--text-muted))]">{user?.firstName || 'Operative'}</span>
                    </h1>
                 </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                 <button 
                   onClick={() => navigate('/researcher/programs')}
                   className="flex-1 lg:flex-none px-6 py-3.5 bg-[hsl(var(--bg-main))] hover:bg-[hsl(var(--border-subtle))] text-[hsl(var(--text-main))] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-[hsl(var(--border-subtle))] transition-all flex items-center justify-center gap-2 group"
                 >
                    <Target className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110" />
                    Directory
                 </button>
                 <button 
                   onClick={() => navigate('/researcher/submissions')}
                   className="flex-1 lg:flex-none px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2 border border-indigo-500/50 group"
                 >
                    <FileText className="w-3.5 h-3.5" />
                    Submissions
                 </button>
              </div>
           </div>
        </div>

        {/* Compact Featured Event Banner */}
        {activeEvents.length > 0 && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.98 }}
             animate={{ opacity: 1, scale: 1 }}
             className="group relative overflow-hidden rounded-[2rem] bg-[hsl(var(--bg-card))] border border-indigo-500/20 shadow-xl cursor-pointer"
             onClick={() => navigate(`/events/${activeEvents[0].id}/dashboard`)}
           >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 to-purple-900/10 opacity-40"></div>
              <div className="relative z-10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex gap-5 items-center flex-1">
                    <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
                       <Trophy className="w-7 h-7 text-indigo-500" />
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-500">Live Arena active</span>
                       </div>
                       <h2 className="text-xl font-black text-[hsl(var(--text-main))] tracking-tight uppercase group-hover:text-indigo-500 transition-colors">
                         {activeEvents[0].name}
                       </h2>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-8">
                    <div className="text-center md:text-left">
                       <p className="text-[8px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em]">Bounty Pool</p>
                       <p className="text-xl font-black text-[hsl(var(--text-main))] uppercase">{activeEvents[0].rewards}</p>
                    </div>
                    <button className="px-6 py-3 bg-[hsl(var(--text-main))] hover:opacity-90 text-[hsl(var(--bg-main))] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 active:scale-95 group-hover:shadow-lg">
                       Enter <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>
           </motion.div>
        )}

        {/* Tighter Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <motion.div 
              key={stat.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="relative group bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-6 rounded-[1.5rem] hover:border-indigo-500/30 transition-all duration-300 overflow-hidden shadow-lg"
            >
              <div className="relative z-10 flex items-center gap-5">
                 <div className={`p-4 ${stat.bg} rounded-2xl ${stat.color} shadow-sm group-hover:scale-105 transition-transform`}>
                   <stat.icon className="w-6 h-6" />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em]">{stat.name}</p>
                    <div className="flex items-baseline gap-3">
                       <h2 className="text-2xl font-black text-[hsl(var(--text-main))] tracking-tighter">{stat.value}</h2>
                       <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{stat.trend}</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Signal Feed (Reports) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2rem] overflow-hidden shadow-xl">
              <div className="px-6 py-5 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-main))]/30 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20">
                       <FileText className="w-4 h-4" />
                    </div>
                    <div>
                       <h3 className="text-xs font-black text-[hsl(var(--text-main))] uppercase tracking-widest">Signal Feed</h3>
                    </div>
                 </div>
                 <button onClick={() => navigate('/researcher/submissions')} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400">View All</button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                    {reportsLoading ? (
                       Array(4).fill(0).map((_, i) => (
                         <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4"><div className="h-3 w-40 bg-[hsl(var(--border-subtle))] rounded-full"></div></td>
                            <td className="px-6 py-4 text-right"><div className="h-3 w-16 bg-[hsl(var(--border-subtle))] rounded-full ml-auto"></div></td>
                         </tr>
                       ))
                    ) : reports.filter(r => r.status !== 'DRAFT').length === 0 ? (
                      <tr>
                        <td className="px-6 py-20 text-center">
                           <p className="text-[9px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.3em]">No signals detected</p>
                        </td>
                      </tr>
                    ) : (
                      reports.filter(r => r.status !== 'DRAFT').slice(0, 5).map((report) => (
                        <tr 
                          key={report.id} 
                          onClick={() => navigate(`/reports/${report.id}`)}
                          className="hover:bg-[hsl(var(--bg-main))]/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4">
                             <div className="flex flex-col gap-1 min-w-[200px]">
                                <span className="text-xs font-black text-[hsl(var(--text-main))] group-hover:text-indigo-500 transition-colors truncate">{report.title}</span>
                                <div className="flex items-center gap-2 text-[8px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">
                                   <span>{report.program.name}</span>
                                   <div className="w-1 h-1 rounded-full bg-[hsl(var(--border-subtle))]" />
                                   <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-[hsl(var(--border-subtle))] ${
                               report.status === 'PAID' ? 'text-emerald-500' : 'text-indigo-500'
                             }`}>
                               {report.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-xs font-black text-emerald-500 font-mono">
                                {report.bountyAmount > 0 ? `$${report.bountyAmount.toLocaleString()}` : '-'}
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Compact Call to Action */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[2rem] p-6 flex items-center justify-between shadow-xl">
               <div className="flex items-center gap-5">
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                     <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                     <h3 className="text-sm font-black text-white uppercase tracking-tight">Expand Operations</h3>
                     <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mt-1">Recruit or join tactical strike teams</p>
                  </div>
               </div>
               <button onClick={() => navigate('/researcher/teams')} className="px-6 py-3 bg-white text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50">
                  Deploy
               </button>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Surveillance (Bookmarks) */}
            <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2rem] p-6 space-y-5 shadow-xl">
                 <div className="flex items-center gap-3 border-b border-[hsl(var(--border-subtle))] pb-4">
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <h3 className="text-[10px] font-black text-[hsl(var(--text-main))] uppercase tracking-widest">Monitoring</h3>
                 </div>
                 <div className="space-y-2">
                   {bookmarks.length === 0 ? (
                     <p className="text-[8px] font-black text-[hsl(var(--text-muted))] uppercase py-4 text-center">N/A</p>
                   ) : (
                     bookmarks.slice(0, 3).map((b: any) => (
                       <div 
                         key={b.id}
                         onClick={() => navigate(`/programs/${b.program.id}`)}
                         className="flex items-center justify-between p-3 bg-[hsl(var(--bg-main))]/30 hover:bg-[hsl(var(--bg-main))]/60 rounded-xl border border-[hsl(var(--border-subtle))] transition-all cursor-pointer group"
                       >
                          <span className="text-[9px] font-black text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--text-main))] uppercase truncate max-w-[120px]">{b.program.name}</span>
                          <ChevronRight className="w-3 h-3 text-[hsl(var(--text-muted))] group-hover:text-amber-500" />
                       </div>
                     ))
                   )}
                 </div>
            </div>

            {/* Target Rankings */}
            <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2rem] overflow-hidden shadow-xl">
               <div className="px-6 py-4 border-b border-[hsl(var(--border-subtle))] bg-rose-500/[0.03] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                    <h3 className="text-[10px] font-black text-[hsl(var(--text-main))] uppercase tracking-widest">Global Pulse</h3>
                  </div>
              </div>
              <div className="divide-y divide-[hsl(var(--border-subtle))]/40">
                {stats?.topPrograms.length === 0 ? (
                  <div className="p-8 text-center"><p className="text-[8px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Standby...</p></div>
                ) : (
                  stats?.topPrograms.slice(0, 4).map((program, idx) => (
                    <div 
                      key={program.id} 
                      onClick={() => navigate(`/programs/${program.id}`)} 
                      className="px-6 py-3.5 flex items-center justify-between hover:bg-[hsl(var(--bg-main))]/40 transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 pr-4 space-y-0.5">
                        <h4 className="text-[9px] font-black text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--text-main))] truncate uppercase tracking-tight">{program.name}</h4>
                        <span className="text-[8px] font-black text-rose-500 uppercase">{program.rewards}</span>
                      </div>
                      <span className="text-[10px] font-black font-mono text-[hsl(var(--text-muted))] group-hover:text-rose-500">#{idx + 1}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Archives (Promo) */}
            <div className="bg-indigo-600 rounded-[2rem] p-6 text-white relative overflow-hidden group cursor-pointer shadow-xl">
               <div className="relative z-10 space-y-4 text-center">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto border border-white/10 group-hover:scale-110 transition-transform">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="text-xs font-black uppercase tracking-tight">Archives</h4>
                     <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">Encrypted Payload Lib</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
