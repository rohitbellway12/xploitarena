import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { ShieldCheck, Award, ChevronRight, Search, Filter } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING'>('ALL');
  const [search, setSearch] = useState('');

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

  const isEventLive = (start: string, end: string) => {
    const now = new Date();
    return now >= new Date(start) && now <= new Date(end);
  };

  const isUpcoming = (start: string) => new Date() < new Date(start);

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const live = isEventLive(e.startDate, e.endDate);
    const upcoming = isUpcoming(e.startDate);
    if (filter === 'LIVE') return matchesSearch && live;
    if (filter === 'UPCOMING') return matchesSearch && upcoming;
    return matchesSearch;
  });

  const liveCount = events.filter(e => isEventLive(e.startDate, e.endDate)).length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-20 p-4 md:p-8">

        {/* --- Simple Compact Header --- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Event Directory</h1>
            <p className="text-slate-500 text-sm">Active and upcoming bug bounty missions</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{events.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-500">{liveCount}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-indigo-500">{events.filter(e => isUpcoming(e.startDate)).length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Upcoming</p>
            </div>
          </div>
        </div>

        {/* --- Simple Filter Bar --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl shadow-sm">
          <div className="flex items-center gap-1">
            {(['ALL', 'LIVE', 'UPCOMING'] as const).map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search missions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* --- Compact Events Grid --- */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
              <Filter className="w-10 h-10 text-slate-300" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Missions Found</h3>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search query.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event) => {
                const live = isEventLive(event.startDate, event.endDate);
                const upcoming = isUpcoming(event.startDate);
                

                return (
                  <div key={event.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/40 transition-all flex flex-col shadow-sm">
                    <div className="p-5 flex flex-col gap-4 flex-1">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${live ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
                          <Award size={20} />
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          live
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : upcoming
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}>
                          {live ? 'Live' : upcoming ? 'Upcoming' : 'Ended'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">{event.name}</h3>
                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                          {event.scope || event.description || 'Global mission assets and objectives.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rewards</p>
                          <p className="text-base font-bold text-emerald-600 font-mono">{event.rewards || 'Bounty Pool'}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/events/${event.id}/dashboard`)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                          Details <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* --- Rules Footer --- */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Professional Conduct</h4>
            <p className="text-slate-500 text-xs truncate">Please adhere to the mission guidelines and ethical disclosure policies.</p>
          </div>
          <button className="hidden sm:block px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
            Guidelines
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
