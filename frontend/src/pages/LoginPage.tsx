import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

// ... (schemas and types same as before)
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const mfaSchema = z.object({
  code: z.string().length(6, 'Code must be exactly 6 digits'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type MFAFormValues = z.infer<typeof mfaSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [showMFA, setShowMFA] = useState(false);
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);

  const { 
    register: loginRegister, 
    handleSubmit: handleLoginSubmit, 
    formState: { errors: loginErrors, isSubmitting: isLoggingIn } 
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const { 
    register: mfaRegister, 
    handleSubmit: handleMFASubmit, 
    formState: { errors: mfaErrors, isSubmitting: isVerifying } 
  } = useForm<MFAFormValues>({
    resolver: zodResolver(mfaSchema),
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      const response = await api.post('/auth/login', data);
      
      if (response.data.mfaRequired) {
        setShowMFA(true);
        setMfaUserId(response.data.userId);
        return;
      }

      handleLoginSuccess(response.data);
    } catch (error: any) {
      console.error('LOGIN ERROR:', error.response?.data || error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
    }
  };



  const onMFASubmit = async (data: MFAFormValues) => {
    try {
      const response = await api.post('/auth/verify-2fa', {
        userId: mfaUserId,
        code: data.code
      });
      handleLoginSuccess(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    }
  };

  const handleLoginSuccess = (data: any) => {
    const { accessToken, refreshToken, user } = data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      navigate('/admin/dashboard');
    } else if (user.role === 'COMPANY_ADMIN') {
      navigate('/company/dashboard');
    } else if (user.role === 'TRIAGER') {
      navigate('/triager/dashboard');
    } else {
      navigate('/researcher/dashboard');
    }
  };

  return (
    <div className="dark flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[hsl(var(--bg-main))] text-[hsl(var(--text-main))] font-sans transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 p-10 bg-[hsl(var(--bg-card))] rounded-3xl shadow-2xl border border-[hsl(var(--border-subtle))] backdrop-blur-xl">
        {!showMFA ? (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-[hsl(var(--text-main))] uppercase italic">XploitArena</h2>
            </div>

            <form className="mt-4 space-y-5" onSubmit={handleLoginSubmit(onLoginSubmit)}>
              <div className="space-y-4 rounded-md">
                <div>
                  <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">Email address</label>
                  <input
                    {...loginRegister('email')}
                    type="email"
                    placeholder="hacker@xploitarena.com"
                    className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
                  />
                  {loginErrors.email && <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-tight ml-1">{loginErrors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">Password</label>
                  <input
                    {...loginRegister('password')}
                    type="password"
                    placeholder="••••••••"
                    className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
                  />
                  {loginErrors.password && <p className="mt-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-tight ml-1">{loginErrors.password.message}</p>}
                  <div className="flex justify-end mt-2">
                    <a href="/forgot-password" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors">
                      Forgot Password?
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={isLoggingIn}
                  type="submit"
                  className="group relative flex w-full justify-center rounded-2xl bg-indigo-600 px-4 py-4 text-xs font-black text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[hsl(var(--bg-main))] transition-all duration-300 disabled:opacity-50 uppercase tracking-[0.2em] italic shadow-lg shadow-indigo-600/20"
                >
                  {isLoggingIn ? 'Decrypting...' : 'Authenticate'}
                </button>
              </div>
            </form>
            <p className="text-center text-[11px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest">
              New to the arena? <a href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors underline decoration-2 underline-offset-4">Join Now</a>
            </p>
          </>
        ) : (
          <>
            {/* ... (MFA screen same as before) */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-indigo-500/20">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-[hsl(var(--text-main))] uppercase italic tracking-tight">Verify Identity</h2>
              <p className="mt-3 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest leading-relaxed">
                Platform signal sent. <br/>Enter 6-digit decryption code.
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleMFASubmit(onMFASubmit)}>
              <div>
                <input
                  {...mfaRegister('code')}
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="block w-full text-center text-3xl font-black tracking-[10px] rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/20 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] outline-none transition-all shadow-inner"
                />
                {mfaErrors.code && <p className="mt-2 text-center text-[10px] text-rose-500 font-bold uppercase tracking-tight">{mfaErrors.code.message}</p>}
              </div>

              <div className="flex flex-col gap-4">
                <button
                  disabled={isVerifying}
                  type="submit"
                  className="w-full flex justify-center rounded-2xl bg-indigo-600 px-4 py-4 text-xs font-black text-white hover:bg-indigo-500 transition-all duration-300 disabled:opacity-50 uppercase tracking-[0.2em] italic shadow-lg shadow-indigo-600/20"
                >
                  {isVerifying ? 'Verifying...' : 'Finalize Access'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMFA(false)}
                  className="text-[10px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] font-black uppercase tracking-[0.2em] transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
