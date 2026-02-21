import { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  BarChart, 
  Timer,
  ShieldCheck
} from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';

interface SlaMetrics {
  totalSlaEligible: number;
  breachedCount: number;
  complianceRate: number;
  avgResponseTime: number;
  breachedReports: any[];
}

interface SlaDashboardProps {
  role: 'admin' | 'company';
}

export default function SlaDashboard({ role }: SlaDashboardProps) {
  const [metrics, setMetrics] = useState<SlaMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlaStats = async () => {
      try {
        const endpoint = role === 'admin' ? '/admin/sla/stats' : '/company/sla/stats';
        const response = await api.get(endpoint);
        setMetrics(response.data);
      } catch (error) {
        console.error('Failed to fetch SLA stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSlaStats();
  }, [role]);

  if (loading) return <div className="h-48 bg-white/5 animate-pulse rounded-2xl border border-[hsl(var(--border-subtle))]"></div>;

  const stats = [
    { 
      label: 'SLA Compliance', 
      value: `${metrics?.complianceRate}%`, 
      icon: ShieldCheck, 
      color: metrics && metrics.complianceRate > 90 ? 'text-emerald-500' : 'text-amber-500'
    },
    { 
      label: 'Breached Reports', 
      value: metrics?.breachedCount || 0, 
      icon: AlertTriangle, 
      color: metrics && metrics.breachedCount > 0 ? 'text-rose-500' : 'text-emerald-500'
    },
    { 
      label: 'Avg Response', 
      value: `${metrics?.avgResponseTime}h`, 
      icon: Timer, 
      color: 'text-indigo-400'
    },
    { 
      label: 'Total Monitored', 
      value: metrics?.totalSlaEligible || 0, 
      icon: BarChart, 
      color: 'text-[hsl(var(--text-muted))]'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-5 rounded-2xl flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">{stat.label}</p>
              <h3 className={`text-xl font-black mt-1 ${stat.color}`}>{stat.value}</h3>
            </div>
            <div className={`p-2 bg-[hsl(var(--text-main))]/[0.03] rounded-lg ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>

      {metrics?.breachedReports && metrics.breachedReports.length > 0 && (
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-rose-500/10 flex items-center justify-between bg-rose-500/[0.02]">
            <div className="flex items-center gap-3 text-rose-500">
               <AlertTriangle className="w-4 h-4" />
               <h3 className="text-[10px] font-black uppercase tracking-widest">Urgent: SLA Breaches Detected</h3>
            </div>
            <span className="text-[10px] font-bold text-rose-500/60 uppercase">{metrics.breachedReports.length} Critical</span>
          </div>
          <div className="divide-y divide-rose-500/10">
            {metrics.breachedReports.map(report => (
              <div key={report.id} className="p-4 flex items-center justify-between hover:bg-rose-500/[0.03] transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[hsl(var(--text-main))] uppercase tracking-tight group-hover:text-rose-500 transition-colors">{report.title}</h4>
                    <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider mt-0.5">{report.program}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">Overdue</p>
                  <p className="text-[9px] text-[hsl(var(--text-muted))] font-bold uppercase mt-0.5">Deadline: {new Date(report.deadline).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
