import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  FileText, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Building2,
  Clock
} from 'lucide-react';
import api from '../api/axios';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  user: { firstName: string, lastName: string, email: string, role: string };
  report?: { title: string };
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, totalPages: 0 });
  const [exporting, setExporting] = useState<string | null>(null);
  const logsPerPage = 15;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/admin/audit-logs?page=${currentPage}&limit=${logsPerPage}`);
        setLogs(response.data.logs);
        setPaginationMeta({
          total: response.data.total,
          totalPages: response.data.totalPages
        });
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [currentPage]);

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(format);
    try {
      const response = await api.get(`/admin/audit-logs/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">Security</span>
               <span className="text-[hsl(var(--text-muted))] text-xs font-medium uppercase tracking-widest">/ Audit Logs</span>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              Platform Audit Stream
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="px-3 py-2 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-lg text-[hsl(var(--text-muted))] hover:text-indigo-400 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              title="Export as CSV"
            >
              {exporting === 'csv' ? <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              CSV
            </button>
            <button 
              onClick={() => handleExport('json')}
              disabled={exporting !== null}
              className="px-3 py-2 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-lg text-[hsl(var(--text-muted))] hover:text-indigo-400 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              title="Export as JSON"
            >
              {exporting === 'json' ? <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
              JSON
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
              <input 
                type="text" 
                placeholder="Search audit stream..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-lg text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-muted))] focus:outline-none focus:border-indigo-500/50 w-64 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Context / Resource</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-subtle))] text-sm">
                {loading ? (
                  [...Array(logsPerPage)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-6 border-b border-[hsl(var(--border-subtle))]">
                        <div className="h-4 bg-[hsl(var(--text-main))]/[0.05] rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[hsl(var(--text-main))]/[0.01] transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                             <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-[hsl(var(--text-main))] text-xs uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</p>
                            <p className="text-[10px] text-[hsl(var(--text-muted))] font-medium">System Event</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase">
                            {log.user?.firstName?.[0] || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-[hsl(var(--text-main))] opacity-90">{log.user?.firstName} {log.user?.lastName}</span>
                            <span className="text-[10px] text-[hsl(var(--text-muted))]">{log.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {log.report && (
                             <div className="flex items-center gap-2">
                               <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                               <span className="text-xs text-indigo-400 font-medium">Report: {log.report.title}</span>
                             </div>
                          )}
                          <span className="text-[10px] text-[hsl(var(--text-muted))] break-all max-w-xs">{log.details}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[hsl(var(--text-muted))]">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[hsl(var(--text-muted))]">
                           <Clock className="w-3.5 h-3.5 opacity-40" />
                           <span className="font-mono text-xs">
                             {new Date(log.createdAt).toLocaleString()}
                           </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-[hsl(var(--text-muted))]">
                        No audit records found. Monitoring active.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[hsl(var(--border-subtle))] flex items-center justify-between bg-[hsl(var(--text-main))]/[0.01]">
            <span className="text-xs font-medium text-[hsl(var(--text-muted))]">
              Showing page {currentPage} of {paginationMeta.totalPages || 1} ({paginationMeta.total} total logs)
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="p-1.5 rounded-lg border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--text-main))]/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(paginationMeta.totalPages, p + 1))}
                disabled={currentPage === paginationMeta.totalPages || loading}
                className="p-1.5 rounded-lg border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--text-main))]/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
