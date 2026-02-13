import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Layers, FileText, Target, Wallet, DollarSign } from 'lucide-react';
import { toast }from 'react-hot-toast';

const programSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  scope: z.string().min(10, 'Scope details are required'),
  rewards: z.string().min(1, 'Reward range is required'),
  type: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  budgetTotal: z.string().optional(),
});

type ProgramFormValues = z.infer<typeof programSchema>;

export default function CreateProgramPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema) as any,
  });

  const onSubmit = async (data: ProgramFormValues) => {
    try {
      await api.post('/programs', data);
      toast.success('Program created successfully!');
      navigate('/company/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create program');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--text-main))] tracking-tight">Launch New Program</h1>
          <p className="text-[hsl(var(--text-muted))] mt-2">Define your bug bounty program to start receiving vulnerability reports.</p>
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
                className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-[hsl(var(--text-muted))]/50"
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
                className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-[hsl(var(--text-muted))]/50"
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
                className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
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
                className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-[hsl(var(--text-muted))]/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[hsl(var(--text-muted))] flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Program Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Tell researchers about your company and security goals..."
              className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none placeholder:text-[hsl(var(--text-muted))]/50"
            />
            {errors.description && <p className="text-xs text-rose-400 font-medium">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[hsl(var(--text-muted))] flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              In-Scope Assets
            </label>
            <textarea
              {...register('scope')}
              rows={6}
              placeholder="List domains, subdomains, or IP ranges allowed for testing..."
              className="w-full bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono text-sm resize-none placeholder:text-[hsl(var(--text-muted))]/50"
            />
            {errors.scope && <p className="text-xs text-rose-400 font-medium">{errors.scope.message}</p>}
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-main))] font-bold py-4 rounded-xl border border-[hsl(var(--border-subtle))] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all uppercase tracking-widest text-xs"
            >
              {isSubmitting ? 'Launching...' : 'Launch Program'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
