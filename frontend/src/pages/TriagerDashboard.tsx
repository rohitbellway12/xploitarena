import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
    { label: 'Pending', value: statsData.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Reviewing', value: statsData.triaging, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Validated', value: statsData.resolved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Critical', value: statsData.critical, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ];

  return (
    <DashboardLayout>
      <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 p-4 md:p-8">
        
        {/* Simplified Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
               VAL
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Triager Dashboard</h1>
              <p className="text-slate-500 text-sm">Security report validation hub</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} shrink-0`}>
                <stat.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{stat.label}</p>
                <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {loading ? '...' : stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reports Directory */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm relative">
          
          <AnimatePresence>
            {selectedReportIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-0 right-0 z-10 bg-indigo-600 px-6 py-3 flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3">
                   <div className="px-2 py-0.5 bg-white text-indigo-600 rounded text-xs font-bold">
                     {selectedReportIds.length}
                   </div>
                   <span className="text-xs font-bold text-white uppercase tracking-wider">Reports Selected</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowAssignModal(true)}
                    className="px-4 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Bulk Assign
                  </button>
                  <button 
                    onClick={() => setSelectedReportIds([])}
                    className="text-white hover:text-indigo-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/30">
            <h3 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" /> Pending Reports
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              {reports.length} Signals
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.01] border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3 w-10">
                    <input 
                      type="checkbox" 
                      checked={reports.length > 0 && selectedReportIds.length === reports.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Report Title</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Program</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Impact</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reports.length > 0 ? (
                  reports.map((report: any) => (
                    <tr 
                      key={report.id} 
                      onClick={() => navigate(`/reports/${report.id}`)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${selectedReportIds.includes(report.id) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedReportIds.includes(report.id)}
                          onChange={() => toggleSelect(report.id)}
                          className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">{report.title}</span>
                          <span className="text-[10px] text-slate-500 font-medium mt-0.5">ID: {report.id.slice(-6).toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {report.program.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[8px] font-bold uppercase border px-2 py-0.5 rounded ${
                          report.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          report.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          report.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[8px] font-bold tracking-widest px-2 py-0.5 rounded uppercase border ${
                          report.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          report.status === 'SUBMITTED' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          report.status === 'TRIAGING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-sm italic">
                      No reports awaiting triage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Assign Modal */}
        <AnimatePresence>
          {showAssignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div onClick={() => setShowAssignModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Assign Triager</h3>
                  <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  <p className="text-xs text-slate-500 font-medium px-2">Choose an operative for {selectedReportIds.length} findings.</p>
                  
                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                    {triagers.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => handleBulkAssign(t.id)}
                        disabled={isAssigning}
                        className="w-full p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-indigo-500/30 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {t.firstName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{t.firstName} {t.lastName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t.role}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleBulkAssign('')}
                    disabled={isAssigning}
                    className="w-full py-2.5 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-widest border border-dashed border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
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
