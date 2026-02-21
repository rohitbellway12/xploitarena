import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Trophy, 
  Calendar, 
  Plus, 
  X, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Target
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    startDate: '',
    endDate: '',
    scope: '',
    rewards: '',
    isPrivate: false,
    type: 'LIVE_HACKING',
    programIds: [] as string[]
  });

  useEffect(() => {
    fetchEvents();
    fetchPrograms();
  }, []);

  const fetchEvents = async () => {
    try {
      // Fetch all events (we might need an admin endpoint if getEvents filters by visibility? 
      // Current getEvents filters isPrivate=false unless we change it.
      // But let's assume getEvents is enough for now, or we'll update backend to show all for admin
      const res = await api.get('/events?type='); 
      setEvents(res.data);
    } catch (error) {
      console.error('Fetch Events Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/programs');
      setPrograms(res.data);
    } catch (error) {
      console.error('Fetch Programs Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/events/${formData.id}`, formData);
        toast.success('Event updated successfully');
      } else {
        await api.post('/events', formData);
        toast.success('Event created successfully');
      }
      setShowModal(false);
      fetchEvents();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleEdit = (event: any) => {
    setFormData({
      id: event.id,
      name: event.name,
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      scope: event.scope || '',
      rewards: event.rewards || '',
      isPrivate: event.isPrivate || false,
      type: event.type || 'LIVE_HACKING',
      programIds: event.programs?.map((p: any) => p.id) || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      startDate: '',
      endDate: '',
      scope: '',
      rewards: '',
      isPrivate: false,
      type: 'LIVE_HACKING',
      programIds: []
    });
  };

  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProgram = (id: string) => {
    setFormData(prev => {
      const exists = prev.programIds.includes(id);
      return {
        ...prev,
        programIds: exists 
          ? prev.programIds.filter(pid => pid !== id)
          : [...prev.programIds, id]
      };
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">Admin Hub</span>
               <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">/ Event Operations</span>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Event Management
            </h1>
          </div>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2+ rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>

        {/* Existing Events List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="h-48 bg-[hsl(var(--bg-card))] rounded-3xl animate-pulse" />)
          ) : filteredEvents.length === 0 ? (
             <div className="col-span-full p-12 text-center opacity-50">No events found. Create one to get started.</div>
          ) : (
            filteredEvents.map(event => (
              <div key={event.id} className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl p-6 space-y-4 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button 
                      onClick={() => handleEdit(event)} 
                      className="p-2 bg-[hsl(var(--bg-main))] text-slate-400 hover:text-white rounded-lg border border-[hsl(var(--border-subtle))] transition-all"
                    >
                       <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id)} 
                      className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                    >
                       <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigate(`/events/${event.id}/dashboard`)} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20">
                       Dashboard
                    </button>
                 </div>
                 
                 <div>
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      event.type === 'PENTEST' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {event.type.replace('_', ' ')}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-2 mb-1">{event.name}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider">
                       <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(event.startDate).toLocaleDateString()}</span>
                       <span>to</span>
                       <span>{new Date(event.endDate).toLocaleDateString()}</span>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-[hsl(var(--border-subtle))]">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Scope</p>
                          <p className="text-xs text-slate-300 line-clamp-1">{event.scope}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Linked Programs</p>
                          <p className="text-xl font-black text-white">{event._count?.programs || 0}</p>
                       </div>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setShowModal(false)}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-2xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2.5rem] shadow-2xl p-8 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                     <Trophy className="w-6 h-6 text-indigo-400" />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-[hsl(var(--text-main))] tracking-tight">Create Event</h2>
                     <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Launch Competition</p>
                   </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[hsl(var(--text-main))]/[0.05] rounded-full transition-colors">
                   <X className="w-5 h-5 text-[hsl(var(--text-muted))]" />
                 </button>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">Event Name</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm outline-none focus:border-indigo-500" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">Event Type</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm outline-none focus:border-indigo-500">
                           <option value="LIVE_HACKING">Live Hacking Event</option>
                           <option value="PENTEST">Pentest / Assessment</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">Start Date</label>
                        <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm outline-none focus:border-indigo-500" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">End Date</label>
                        <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm outline-none focus:border-indigo-500" />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">Rewards Pool / Description</label>
                      <input type="text" value={formData.rewards} onChange={e => setFormData({...formData, rewards: e.target.value})} placeholder="$50,000 Pool + Bonus" className="w-full px-4 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm outline-none focus:border-indigo-500" />
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">Scope (Short Summary)</label>
                      <textarea value={formData.scope} onChange={e => setFormData({...formData, scope: e.target.value})} className="w-full px-4 py-2 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl text-sm outline-none focus:border-indigo-500 h-20 resize-none" />
                  </div>

                  <div className="space-y-2 pt-4 border-t border-[hsl(var(--border-subtle))]">
                     <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase px-1 tracking-widest">Link Programs (Assets)</label>
                     <div className="bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl max-h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {programs.map(prog => (
                           <div key={prog.id} onClick={() => toggleProgram(prog.id)} className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${formData.programIds.includes(prog.id) ? 'bg-indigo-500/20 border border-indigo-500/50' : 'hover:bg-[hsl(var(--text-main))]/[0.05] border border-transparent'}`}>
                              <div className="flex items-center gap-2">
                                 <ShieldCheck className={`w-4 h-4 ${formData.programIds.includes(prog.id) ? 'text-indigo-400' : 'text-slate-500'}`} />
                                 <span className="text-xs font-bold">{prog.name}</span>
                              </div>
                              {formData.programIds.includes(prog.id) && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                           </div>
                        ))}
                        {programs.length === 0 && <div className="text-center text-xs text-slate-500 py-4">No programs available.</div>}
                     </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                     Launch Event
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
