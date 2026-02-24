import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Shield, 
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
      name: 'Total Findings', 
      value: stats?.totalReports || 0, 
      icon: Bug, 
      color: 'text-indigo-600 dark:text-indigo-400', 
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    { 
      name: 'Total Rewards', 
      value: stats?.totalRewards || '$0', 
      icon: Trophy, 
      color: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    { 
      name: 'Global Impact', 
      value: (stats?.fixedBugs || 0) * 100, 
      icon: Zap, 
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full space-y-6 animate-pulse p-4 md:p-8 max-w-6xl mx-auto">
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          </div>
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
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
               <Shield size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome back, {user?.firstName || 'Researcher'}</h1>
              <p className="text-slate-500 text-sm">Security Research Specialist</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={() => navigate('/researcher/programs')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <Target size={16} /> Program Directory
            </button>
            <button 
              onClick={() => navigate('/researcher/submissions')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <FileText size={16} /> Submissions
            </button>
          </div>
        </div>

        {/* Compact Event Banner */}
        {activeEvents.length > 0 && (
          <div 
            onClick={() => navigate(`/events/${activeEvents[0].id}/dashboard`)}
            className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all shadow-sm"
          >
            <div className="flex items-center gap-4">
              <Trophy className="text-indigo-600 dark:text-indigo-400" size={20} />
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Live Event Active</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">{activeEvents[0].name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:block text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Rewards</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{activeEvents[0].rewards}</p>
              </div>
              <ChevronRight className="text-slate-400" size={20} />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className={`p-3 ${stat.bg} ${stat.color} rounded-lg`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.name}</p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</h2>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content: Recent Reports */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/30">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" /> Recent Reports
                </h3>
                <button onClick={() => navigate('/researcher/submissions')} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors">View All</button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportsLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                          <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded ml-auto"></div></td>
                        </tr>
                      ))
                    ) : reports.filter(r => r.status !== 'DRAFT').length === 0 ? (
                      <tr>
                        <td className="px-6 py-12 text-center text-slate-400 text-sm italic">No recent activity</td>
                      </tr>
                    ) : (
                      reports.filter(r => r.status !== 'DRAFT').slice(0, 5).map((report) => (
                        <tr 
                          key={report.id} 
                          onClick={() => navigate(`/reports/${report.id}`)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate max-w-sm">{report.title}</span>
                              <span className="text-[10px] font-medium text-slate-500">{report.program.name} • {new Date(report.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                             <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border ${
                                  report.status === 'PAID' ? 'text-emerald-600 border-emerald-500/20 bg-emerald-500/5' : 'text-indigo-600 border-indigo-500/20 bg-indigo-500/5'
                                }`}>
                                  {report.status}
                                </span>
                                {report.bountyAmount > 0 && (
                                  <span className="text-xs font-bold text-emerald-600 font-mono">${report.bountyAmount.toLocaleString()}</span>
                                )}
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tactical Grid (Teams) */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 rounded-xl flex items-center justify-between text-white shadow-md">
               <div>
                  <h3 className="font-bold uppercase tracking-tight text-lg">Team Operations</h3>
                  <p className="text-indigo-100 text-xs mt-1">Join or create research groups to scale impact</p>
               </div>
               <button onClick={() => navigate('/researcher/teams')} className="px-5 py-2.5 bg-white text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all shadow-sm">
                  Go to Teams
               </button>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Bookmarks */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                 <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Bookmark className="text-amber-500" size={16} />
                    <h3 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Watching</h3>
                 </div>
                 <div className="space-y-1.5">
                   {bookmarks.length === 0 ? (
                     <p className="text-[10px] text-slate-400 italic py-2">No bookmarks</p>
                   ) : (
                     bookmarks.slice(0, 4).map((b: any) => (
                       <div 
                         key={b.id}
                         onClick={() => navigate(`/programs/${b.program.id}`)}
                         className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all cursor-pointer group"
                       >
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white truncate">{b.program.name}</span>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500" />
                       </div>
                     ))
                   )}
                 </div>
            </div>

            {/* Top Programs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
               <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <h3 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} className="text-rose-500" /> Top Programs
                  </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats?.topPrograms.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic">Loading...</div>
                ) : (
                  stats?.topPrograms.slice(0, 5).map((program, idx) => (
                    <div 
                      key={program.id} 
                      onClick={() => navigate(`/programs/${program.id}`)} 
                      className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 truncate uppercase tracking-tight">{program.name}</h4>
                        <span className="text-[10px] font-bold text-rose-500">{program.rewards}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-300 group-hover:text-rose-500">#{idx + 1}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Resources/Support */}
            <div className="bg-indigo-600 rounded-xl p-5 text-white flex flex-col items-center text-center gap-3 shadow-md">
               <ShieldCheck size={32} className="opacity-80" />
               <div>
                  <h4 className="text-sm font-bold uppercase tracking-tight">Archives</h4>
                  <p className="text-[10px] text-indigo-100 uppercase tracking-wider mt-1">Research payload library</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
