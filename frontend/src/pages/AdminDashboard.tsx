import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  Users,
  ShieldAlert,
  CreditCard,
  Building2,
  ChevronRight,
  FileText
} from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';

interface AdminStats {
  totalBounties: string;
  totalResearchers: number;
  totalCompanies: number;
  reportsFiled: number;
  activePrograms: number;
  latestActivity: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { name: 'Total Payouts', value: stats?.totalBounties || '$0', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
    { name: 'Active Researchers', value: stats?.totalResearchers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/5' },
    { name: 'Partner Companies', value: stats?.totalCompanies || 0, icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/5' },
    { name: 'Security Reports', value: stats?.reportsFiled || 0, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/5' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full space-y-8 animate-pulse p-4">
          <div className="h-8 w-48 bg-white/5 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-white/5 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
        {/* Professional Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[hsl(var(--border-subtle))] pb-8">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight">System Overview</h1>
            <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Real-time platform metrics and administrative activity.</p>
          </div>
        </div>

        {/* Stats Matrix - Compact & Professional */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <motion.div 
              key={card.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-6 rounded-xl hover:border-indigo-500/20 transition-all group shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 ${card.bg} rounded-lg ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-[hsl(var(--text-muted))] uppercase tracking-wider">{card.name}</p>
                <h2 className="text-2xl font-bold text-[hsl(var(--text-main))] mt-1">{card.value}</h2>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity Table - Professional Layout */}
        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
          <div className="p-6 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[hsl(var(--text-main))] flex items-center gap-2 tracking-wide uppercase">
              <FileText className="w-4 h-4 text-indigo-500" />
              Latest Vulnerability Disclosures
            </h3>
            <a href="/admin/logs" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-[0.2em] flex items-center gap-1">
              Analyze Full Streams <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                  <th className="px-6 py-4">Researcher</th>
                  <th className="px-6 py-4">Target Program</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                {stats?.latestActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-[hsl(var(--text-main))]/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                          {activity.researcher.firstName[0]}{activity.researcher.lastName[0]}
                        </div>
                        <span className="text-sm font-semibold text-[hsl(var(--text-main))]">{activity.researcher.firstName} {activity.researcher.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-[hsl(var(--text-muted))]">{activity.program.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black tracking-tighter uppercase ${
                        activity.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        activity.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {activity.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[hsl(var(--text-muted))] font-mono">
                         {new Date(activity.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 hover:bg-[hsl(var(--text-main))]/[0.05] rounded-lg text-[hsl(var(--text-muted))] hover:text-indigo-400 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {stats?.latestActivity.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[hsl(var(--text-muted))] text-xs font-medium uppercase tracking-widest">
                      No recent disclosures detected.
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
}
