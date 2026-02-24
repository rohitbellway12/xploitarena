import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { Trophy, Calendar, Target, Award, ExternalLink } from 'lucide-react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

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
       toast.error('Failed to load event data');
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
         toast.success('Pentest scheduled successfully');
      } catch (err) {
         console.error(err);
         toast.error('Failed to schedule pentest');
      }
   };

   if (loading) {
     return (
       <DashboardLayout>
         <div className="w-full space-y-6 animate-pulse p-4 md:p-8 max-w-6xl mx-auto">
           <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 h-96 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
             <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
           </div>
         </div>
       </DashboardLayout>
     );
   }

   if (!eventData) {
     return (
       <DashboardLayout>
         <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center opacity-50">
            <Trophy size={48} className="mb-4" />
            <h2 className="text-xl font-bold">Event Not Found</h2>
         </div>
       </DashboardLayout>
     );
   }

   const { event, stats, leaderboard = [] } = eventData || {};
   const isLive = event && new Date() >= new Date(event.startDate) && new Date() <= new Date(event.endDate);

   return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-20">
        
        {/* Simplified Header Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-xl shadow-sm">
           <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isLive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                       {isLive ? 'Live Now' : 'Finished'}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                       {event.type.replace('_', ' ')}
                    </span>
                 </div>
                 <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {event.name}
                 </h1>
                 <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><Award size={14} /> {event.rewards || 'Bounty Pool'}</span>
                 </div>
              </div>

              <div className="flex items-end self-end md:self-auto">
                 <div className="flex gap-3">
                    <div className="text-center px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                       <p className="text-xl font-bold text-slate-900 dark:text-white">{stats?.totalReports ?? 0}</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Submissions</p>
                    </div>
                    <div className="text-center px-4 py-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                       <p className="text-xl font-bold text-emerald-600">${stats?.totalBounty ? Number(stats.totalBounty).toLocaleString() : '0'}</p>
                       <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Paid Out</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Leaderboard Column */}
           <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-widest">
                   <Trophy size={16} className="text-amber-500" /> Event Leaderboard
                </h2>
              </div>
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                             <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Rank</th>
                             <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Researcher</th>
                             <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Points</th>
                             <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Bounty</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {leaderboard.map((entry: any, index: number) => (
                             <tr key={entry.researcherId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                   <div className={`w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold ${
                                      index === 0 ? 'text-amber-500' :
                                      index === 1 ? 'text-slate-400' :
                                      index === 2 ? 'text-amber-800' :
                                      'text-slate-500'
                                   }`}>
                                      {index + 1}
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                                   {entry.researcher.firstName} {entry.researcher.lastName}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                   {entry.points}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-mono font-bold text-emerald-600">
                                   ${entry.totalBounty.toLocaleString()}
                                </td>
                             </tr>
                          ))}
                          {leaderboard.length === 0 && (
                             <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-sm italic">No ranking biological data available.</td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>

           {/* Scope & Programs Column */}
           <div className="space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-widest px-2">
                 <Target size={16} className="text-rose-500" /> Target Scope
              </h2>
              
              <div className="space-y-3">
                 {event.programs.map((prog: any) => (
                    <div 
                      key={prog.id} 
                      onClick={() => navigate(`/programs/${prog.id}`)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl hover:border-indigo-500/40 transition-all group cursor-pointer shadow-sm" 
                    >
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{prog.name}</h3>
                          <ExternalLink size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-indigo-500/10">
                             {prog.programType}
                          </span>
                       </div>
                    </div>
                 ))}
                 {event.programs.length === 0 && (
                    <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm">
                       No scope targets defined.
                    </div>
                 )}
                 
                 {/* Internal Program Management (If Admin) */}
                 <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Mission Controls</h4>
                    <form onSubmit={schedulePentestHandler} className="space-y-3">
                       <input 
                         name="scheduledAt" 
                         type="datetime-local" 
                         className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 transition-all" 
                       />
                       <input 
                         name="vendor" 
                         placeholder="Target Vendor" 
                         className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 transition-all" 
                       />
                       <textarea 
                         name="notes" 
                         placeholder="Extraction parameters / notes" 
                         className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 transition-all h-20 resize-none" 
                       />
                       <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm">Schedule Deployment</button>
                    </form>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
