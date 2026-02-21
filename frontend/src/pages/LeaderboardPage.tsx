import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Trophy, Medal, Target, ArrowUpRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';

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

  // Derive real statistics from the leaderboard data
  const stats = {
    totalBounties: leaderboard.reduce((sum, r) => sum + (r.totalEarnings || 0), 0),
    activeAgents: leaderboard.length,
    totalSignals: leaderboard.reduce((sum, r) => sum + (r.reportCount || 0), 0),
    avgPayout: leaderboard.length > 0 
      ? Math.round(leaderboard.reduce((sum, r) => sum + (r.totalEarnings || 0), 0) / leaderboard.length) 
      : 0
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl mx-auto space-y-8 pb-20 px-4">
        {/* --- Hero / Header Section (More Compact) --- */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-1 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 via-slate-950 to-emerald-500/5" />
          <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full" />
          
          <div className="relative z-10 bg-slate-950/40 backdrop-blur-3xl rounded-[2.4rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 border border-white/[0.03]">
             <div className="space-y-4 text-center lg:text-left max-w-lg">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20"
                >
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300">Live Ranking Protocol</span>
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight"
                >
                  THE <span className="text-indigo-500">ELITE</span> REGISTRY
                </motion.h1>

                <p className="text-slate-400 font-medium text-xs md:text-sm leading-relaxed max-w-md">
                  Real-time analytics of high-impact security researchers. Data refreshed from global signal intelligence.
                </p>
             </div>

             <div className="grid grid-cols-2 gap-3 w-full lg:w-auto min-w-[320px]">
                {[
                  { label: 'Total Bounties', value: `$${(stats.totalBounties / 1000).toFixed(1)}K`, color: 'text-emerald-400' },
                  { label: 'Agents', value: stats.activeAgents, color: 'text-indigo-400' },
                  { label: 'Total Signals', value: stats.totalSignals, color: 'text-rose-400' },
                  { label: 'Avg Payout', value: `$${stats.avgPayout.toLocaleString()}`, color: 'text-white' },
                ].map((stat, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + (i * 0.05) }}
                    key={stat.label} 
                    className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex flex-col gap-0.5"
                  >
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                    <p className={`text-lg font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>

        {/* --- Top 3 Hall of Fame Podium (More Compact) --- */}
        {!loading && filteredLeaderboard.length >= 3 && searchTerm === '' && (
          <div className="flex flex-col items-center gap-10 relative py-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end w-full max-w-4xl mx-auto px-4">
                {/* --- 2nd Place --- */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative group order-2 md:order-1"
                >
                  <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] text-center space-y-4 shadow-xl backdrop-blur-xl relative z-10">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 flex items-center justify-center">
                       <Medal className="w-8 h-8 text-slate-400 drop-shadow-[0_0_10px_rgba(148,163,184,0.3)]" />
                    </div>
                    <div className="w-16 h-16 bg-slate-400/10 rounded-2xl mx-auto p-1 border border-slate-400/20">
                       <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-xl font-black text-slate-400 overflow-hidden">
                          {filteredLeaderboard[1].avatar ? <img src={filteredLeaderboard[1].avatar} className="w-full h-full object-cover" /> : filteredLeaderboard[1].name[0]}
                       </div>
                    </div>
                    <div className="space-y-0.5">
                       <h3 className="font-black text-sm text-white uppercase tracking-tight truncate">{filteredLeaderboard[1].name}</h3>
                       <p className="text-[10px] font-black text-slate-400 font-mono">${filteredLeaderboard[1].totalEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>

                {/* --- 1st Place --- */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group order-1 md:order-2 z-20 md:scale-105"
                >
                  <div className="bg-slate-900 border-2 border-amber-500/20 p-8 rounded-[3rem] text-center space-y-5 shadow-[0_30px_60px_-10px_rgba(245,158,11,0.15)] backdrop-blur-3xl relative z-10">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 flex items-center justify-center">
                       <Trophy className="w-12 h-12 text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
                    </div>
                    <div className="w-24 h-24 bg-amber-500/10 rounded-[2rem] mx-auto p-1 border border-amber-500/20 ring-4 ring-amber-500/5">
                       <div className="w-full h-full rounded-[1.8rem] bg-slate-950 flex items-center justify-center text-2xl font-black text-amber-500 overflow-hidden">
                          {filteredLeaderboard[0].avatar ? <img src={filteredLeaderboard[0].avatar} className="w-full h-full object-cover" /> : filteredLeaderboard[0].name[0]}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <h3 className="font-black text-lg text-white uppercase tracking-tight">{filteredLeaderboard[0].name}</h3>
                       <p className="text-2xl font-black text-amber-400 font-mono tracking-tighter">${filteredLeaderboard[0].totalEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>

                {/* --- 3rd Place --- */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative group order-3"
                >
                  <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] text-center space-y-4 shadow-xl backdrop-blur-xl relative z-10">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center">
                       <Medal className="w-7 h-7 text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.3)]" />
                    </div>
                    <div className="w-14 h-14 bg-amber-700/10 rounded-2xl mx-auto p-1 border border-amber-700/20">
                       <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-xl font-black text-amber-700 overflow-hidden">
                          {filteredLeaderboard[2].avatar ? <img src={filteredLeaderboard[2].avatar} className="w-full h-full object-cover" /> : filteredLeaderboard[2].name[0]}
                       </div>
                    </div>
                    <div className="space-y-0.5">
                       <h3 className="font-black text-sm text-white uppercase tracking-tight truncate">{filteredLeaderboard[2].name}</h3>
                       <p className="text-[10px] font-black text-slate-500 font-mono">${filteredLeaderboard[2].totalEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
             </div>
          </div>
        )}

        {/* --- Directory & Filters --- */}
        <div className="space-y-6 pt-6">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
              <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                 <Target className="w-6 h-6 text-indigo-500" />
                 Operative Directory
              </h2>
              
              <div className="relative w-full md:w-80 group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400" />
                 <input 
                   type="text"
                   placeholder="SEARCH AGENTS..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-11 pr-6 py-3 text-[10px] font-black uppercase tracking-widest text-white focus:border-indigo-500/50 outline-none transition-all shadow-lg"
                 />
              </div>
           </div>

           <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-xl mx-2">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                          <th className="pl-12 pr-6 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">ID / Rank</th>
                          <th className="px-6 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operative Identity</th>
                          <th className="px-6 py-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Impact Signals</th>
                          <th className="pl-6 pr-12 py-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cumulative Intel Payout</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                       {loading ? (
                         <tr><td colSpan={4} className="p-32 text-center">
                            <div className="inline-flex flex-col items-center gap-4 animate-pulse">
                               <Target className="w-10 h-10 text-indigo-500/40" />
                               <span className="opacity-40 font-black uppercase tracking-[0.6em] text-[10px] text-white">Decrypting Records...</span>
                            </div>
                         </td></tr>
                       ) : filteredLeaderboard.length === 0 ? (
                         <tr><td colSpan={4} className="p-32 text-center opacity-40 font-black uppercase tracking-[0.3em] text-[10px] text-white">Zero Match Correlation Found</td></tr>
                       ) : (
                         filteredLeaderboard.map((r, idx) => (
                           <motion.tr 
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: idx * 0.03 }}
                             key={r.id} 
                             className="hover:bg-white/[0.02] transition-all group cursor-default"
                            >
                              <td className="pl-12 pr-6 py-7">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-[11px] font-black ${
                                    idx === 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                    idx === 1 ? 'bg-slate-400/10 text-slate-400 border border-slate-400/20' :
                                    idx === 2 ? 'bg-amber-700/10 text-amber-700 border border-amber-700/20' :
                                    'bg-white/[0.02] text-slate-600 border border-white/[0.05]'
                                 }`}>
                                    {String(idx + 1).padStart(2, '0')}
                                 </div>
                              </td>
                              <td className="px-6 py-7">
                                 <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-indigo-500/10 to-transparent flex items-center justify-center text-indigo-400 font-black overflow-hidden border border-white/5 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                       {r.avatar ? <img src={r.avatar} className="w-full h-full object-cover" /> : r.name[0]}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                       <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{r.name}</p>
                                       <div className="flex items-center gap-2">
                                          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Operative</p>
                                       </div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-7 text-center">
                                 <div className="inline-flex flex-col items-center">
                                    <span className="px-3 py-1 bg-white/[0.03] text-white text-[9px] font-black rounded-lg border border-white/[0.05] group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-all">
                                       {r.reportCount} SIGNALS
                                    </span>
                                 </div>
                              </td>
                              <td className="pl-6 pr-12 py-7 text-right">
                                 <div className="flex items-center justify-end gap-3 transition-transform group-hover:translate-x-[-4px] duration-500">
                                    <span className="text-emerald-400 font-mono text-sm font-black tracking-tight">
                                       ${r.totalEarnings.toLocaleString()}
                                    </span>
                                    <div className="p-1.5 bg-emerald-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                       <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                 </div>
                              </td>
                           </motion.tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

