import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Shield, FileText, CheckCircle, Clock, AlertCircle, ChevronRight, X, Filter, Search, User, Target } from 'lucide-react';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [statsData, setStatsData] = useState({ pending: 0, triaging: 0, resolved: 0, critical: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [triagers, setTriagers] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Filters
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
    fetchTriagers();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/triage/all');
      setReports(response.data.reports);
      setStatsData(response.data.stats);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports telemetry');
    } finally {
      setLoading(false);
    }
  };

  const fetchTriagers = async () => {
    try {
      const response = await api.get('/admin/triagers');
      setTriagers(response.data);
    } catch (error) {
      console.error('Error fetching triagers:', error);
    }
  };

  const handleBulkAssign = async (triagerId: string) => {
    if (selectedReportIds.length === 0) return;
    
    setIsAssigning(true);
    try {
      await api.patch('/reports/bulk-assign', { 
        reportIds: selectedReportIds,
        triagerId 
      });
      toast.success(`Protocol: ${selectedReportIds.length} reports reassigned`);
      setSelectedReportIds([]);
      setShowAssignModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Bulk Assign Error:', error);
      toast.error('Assignment protocol failed');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredReports = reports.filter((r: any) => {
    const matchesSeverity = filterSeverity === 'ALL' || r.severity === filterSeverity;
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.program.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const stats = [
    { label: 'Pending Signals', value: statsData.pending, icon: Clock, color: 'text-amber-500' },
    { label: 'Under Analysis', value: statsData.triaging, icon: Shield, color: 'text-indigo-500' },
    { label: 'Zero-Day Validated', value: statsData.resolved, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Critical Vectors', value: statsData.critical, icon: AlertCircle, color: 'text-rose-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[hsl(var(--border-subtle))] pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">Reports Command</span>
            </div>
            <h1 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight flex items-center gap-3 lowercase">
               <Target className="w-8 h-8 text-indigo-500" />
               Signal <span className="text-indigo-500">Intelligence</span> Archive
            </h1>
            <p className="text-[hsl(var(--text-muted))] text-sm mt-1 font-medium">Platform-wide infiltration report management and triager orchestration.</p>
          </div>
          
          <div className="flex gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))] group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ID, Program or Title..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-4 py-3 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl text-xs font-bold focus:border-indigo-500 outline-none transition-all w-64 uppercase tracking-widest placeholder:lowercase" 
                />
             </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[hsl(var(--bg-card))] p-6 rounded-3xl border border-[hsl(var(--border-subtle))] shadow-sm transition-all hover:border-indigo-500/20 flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em] opacity-70">{stat.label}</p>
                <p className="text-3xl font-black mt-1 text-[hsl(var(--text-main))]">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className={`p-3.5 rounded-2xl bg-[hsl(var(--text-main))]/[0.03] ${stat.color} group-hover:bg-indigo-500/10 transition-colors`}>
                <stat.icon size={24} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-[hsl(var(--bg-card))] p-4 rounded-3xl border border-[hsl(var(--border-subtle))]">
           <div className="flex items-center gap-3 text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-4 border-r border-[hsl(var(--border-subtle))]">
              <Filter className="w-4 h-4" />
              Intelligence Filters
           </div>
           
           <div className="flex gap-2">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
                 <button 
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterSeverity === s ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-[hsl(var(--text-muted))] hover:bg-white/5'}`}
                 >
                   {s}
                 </button>
              ))}
           </div>
           
           <div className="h-6 w-px bg-[hsl(var(--border-subtle))] mx-2"></div>
           
           <div className="flex gap-2">
              {['ALL', 'SUBMITTED', 'TRIAGING', 'RESOLVED'].map(s => (
                 <button 
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-[hsl(var(--text-muted))] hover:bg-white/5'}`}
                 >
                   {s}
                 </button>
              ))}
           </div>
        </div>

        {/* Table Environment */}
        <div className="relative bg-[hsl(var(--bg-card))] rounded-[2.5rem] border border-[hsl(var(--border-subtle))] overflow-hidden shadow-sm">
          <AnimatePresence>
            {selectedReportIds.length > 0 && (
              <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute top-12 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20">
                    {selectedReportIds.length}
                  </div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Signals Selected</span>
                </div>
                
                <div className="h-6 w-px bg-slate-700"></div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowAssignModal(true)}
                    className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    Bulk Analyst Assignment
                  </button>
                  <button 
                    onClick={() => setSelectedReportIds([])}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--text-muted))] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[hsl(var(--border-subtle))] bg-white/5">
                  <th className="px-8 py-5 w-10">
                    <input 
                      type="checkbox" 
                      checked={filteredReports.length > 0 && selectedReportIds.length === filteredReports.length}
                      onChange={() => {
                        if (selectedReportIds.length === filteredReports.length) setSelectedReportIds([]);
                        else setSelectedReportIds(filteredReports.map((r: any) => r.id));
                      }}
                      className="rounded border-[hsl(var(--border-subtle))] bg-slate-800 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em]">Signal Identity</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em]">Program Node</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em]">Risk Vector</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em] text-center">Analyst</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em]">Telemetry</th>
                  <th className="px-6 py-5 text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em] text-right">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-8 py-6"><div className="h-4 bg-white/5 rounded-full w-full"></div></td>
                    </tr>
                  ))
                ) : filteredReports.length > 0 ? (
                  filteredReports.map((report: any) => (
                    <tr key={report.id} className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${selectedReportIds.includes(report.id) ? 'bg-indigo-500/[0.04]' : ''}`}>
                      <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedReportIds.includes(report.id)}
                          onChange={() => {
                            setSelectedReportIds(prev => prev.includes(report.id) ? prev.filter(id => id !== report.id) : [...prev, report.id]);
                          }}
                          className="rounded border-[hsl(var(--border-subtle))] bg-slate-800 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-6 font-bold text-sm text-[hsl(var(--text-main))] uppercase tracking-tight">
                         <div className="flex flex-col">
                            {report.title}
                            <span className="text-[10px] text-[hsl(var(--text-muted))] mt-1 opacity-50 tracking-widest font-black">SIG_ID://{report.id.slice(-8).toUpperCase()}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6 text-xs font-black text-indigo-400 uppercase tracking-widest">{report.program.name}</td>
                      <td className="px-6 py-6">
                        <span className={`text-[10px] font-black uppercase border px-2.5 py-1 rounded-lg ${
                          report.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          report.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          report.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex items-center justify-center gap-2">
                            {report.triager ? (
                               <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black">{report.triager.firstName[0]}</div>
                                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{report.triager.firstName}</span>
                               </div>
                            ) : (
                               <span className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest opacity-30 italic">Unassigned</span>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-6 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-6 text-right">
                         <div className="flex items-center justify-end gap-4">
                            <span className={`text-[9px] font-black tracking-[0.2em] px-3 py-1 rounded-full uppercase border ${
                              report.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-lg shadow-emerald-500/10' :
                              report.status === 'SUBMITTED' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20 shadow-lg shadow-sky-500/10' :
                              report.status === 'TRIAGING' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-lg shadow-indigo-500/10' :
                              'bg-white/5 text-[hsl(var(--text-muted))] border-[hsl(var(--border-subtle))]'
                            }`}>
                              {report.status}
                            </span>
                            <ChevronRight className="w-4 h-4 text-[hsl(var(--text-muted))] group-hover:text-indigo-400 transition-all translate-x-1" />
                         </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-8 py-32 text-center">
                      <div className="inline-flex items-center justify-center p-6 rounded-[2rem] bg-indigo-500/5 text-indigo-400 mb-6 border border-indigo-500/10">
                        <FileText size={48} />
                      </div>
                      <h3 className="text-xl font-black text-[hsl(var(--text-main))] uppercase tracking-[0.2em]">Intelligence Void</h3>
                      <p className="text-[hsl(var(--text-muted))] mt-2 font-bold max-w-sm mx-auto text-xs uppercase tracking-widest opacity-50">
                        Signal sensors are active but no data currently matches your filter parameters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assign Modal */}
        <AnimatePresence>
          {showAssignModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="p-8 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between bg-indigo-500/5">
                  <div>
                    <h3 className="text-sm font-black text-[hsl(var(--text-main))] uppercase tracking-[0.2em]">Analyst Deployment</h3>
                    <p className="text-[10px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-1">Assign {selectedReportIds.length} signals to a specific unit.</p>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-[hsl(var(--text-muted))] hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-8 space-y-4">
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {triagers.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => handleBulkAssign(t.id)}
                        disabled={isAssigning}
                        className="w-full p-5 rounded-3xl border border-[hsl(var(--border-subtle))] bg-white/[0.02] hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-sm border border-indigo-500/20">
                            {t.firstName[0]}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black text-[hsl(var(--text-main))] uppercase tracking-widest">{t.firstName} {t.lastName}</p>
                            <p className="text-[10px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-tighter opacity-70">Unit: {t.role.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[hsl(var(--text-muted))] group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                    
                    {triagers.length === 0 && (
                      <div className="text-center py-10 opacity-40">
                         <User className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Active Units Detected</p>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleBulkAssign('')}
                    disabled={isAssigning}
                    className="w-full py-5 rounded-3xl border border-dashed border-rose-500/20 text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                    Terminate Current Assignments
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default AdminReportsPage;
