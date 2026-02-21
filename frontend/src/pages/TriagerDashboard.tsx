import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Shield, FileText, CheckCircle, Clock, AlertCircle, ChevronRight, X } from 'lucide-react';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TriagerDashboard = () => {
  const [reports, setReports] = useState([]);
  const [statsData, setStatsData] = useState({ pending: 0, triaging: 0, resolved: 0, critical: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [triagers, setTriagers] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/reports/triage/all');
        setReports(response.data.reports);
        setStatsData(response.data.stats);
      } catch (error) {
        console.error('Error fetching triage data:', error);
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

    fetchData();
    fetchTriagers();
  }, []);

  const handleBulkAssign = async (triagerId: string) => {
    if (selectedReportIds.length === 0) return;
    
    setIsAssigning(true);
    try {
      await api.patch('/reports/bulk-assign', { 
        reportIds: selectedReportIds,
        triagerId 
      });
      toast.success(`Assigned ${selectedReportIds.length} reports`);
      setSelectedReportIds([]);
      setShowAssignModal(false);
      
      // Refresh data
      const response = await api.get('/reports/triage/all');
      setReports(response.data.reports);
    } catch (error: any) {
      console.error('Bulk Assign Error:', error);
      toast.error('Failed to assign reports');
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedReportIds.length === reports.length) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(reports.map((r: any) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedReportIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const stats = [
    { label: 'Pending Triage', value: statsData.pending, icon: Clock, color: 'text-amber-500' },
    { label: 'Under Review', value: statsData.triaging, icon: Shield, color: 'text-indigo-500' },
    { label: 'Validated Reports', value: statsData.resolved, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Critical Bugs', value: statsData.critical, icon: AlertCircle, color: 'text-rose-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--text-main))] text-indigo-500 uppercase tracking-widest text-sm">Security <span className="text-[hsl(var(--text-main))]">Validation Hub</span></h1>
            <h2 className="text-2xl font-black text-[hsl(var(--text-main))] tracking-tight mt-1">Triage Command</h2>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">System Active</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[hsl(var(--bg-card))] p-5 rounded-2xl border border-[hsl(var(--border-subtle))] shadow-sm transition-all hover:border-indigo-500/20 flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest opacity-70">{stat.label}</p>
                <p className="text-2xl font-black mt-0.5 text-[hsl(var(--text-main))]">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl bg-[hsl(var(--text-main))]/[0.03] ${stat.color} group-hover:bg-indigo-500/10 transition-colors`}>
                <stat.icon size={20} />
              </div>
            </div>
          ))}
        </div>

        <div className="relative bg-[hsl(var(--bg-card))] rounded-2xl border border-[hsl(var(--border-subtle))] overflow-hidden shadow-sm">
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
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Reports Selected</span>
                </div>
                
                <div className="h-6 w-px bg-slate-700"></div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowAssignModal(true)}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    Bulk Assign Triager
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
          <div className="px-6 py-4 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between bg-[hsl(var(--text-main))]/[0.01]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-[hsl(var(--text-main))] uppercase tracking-wider">Signals Awaiting Triage</h3>
            </div>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-md border border-indigo-500/20">
              {reports.length} Signals
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                  <th className="px-6 py-3 w-10">
                    <input 
                      type="checkbox" 
                      checked={reports.length > 0 && selectedReportIds.length === reports.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[hsl(var(--border-subtle))] bg-slate-800 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Infiltration Signal</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Program</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Impact</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest text-center">Analyst</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Telemetry</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                {reports.length > 0 ? (
                  reports.map((report: any) => (
                    <tr key={report.id} className={`hover:bg-[hsl(var(--text-main))]/[0.01] transition-colors group cursor-pointer ${selectedReportIds.includes(report.id) ? 'bg-indigo-500/[0.03]' : ''}`}>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedReportIds.includes(report.id)}
                          onChange={() => toggleSelect(report.id)}
                          className="rounded border-[hsl(var(--border-subtle))] bg-slate-800 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors uppercase tracking-tight line-clamp-1">{report.title}</span>
                          <span className="text-[10px] text-[hsl(var(--text-muted))] font-bold mt-0.5 tracking-tight opacity-60">ID://{report.id.slice(-8).toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-[hsl(var(--text-main))] opacity-80">
                          {report.program.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase border px-2 py-0.5 rounded-md ${
                          report.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          report.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          report.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <div className="group/avatar relative">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs ring-4 ring-[hsl(var(--bg-card))]">
                              {report.researcher.firstName[0]}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[hsl(var(--bg-card))] rounded-full"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-tight opacity-70">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                        <span className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded uppercase border ${
                          report.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          report.status === 'SUBMITTED' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' :
                          report.status === 'TRIAGING' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          'bg-[hsl(var(--text-muted))]/[0.1] text-[hsl(var(--text-muted))] border-[hsl(var(--border-subtle))]'
                        }`}>
                          {report.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[hsl(var(--text-muted))] group-hover:text-indigo-400 transition-all group-hover:translate-x-0.5" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="inline-flex items-center justify-center p-4 rounded-full bg-[hsl(var(--text-main))]/[0.03] text-[hsl(var(--text-muted))] mb-4 border border-[hsl(var(--border-subtle))]">
                        <FileText size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-[hsl(var(--text-main))] uppercase tracking-widest">No signals detected</h3>
                      <p className="text-[hsl(var(--text-muted))] mt-1 font-medium max-w-xs mx-auto text-sm opacity-60">
                        All clear. No incoming infiltration signals presently tracked.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Action Bar */}

        {/* Assign Modal */}
        <AnimatePresence>
          {showAssignModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
                  <h3 className="text-sm font-black text-[hsl(var(--text-main))] uppercase tracking-widest">Assign Triager</h3>
                  <button onClick={() => setShowAssignModal(false)} className="text-[hsl(var(--text-muted))] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <p className="text-xs text-[hsl(var(--text-muted))] font-medium">Select a triager to handle these {selectedReportIds.length} signals.</p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {triagers.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => handleBulkAssign(t.id)}
                        disabled={isAssigning}
                        className="w-full p-4 rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.02] hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                            {t.firstName[0]}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-[hsl(var(--text-main))]">{t.firstName} {t.lastName}</p>
                            <p className="text-[10px] text-[hsl(var(--text-muted))] font-medium capitalize">{t.role.toLowerCase()}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[hsl(var(--text-muted))] group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                    
                    {triagers.length === 0 && (
                      <div className="text-center py-8 text-[hsl(var(--text-muted))] text-xs font-medium">
                        No available triagers found.
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleBulkAssign('')}
                    disabled={isAssigning}
                    className="w-full py-3 rounded-xl border border-dashed border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    Unassign All
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

export default TriagerDashboard;
