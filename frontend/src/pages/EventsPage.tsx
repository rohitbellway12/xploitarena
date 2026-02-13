import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Trophy, Calendar, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
      } catch (error) {
        console.error('Fetch Events Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Live Hacking Events
          </h1>
          <p className="text-slate-400 mt-2">Participate in exclusive, time-bound bug bounty competitions and win mega prizes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
             <div className="col-span-full p-24 text-center text-slate-500">Scanning for active perimeters...</div>
          ) : events.length === 0 ? (
            <div className="col-span-full p-12 bg-slate-800/20 border border-slate-700/50 rounded-3xl text-center space-y-4">
               <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
               <h3 className="text-xl font-bold text-white">No active events right now</h3>
               <p className="text-slate-500 max-w-sm mx-auto">Stay tuned! We are coordinating with top organizations for the next big live hacking event.</p>
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="bg-[#161b2c] border border-slate-800/50 rounded-3xl p-8 space-y-6 hover:border-indigo-500/30 transition-all shadow-xl group">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase italic tracking-tighter">{event.name}</h3>
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded border border-amber-500/20 shadow-sm">
                    Active
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> Start Date
                    </p>
                    <p className="text-white font-bold">{new Date(event.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> End Date
                    </p>
                    <p className="text-white font-bold">{new Date(event.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3" /> Scope Area
                    </p>
                   <p className="text-slate-300 text-sm line-clamp-2">{event.scope}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prize Pool</p>
                      <p className="text-xl font-black text-emerald-400">{event.rewards}</p>
                   </div>
                   <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 group">
                      View Details
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
