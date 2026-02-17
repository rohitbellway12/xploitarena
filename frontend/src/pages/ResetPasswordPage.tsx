import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password });
      toast.success('Password reset successful! You can now login.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="dark flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[hsl(var(--bg-main))] text-[hsl(var(--text-main))] transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 p-10 bg-[hsl(var(--bg-card))] rounded-3xl shadow-2xl border border-[hsl(var(--border-subtle))] backdrop-blur-xl">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-[hsl(var(--text-main))] uppercase italic">XploitArena</h2>
          <p className="mt-3 text-sm text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest">
            Set your new password
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">New Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
              />
              {errors.password && <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-tight ml-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
              />
              {errors.confirmPassword && <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-tight ml-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div className="pt-2">
            <button
              disabled={isSubmitting}
              type="submit"
              className="group relative flex w-full justify-center rounded-2xl bg-indigo-600 px-4 py-4 text-xs font-black text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[hsl(var(--bg-main))] transition-all duration-300 disabled:opacity-50 uppercase tracking-[0.2em] italic shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? 'Decrypting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
