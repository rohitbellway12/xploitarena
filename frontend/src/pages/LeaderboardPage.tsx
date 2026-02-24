import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Trophy, Medal, Target, ArrowUpRight, Search } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/researcher/leaderboard');
        setLeaderboard(res.data);
      } catch (error) {
        console.error('Fetch Leaderboard Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalBounties: leaderboard.reduce((sum, r) => sum + (r.totalEarnings || 0), 0),
    activeAgents: leaderboard.length,
    totalSignals: leaderboard.reduce((sum, r) => sum + (r.reportCount || 0), 0)
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 p-4 md:p-8">
        
        {/* Simplified Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Global Leaderboard</h1>
            <p className="text-slate-500 text-sm">Top security researchers by impact and rewards</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">${(stats.totalBounties / 1000).toFixed(1)}K</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Payout</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.activeAgents}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Researchers</p>
            </div>
          </div>
        </div>

        {/* Podium - Compact and Professional */}
        {!loading && filteredLeaderboard.length >= 3 && searchTerm === '' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
             {/* 2nd Place */}
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl text-center space-y-3 shadow-sm order-2 md:order-1">
                <Medal className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg mx-auto flex items-center justify-center text-lg font-bold text-slate-500">
                    {filteredLeaderboard[1].name[0]}
                </div>
                <div>
                   <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{filteredLeaderboard[1].name}</h3>
                   <p className="text-xs font-bold text-emerald-600">${filteredLeaderboard[1].totalEarnings.toLocaleString()}</p>
                </div>
             </div>

             {/* 1st Place */}
             <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500/20 p-6 rounded-xl text-center space-y-4 shadow-md order-1 md:order-2 md:scale-105">
                <Trophy className="w-8 h-8 text-amber-500 mx-auto" />
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl mx-auto flex items-center justify-center text-2xl font-bold text-indigo-600">
                   {filteredLeaderboard[0].name[0]}
                </div>
                <div>
                   <h3 className="font-bold text-base text-slate-900 dark:text-white">{filteredLeaderboard[0].name}</h3>
                   <p className="text-lg font-bold text-emerald-600 font-mono">${filteredLeaderboard[0].totalEarnings.toLocaleString()}</p>
                </div>
             </div>

             {/* 3rd Place */}
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl text-center space-y-3 shadow-sm order-3">
                <Medal className="w-6 h-6 text-amber-700 mx-auto" />
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-lg mx-auto flex items-center justify-center text-lg font-bold text-amber-800">
                   {filteredLeaderboard[2].name[0]}
                </div>
                <div>
                   <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{filteredLeaderboard[2].name}</h3>
                   <p className="text-xs font-bold text-emerald-600">${filteredLeaderboard[2].totalEarnings.toLocaleString()}</p>
                </div>
             </div>
          </div>
        )}

        {/* Directory Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl shadow-sm">
           <div className="flex items-center gap-2 px-3">
              <Target className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Rankings</h2>
           </div>
           <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search researchers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
           </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-20">Rank</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Researcher</th>
                       <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Findings</th>
                       <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Overall Payout</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-6 py-6"><div className="h-4 w-1/3 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                        </tr>
                      ))
                    ) : filteredLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-sm italic">No records found.</td>
                      </tr>
                    ) : (
                      filteredLeaderboard.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-500">
                             #{String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xs font-bold text-indigo-600">
                                   {r.name[0]}
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{r.name}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {r.reportCount} Reports
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2 font-mono text-sm font-bold text-emerald-600">
                                ${r.totalEarnings.toLocaleString()}
                                <ArrowUpRight size={14} className="opacity-40" />
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
