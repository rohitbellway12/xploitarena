import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Layers, FileText, Target, Wallet, DollarSign, Clock, Save, Trash2, PauseCircle, PlayCircle, Lock, ChevronLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const programSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  scope: z.string().min(10, 'Scope details are required'),
  rewards: z.string().min(1, 'Reward range is required'),
  type: z.enum(['PUBLIC', 'PRIVATE']),
  budgetTotal: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']).default('ACTIVE'),
  slaFirstResponse: z.string().optional().nullable(),
  slaTriage: z.string().optional().nullable(),
  slaResolution: z.string().optional().nullable(),
  safeHarbor: z.enum(['NONE', 'PARTIAL', 'FULL']).default('NONE').optional(),
  disclosurePolicy: z.string().optional().nullable(),
});

type ProgramFormValues = z.infer<typeof programSchema>;

export default function EditProgramPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema) as any,
  });

  const currentStatus = watch('status');

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await api.get(`/programs/${id}`);
        const data = response.data;
        reset({
          name: data.name,
          description: data.description,
          scope: data.scope,
          rewards: data.rewards,
          type: data.type,
          budgetTotal: data.budgetTotal?.toString() || '',
          status: data.status,
          slaFirstResponse: data.slaFirstResponse?.toString() || '',
          slaTriage: data.slaTriage?.toString() || '',
          slaResolution: data.slaResolution?.toString() || '',
          safeHarbor: data.safeHarbor || 'NONE',
          disclosurePolicy: data.disclosurePolicy || '',
        });
      } catch (error) {
        console.error('Fetch Program Error:', error);
        toast.error('Failed to load program details');
        navigate('/company/programs');
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, [id, reset, navigate]);

  const onSubmit = async (data: ProgramFormValues) => {
    try {
      await api.put(`/programs/${id}`, data);
      toast.success('Program updated successfully!');
      navigate('/company/programs');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update program');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--text-main))] tracking-tight">Configure Program</h1>
            <p className="text-[hsl(var(--text-muted))] mt-2 font-medium">Update parameters and scope for your security campaign.</p>
          </div>
          <button 
            disabled={isSubmitting}
            onClick={() => navigate('/company/programs')}
            className="p-3 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-muted))] rounded-xl transition-all border border-[hsl(var(--border-subtle))]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[hsl(var(--text-muted))] flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Program Name
              </label>
              <input
                {...register('name')}
                placeholder="e.g. Tesla Public Bounty"
                className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-[hsl(var(--text-muted))]/50 font-medium"
              />
              {errors.name && <p className="text-xs text-rose-400 font-medium">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[hsl(var(--text-muted))] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Reward Range
              </label>
              <input
                {...register('rewards')}
                placeholder="e.g. $100 - $10,000"
                className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-[hsl(var(--text-muted))]/50 font-medium"
              />
              {errors.rewards && <p className="text-xs text-rose-400 font-medium">{errors.rewards.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[hsl(var(--text-muted))] flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Program Type
              </label>
              <select
                {...register('type')}
                className="w-full bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer appearance-none font-medium"
              >
                <option value="PUBLIC" className="bg-[hsl(var(--bg-card))]">Public</option>
                <option value="PRIVATE" className="bg-[hsl(var(--bg-card))]">Private</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[hsl(var(--text-muted))] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Total Budget (Optional)
              </label>
              <input
                {...register('budgetTotal')}
                type="number"
                placeholder="e.g. 50000"
                className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-[hsl(var(--text-muted))]/50 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Safe Harbor */}
             <div className="space-y-2">
                <label className="text-sm font-semibold text-[hsl(var(--text-muted))] flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-emerald-400" />
                   Safe Harbor Status
                </label>
                <select
                   {...register('safeHarbor')}
                   className="w-full bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer font-medium appearance-none"
                >
                   <option value="NONE" className="bg-[hsl(var(--bg-card))]">No Safe Harbor</option>
                   <option value="PARTIAL" className="bg-[hsl(var(--bg-card))]">Partial Safe Harbor</option>
                   <option value="FULL" className="bg-[hsl(var(--bg-card))]">Full Safe Harbor</option>
                </select>
             </div>

             {/* Disclosure Policy */}
             <div className="space-y-2">
                <label className="text-sm font-semibold text-[hsl(var(--text-muted))] flex items-center gap-2">
                   <FileText className="w-4 h-4 text-blue-400" />
                   Disclosure Policy
                </label>
                <input
                   {...register('disclosurePolicy')}
                   placeholder="e.g. Researchers must wait 90 days before public disclosure..."
                   className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-[hsl(var(--text-muted))]/50 font-medium"
                />
             </div>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/10 p-8 rounded-2xl space-y-6">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4" />
              SLA Targets (Service Level Agreements)
            </h3>
            <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase font-bold tracking-wider">Define standard response times in hours for this program.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">First Response (Hours)</label>
                <input 
                  {...register('slaFirstResponse')} 
                  type="number" 
                  className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Triage (Hours)</label>
                <input 
                  {...register('slaTriage')} 
                  type="number" 
                  className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Resolution (Hours)</label>
                <input 
                  {...register('slaResolution')} 
                  type="number" 
                  className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[hsl(var(--text-muted))] flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Program Description & Overview
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Tell researchers about your company and security goals..."
              className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none placeholder:text-[hsl(var(--text-muted))]/50 font-medium"
            />
            {errors.description && <p className="text-xs text-rose-400 font-medium">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[hsl(var(--text-muted))] flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              In-Scope Security Assets
            </label>
            <textarea
              {...register('scope')}
              rows={8}
              placeholder="List domains, subdomains, or IP ranges allowed for testing..."
              className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono text-xs resize-none placeholder:text-[hsl(var(--text-muted))]/50"
            />
            {errors.scope && <p className="text-xs text-rose-400 font-medium">{errors.scope.message}</p>}
          </div>

          <div className="pt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/company/programs')}
              className="px-8 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-main))] font-bold py-4 rounded-xl border border-[hsl(var(--border-subtle))] transition-all text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Synchronizing...' : 'Update Configuration'}
            </button>
          </div>

          {/* Lifecycle Actions */}
          <div className="pt-8 border-t border-[hsl(var(--border-subtle))] space-y-6">
             <h3 className="text-sm font-black text-[hsl(var(--text-main))] uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-500" />
                Danger Zone
             </h3>
             <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                   <h4 className="font-bold text-[hsl(var(--text-main))] text-sm">Program Status Control</h4>
                   <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Pausing hides the program. Closing it permanently disables submissions.</p>
                </div>
                <div className="flex items-center gap-3">
                   {currentStatus !== 'PAUSED' ? (
                     <button
                        type="button"
                        onClick={() => {
                           api.put(`/programs/${id}`, { status: 'PAUSED' }).then(() => { toast.success('Program Paused'); navigate(0); });
                        }}
                        className="px-4 py-2 border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                     >
                        <PauseCircle className="w-4 h-4" /> Pause
                     </button>
                   ) : (
                     <button
                        type="button"
                        onClick={() => {
                           api.put(`/programs/${id}`, { status: 'ACTIVE' }).then(() => { toast.success('Program Resumed'); navigate(0); });
                        }}
                        className="px-4 py-2 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                     >
                        <PlayCircle className="w-4 h-4" /> Resume
                     </button>
                   )}
                   <button
                      type="button"
                      onClick={() => {
                         api.put(`/programs/${id}`, { status: 'CLOSED' }).then(() => { toast.success('Program Closed'); navigate(0); });
                      }}
                      className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border border-rose-500/20"
                   >
                      <Trash2 className="w-4 h-4" /> Close
                   </button>
                </div>
             </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
