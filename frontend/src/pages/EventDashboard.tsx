import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { Trophy, Calendar, Target, Award, ExternalLink } from 'lucide-react';
import api from '../api/axios';
import { io } from 'socket.io-client';

export default function EventDashboard() {
   const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
      if (!id) return;
      fetchEventDashboard();
   }, [id]);

    useEffect(() => {
      if (!id) return;
      const socket = io(import.meta.env.VITE_API_URL || '', { transports: ['websocket'] });
      socket.on('connect', () => {
         socket.emit('subscribe_event', id);
      });
      socket.on('metrics', (msg: any) => {
         setEventData((prev: { stats: any; } | null) => prev ? { ...prev, stats: { ...(prev.stats || {}), totalReports: msg.totalReports, totalBounty: msg.totalBounty, resolvedReports: msg.resolvedReports } } : prev);
      });
      socket.on('leaderboard:update', (payload: any) => {
         setEventData((prev: any) => prev ? { ...prev, leaderboard: payload } : prev);
      });
      socket.on('schedule:update', (entry: any) => {
         // optional: show toast or refresh schedules
         console.info('New schedule', entry);
      });
      return () => {
         socket.emit('unsubscribe_event', id);
         socket.disconnect();
      };
   }, [id]);

  const fetchEventDashboard = async () => {
    try {
      const res = await api.get(`/events/${id}/dashboard`);
      setEventData(res.data);
    } catch (error) {
      console.error('Fetch Event Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  };

   const schedulePentestHandler = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
         const formEl = e.currentTarget as HTMLFormElement;
         const form = new FormData(formEl);
         const payload = { scheduledAt: form.get('scheduledAt'), vendor: form.get('vendor'), notes: form.get('notes') };
         await api.post(`/events/${id}/schedule-pentest`, payload);
         alert('Pentest scheduled');
      } catch (err) {
         console.error(err);
         alert('Failed to schedule pentest');
      }
   };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!eventData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center opacity-50">
           <Trophy className="w-16 h-16 mb-4" />
           <h2 className="text-xl font-bold">Event Not Found</h2>
        </div>
      </DashboardLayout>
    );
  }

   const { event, stats, leaderboard = [] } = eventData || {};
   const isLive = event && new Date() >= new Date(event.startDate) && new Date() <= new Date(event.endDate);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-900/30 border border-indigo-500/30 p-8 md:p-12">
           <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
              <div>
                 <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${isLive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
                       {isLive ? 'LIVE NOW' : 'FINISHED'}
                    </span>
                    <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">
                       {event.type.replace('_', ' ')}
                    </span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                    {event.name}
                 </h1>
                 <div className="flex items-center gap-6 text-sm font-bold text-indigo-200/70 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-2"><Award className="w-4 h-4" /> {event.rewards || 'Bounty Pool'}</span>
                 </div>
              </div>

              <div className="flex items-end">
                 <div className="flex gap-4">
                    <div className="text-center p-4 bg-slate-900/50 rounded-2xl border border-indigo-500/20 backdrop-blur-md">
                       <p className="text-3xl font-black text-white">{stats?.totalReports ?? 0}</p>
                       <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Submissions</p>
                    </div>
                    <div className="text-center p-4 bg-slate-900/50 rounded-2xl border border-indigo-500/20 backdrop-blur-md">
                       <p className="text-3xl font-black text-emerald-400">${stats?.totalBounty ? Number(stats.totalBounty).toLocaleString() : '0'}</p>
                       <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Paid Out</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Leaderboard Column */}
           <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[hsl(var(--text-main))]">
                 <Trophy className="w-5 h-5 text-amber-500" />
                 Live Leaderboard
              </h2>
              
              <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2rem] overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-[hsl(var(--bg-main))]/[0.05] border-b border-[hsl(var(--border-subtle))]">
                          <tr>
                             <th className="p-5 text-xs font-black uppercase tracking-widest text-[hsl(var(--text-muted))]">Rank</th>
                             <th className="p-5 text-xs font-black uppercase tracking-widest text-[hsl(var(--text-muted))]">Hacker</th>
                             <th className="p-5 text-xs font-black uppercase tracking-widest text-[hsl(var(--text-muted))] text-right">Points</th>
                             <th className="p-5 text-xs font-black uppercase tracking-widest text-[hsl(var(--text-muted))] text-right">Bounty</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                          {leaderboard.map((entry: any, index: number) => (
                             <tr key={entry.researcherId} className="hover:bg-indigo-500/[0.02] transition-colors">
                                <td className="p-5">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                                      index === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                                      index === 1 ? 'bg-slate-300 text-slate-800' :
                                      index === 2 ? 'bg-amber-700 text-amber-200' :
                                      'bg-[hsl(var(--bg-main))] text-[hsl(var(--text-muted))]'
                                   }`}>
                                      {index + 1}
                                   </div>
                                </td>
                                <td className="p-5 font-bold text-[hsl(var(--text-main))]">
                                   {entry.researcher.firstName} {entry.researcher.lastName}
                                </td>
                                <td className="p-5 text-right font-black text-indigo-400">
                                   {entry.points}
                                </td>
                                <td className="p-5 text-right font-bold text-emerald-400">
                                   ${entry.totalBounty.toLocaleString()}
                                </td>
                             </tr>
                          ))}
                          {leaderboard.length === 0 && (
                             <tr>
                                <td colSpan={4} className="p-10 text-center text-slate-500 font-bold">No submissions yet. Be the first!</td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>

           {/* Scope & Programs Column */}
           <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[hsl(var(--text-main))]">
                 <Target className="w-5 h-5 text-rose-500" />
                 Target Scope
              </h2>
              
              <div className="space-y-4">
                 {event.programs.map((prog: any) => (
                    <div key={prog.id} className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-5 hover:border-indigo-500/30 transition-all group cursor-pointer" onClick={() => navigate(`/programs/${prog.id}`)}>
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors">{prog.name}</h3>
                          <ExternalLink className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--text-muted))]">
                          <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                             {prog.programType}
                          </span>
                       </div>
                    </div>
                 ))}
                 {event.programs.length === 0 && (
                    <div className="p-6 text-center border border-dashed border-[hsl(var(--border-subtle))] rounded-2xl text-[hsl(var(--text-muted))]">
                       No programs linked yet.
                    </div>
                 )}
                
                {/* Schedule Pentest (Admin quick form) */}
                <div className="mt-4 p-4 bg-[hsl(var(--bg-card))] rounded-2xl border border-[hsl(var(--border-subtle))]">
                   <h4 className="font-bold mb-2">Schedule Pentest</h4>
                   <form onSubmit={schedulePentestHandler} className="space-y-2">
                      <input name="scheduledAt" type="datetime-local" className="w-full p-2 rounded bg-transparent border border-slate-700" />
                      <input name="vendor" placeholder="Vendor name (optional)" className="w-full p-2 rounded bg-transparent border border-slate-700" />
                      <textarea name="notes" placeholder="Notes" className="w-full p-2 rounded bg-transparent border border-slate-700" />
                      <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded">Schedule</button>
                   </form>
                </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
