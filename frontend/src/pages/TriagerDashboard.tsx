import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Shield, FileText, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';

const TriagerDashboard = () => {
  const [reports, setReports] = useState([]);
  const [statsData, setStatsData] = useState({ pending: 0, triaging: 0, resolved: 0, critical: 0 });
  const [loading, setLoading] = useState(true);

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
    fetchData();
  }, []);

  const stats = [
    { label: 'Pending Triage', value: statsData.pending, icon: Clock, color: 'text-amber-500' },
    { label: 'Under Review', value: statsData.triaging, icon: Shield, color: 'text-indigo-500' },
    { label: 'Validated Reports', value: statsData.resolved, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Critical Bugs', value: statsData.critical, icon: AlertCircle, color: 'text-rose-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--text-main))]">Triager Dashboard</h1>
          <p className="text-[hsl(var(--text-muted))] mt-2">Manage and validate vulnerability reports.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[hsl(var(--bg-card))] p-6 rounded-2xl border border-[hsl(var(--border-subtle))] shadow-lg shadow-indigo-500/5 transition-all hover:border-indigo-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--text-muted))]">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1 text-[hsl(var(--text-main))] uppercase tracking-tight">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-[hsl(var(--text-main))]/[0.03] ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[hsl(var(--bg-card))] rounded-2xl border border-[hsl(var(--border-subtle))] overflow-hidden shadow-xl">
          <div className="p-6 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[hsl(var(--text-main))]">Incoming Reports</h2>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-indigo-500/20">
              {reports.length} Reports
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[hsl(var(--text-main))]/[0.02] border-b border-[hsl(var(--border-subtle))]">
                  <th className="px-6 py-4 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Report Info</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Program</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Severity</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Researcher</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Submitted</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                {reports.length > 0 ? (
                  reports.map((report: any) => (
                    <tr key={report.id} className="hover:bg-[hsl(var(--text-main))]/[0.01] transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{report.title}</p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))] mt-0.5 font-medium tracking-wide">#{report.id.slice(-8).toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[hsl(var(--text-main))]/[0.03] text-[hsl(var(--text-main))] text-[11px] font-bold border border-[hsl(var(--border-subtle))]">
                          {report.program.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                          report.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          report.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          report.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-[hsl(var(--text-main))]">{report.researcher.firstName}</p>
                            <p className="text-[9px] text-[hsl(var(--text-muted))] font-medium">{report.researcher.email.split('@')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-[hsl(var(--text-muted))]">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black tracking-[0.15em] px-2 py-0.5 rounded uppercase border ${
                          report.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          report.status === 'SUBMITTED' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' :
                          report.status === 'TRIAGING' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          'bg-[hsl(var(--text-muted))]/[0.1] text-[hsl(var(--text-muted))] border-[hsl(var(--border-subtle))]'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="inline-flex items-center justify-center p-4 rounded-full bg-[hsl(var(--text-main))]/[0.03] text-[hsl(var(--text-muted))] mb-4 border border-[hsl(var(--border-subtle))]">
                        <FileText size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-[hsl(var(--text-main))] uppercase tracking-widest">No reports found</h3>
                      <p className="text-[hsl(var(--text-muted))] mt-2 font-medium max-w-xs mx-auto text-sm">
                        Incoming reports will appear here once submitted by researchers.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TriagerDashboard;
