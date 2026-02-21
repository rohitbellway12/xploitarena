import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Calendar, ShieldCheck, Award, ChevronRight, Clock, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="max-w-7xl mx-auto space-y-10 pb-20">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center"
          style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#9333ea 100%)' }}>
          {/* Glow blobs */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04),transparent)] pointer-events-none" />

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="relative z-10 space-y-5">

            {liveCount > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-[10px] font-black uppercase tracking-[0.25em]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                {liveCount} Operation{liveCount > 1 ? 's' : ''} Live Now
              </div>
            )}

            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
              EXPLOIT ARENA<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300">
                COMPETITIONS
              </span>
            </h1>
            <p className="text-white/65 text-base md:text-lg max-w-xl mx-auto font-medium">
              Compete in elite, time-bound bug bounty missions. Earn massive rewards and global recognition.
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-8 pt-2">
              {[
                { label: 'Total Events', value: events.length },
                { label: 'Live Now', value: liveCount },
                { label: 'Upcoming', value: events.filter(e => isUpcoming(e.startDate)).length },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Filter pills */}
          <div className="flex items-center gap-2 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-1.5">
            {(['ALL', 'LIVE', 'UPCOMING'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))]'
                }`}>
                {f === 'LIVE' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />}
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl text-sm focus:outline-none focus:border-indigo-500/60 transition-all placeholder:text-[hsl(var(--text-muted))]/40 text-[hsl(var(--text-main))]"
            />
          </div>
        </div>

        {/* ── EVENTS GRID ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 rounded-3xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] animate-pulse" />
              ))}
            </motion.div>
          ) : filteredEvents.length === 0 ? (
            <motion.div key="empty"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="py-24 flex flex-col items-center gap-5 bg-[hsl(var(--bg-card))] border border-dashed border-[hsl(var(--border-subtle))] rounded-3xl text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <Filter className="w-9 h-9 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[hsl(var(--text-main))]">
                  {search ? 'No Matches Found' : 'Quiet Perimeter'}
                </h3>
                <p className="text-[hsl(var(--text-muted))] text-sm mt-1 max-w-xs mx-auto">
                  {search ? `No events match "${search}".` : 'No active operations. A major mission is being coordinated.'}
                </p>
              </div>
              {search && (
                <button onClick={() => setSearch('')}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Clear Filter
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => {
                const live = isEventLive(event.startDate, event.endDate);
                const upcoming = isUpcoming(event.startDate);
                const durationDays = Math.ceil(
                  (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <motion.div key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group relative bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl overflow-hidden hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.08)] transition-all duration-500 flex flex-col">

                    {/* Card top accent */}
                    <div className={`h-1.5 w-full ${live ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : upcoming ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-[hsl(var(--border-subtle))]'}`} />

                    <div className="p-7 flex flex-col gap-6 flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-2xl ${live ? 'bg-emerald-500/10' : 'bg-indigo-500/10'}`}>
                          <Award className={`w-6 h-6 ${live ? 'text-emerald-500' : 'text-indigo-400'}`} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          live
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse'
                            : upcoming
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-[hsl(var(--bg-main))] text-[hsl(var(--text-muted))] border-[hsl(var(--border-subtle))]'
                        }`}>
                          {live ? '🔴 Live' : upcoming ? 'Scheduled' : 'Ended'}
                        </span>
                      </div>

                      {/* Title & description */}
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-black text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors uppercase tracking-tight leading-tight">
                          {event.name}
                        </h3>
                        <p className="text-[hsl(var(--text-muted))] text-sm leading-relaxed line-clamp-2">
                          {event.scope || event.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Meta grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[hsl(var(--bg-main))] rounded-2xl p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">
                            <Calendar className="w-3 h-3 text-indigo-400" /> Start Date
                          </div>
                          <p className="text-sm font-black text-[hsl(var(--text-main))]">
                            {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="bg-[hsl(var(--bg-main))] rounded-2xl p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">
                            <Clock className="w-3 h-3 text-rose-400" /> Duration
                          </div>
                          <p className="text-sm font-black text-[hsl(var(--text-main))]">{durationDays} Days</p>
                        </div>
                      </div>

                      {/* Prize & CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border-subtle))]">
                        <div>
                          <p className="text-[9px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Prize Pool</p>
                          <p className="text-xl font-black text-emerald-500">{event.rewards || 'TBA'}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/events/${event.id}/dashboard`)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 group/btn active:scale-95">
                          Join Arena
                          <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── RULES BANNER ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-black text-[hsl(var(--text-main))]">Rules of Engagement</h4>
              <p className="text-[hsl(var(--text-muted))] text-sm">Follow ethical disclosure policy for all event findings.</p>
            </div>
          </div>
          <button className="shrink-0 px-6 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] hover:border-indigo-500/40 text-[hsl(var(--text-main))] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            View Guidelines
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
