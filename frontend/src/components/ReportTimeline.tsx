import { CheckCircle2, Circle, Clock, Mail, ShieldAlert, Award } from 'lucide-react';

interface ReportTimelineProps {
  report: {
    status: string;
    createdAt: string;
    submittedAt?: string;
    firstRespondedAt?: string;
    triagedAt?: string;
    resolvedAt?: string;
  };
}

export default function ReportTimeline({ report }: ReportTimelineProps) {
  const steps = [
    {
      id: 'draft',
      label: 'Draft Created',
      date: report.createdAt,
      icon: Clock,
      completed: !!report.createdAt,
      color: 'text-slate-400',
      bg: 'bg-slate-400/10'
    },
    {
      id: 'submitted',
      label: 'Report Submitted',
      date: report.submittedAt,
      icon: Mail,
      completed: !!report.submittedAt,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10'
    },
    {
      id: 'responded',
      label: 'First Response',
      date: report.firstRespondedAt,
      icon: Circle,
      completed: !!report.firstRespondedAt,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10'
    },
    {
      id: 'triaged',
      label: 'Triaged',
      date: report.triagedAt,
      icon: ShieldAlert,
      completed: !!report.triagedAt,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10'
    },
    {
      id: 'resolved',
      label: 'Resolved / Paid',
      date: report.resolvedAt,
      icon: Award,
      completed: !!report.resolvedAt,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        Activity Timeline
      </h3>
      
      <div className="relative border-l-2 border-[hsl(var(--text-main))]/10 ml-4 py-2 space-y-8">
        {steps.map((step, index) => {
          const isLatest = step.completed && (index === steps.length - 1 || !steps[index + 1].completed);
          
          return (
            <div key={step.id} className={`relative pl-8 transition-opacity duration-300 ${step.completed ? 'opacity-100' : 'opacity-40 grayscale'}`}>
              <div 
                className={`absolute -left-[17px] top-1 p-1.5 rounded-full ${step.completed ? step.bg : 'bg-[hsl(var(--bg-main))]/10'} ${isLatest ? 'ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20' : ''}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step.completed ? step.bg : 'bg-[hsl(var(--bg-card))]'} z-10 relative`}>
                   {step.completed ? (
                     <CheckCircle2 className={`w-3.5 h-3.5 ${step.color}`} />
                   ) : (
                     <step.icon className={`w-3.5 h-3.5 text-slate-500`} />
                   )}
                </div>
              </div>
              
              <div>
                <h4 className={`text-sm font-black uppercase tracking-widest ${step.completed ? 'text-[hsl(var(--text-main))]' : 'text-slate-500'}`}>
                   {step.label}
                </h4>
                {step.date ? (
                  <time className="text-xs font-semibold text-slate-400 mt-1 block">
                    {new Date(step.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                ) : (
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1 block">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
