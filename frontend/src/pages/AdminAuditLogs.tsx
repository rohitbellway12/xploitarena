import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  FileText, 
  Search, 
  Filter, 
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
  createdAt: string;
  severity: string;
  researcher: { firstName: string, lastName: string, email: string };
  program: { name: string };
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/admin/stats'); // Reusing stats for activity logs for now
        setLogs(response.data.latestActivity);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

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
            <button className="p-2.5 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-lg text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] transition-all">
              <Download className="w-4 h-4" />
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

        {/* Filters Row */}
        <div className="flex items-center gap-3 py-2">
          <button className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg uppercase tracking-widest flex items-center gap-2">
            <Filter className="w-3 h-3" />
            Severity: All
          </button>
          <button className="px-3 py-1.5 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] text-[10px] font-bold rounded-lg uppercase tracking-widest flex items-center gap-2">
            Type: Submissions
          </button>
          <button className="px-3 py-1.5 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] text-[10px] font-bold rounded-lg uppercase tracking-widest flex items-center gap-2">
            Date Range
          </button>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                  <th className="px-6 py-4">Event Type</th>
                  <th className="px-6 py-4">Security Analyst</th>
                  <th className="px-6 py-4">Target Resource</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Logged At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-subtle))] text-sm">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-6 border-b border-[hsl(var(--border-subtle))]">
                        <div className="h-4 bg-[hsl(var(--text-main))]/[0.05] rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[hsl(var(--text-main))]/[0.01] transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                             <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-[hsl(var(--text-main))] text-xs uppercase tracking-tight">Vulnerability Disclosed</p>
                            <p className="text-[10px] text-[hsl(var(--text-muted))] font-medium">Platform Signal</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase">
                            {log.researcher.firstName[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-[hsl(var(--text-main))] opacity-90">{log.researcher.firstName} {log.researcher.lastName}</span>
                            <span className="text-[10px] text-[hsl(var(--text-muted))]">{log.researcher.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
                          <span className="text-[hsl(var(--text-main))] opacity-80 font-medium">{log.program.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black tracking-widest uppercase ${
                          log.severity === 'CRITICAL' ? 'text-rose-500 bg-rose-500/5' :
                          log.severity === 'HIGH' ? 'text-orange-500 bg-orange-500/5' :
                          'text-indigo-400 bg-indigo-500/5'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[hsl(var(--text-muted))]">
                           <Clock className="w-3.5 h-3.5 opacity-40" />
                           <span className="font-mono text-xs">
                             {new Date(log.createdAt).toLocaleString()}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-3 py-1.5 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] border border-[hsl(var(--border-subtle))] rounded-lg text-[10px] font-bold text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] transition-all uppercase tracking-widest">
                          Trace
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-[hsl(var(--text-muted))]">
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
              Showing logs 1 - {logs.length} of {logs.length}
            </span>
            <div className="flex items-center gap-2">
              <button disabled className="p-1.5 rounded-lg border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] opacity-30 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled className="p-1.5 rounded-lg border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] opacity-30 cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
