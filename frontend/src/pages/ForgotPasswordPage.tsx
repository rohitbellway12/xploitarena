import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await api.post('/auth/forgot-password', data);
      toast.success('Password reset link sent to your email!');
      // Optional: Redirect to login or stay on page with success message
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="dark flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[hsl(var(--bg-main))] text-[hsl(var(--text-main))] transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 p-10 bg-[hsl(var(--bg-card))] rounded-3xl shadow-2xl border border-[hsl(var(--border-subtle))] backdrop-blur-xl">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-[hsl(var(--text-main))] uppercase italic">XploitArena</h2>
          <p className="mt-3 text-sm text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest">
            Recover your access
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">Email address</label>
            <input
              {...register('email')}
              type="email"
              placeholder="hacker@xploitarena.com"
              className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
            />
            {errors.email && <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-tight ml-1">{errors.email.message}</p>}
          </div>

          <div className="pt-2">
            <button
              disabled={isSubmitting}
              type="submit"
              className="group relative flex w-full justify-center rounded-2xl bg-indigo-600 px-4 py-4 text-xs font-black text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[hsl(var(--bg-main))] transition-all duration-300 disabled:opacity-50 uppercase tracking-[0.2em] italic shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? 'Processing...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors underline decoration-2 underline-offset-4"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
