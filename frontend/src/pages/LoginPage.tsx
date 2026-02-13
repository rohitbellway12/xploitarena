import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleLogin } from '@react-oauth/google';
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
  const [role, setRole] = useState<'RESEARCHER' | 'COMPANY_ADMIN' | 'TRIAGER' | 'ADMIN'>('RESEARCHER');

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
      const response = await api.post('/auth/login', { ...data, role });
      
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await api.post('/auth/social/google', {
        idToken: credentialResponse.credential,
        role: role
      });
      handleLoginSuccess(response.data);
    } catch (error: any) {
      console.error('Google Login Error Details:', error.response?.data || error.message);
      toast.error('Google login failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const onGitHubLogin = () => {
    const GITHUB_CLIENT_ID = "YOUR_GITHUB_CLIENT_ID_PLACEHOLDER";
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
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
              <div className="mt-4 flex justify-center p-1 bg-[hsl(var(--bg-main))]/[0.5] rounded-xl border border-[hsl(var(--border-subtle))] w-fit mx-auto shadow-inner">
                <button 
                  onClick={() => setRole('RESEARCHER')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all tracking-widest ${role === 'RESEARCHER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))]'}`}
                >
                  RESEARCHER
                </button>
                <button 
                  onClick={() => setRole('COMPANY_ADMIN')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all tracking-widest ${role === 'COMPANY_ADMIN' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))]'}`}
                >
                  ORGANIZATION
                </button>
                <button 
                  onClick={() => setRole('TRIAGER')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all tracking-widest ${role === 'TRIAGER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))]'}`}
                >
                  TRIAGER
                </button>
                <button 
                  onClick={() => setRole('ADMIN')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all tracking-widest ${role === 'ADMIN' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))]'}`}
                >
                  ADMIN
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={onGitHubLogin}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[hsl(var(--bg-main))]/[0.5] border border-[hsl(var(--border-subtle))] rounded-xl hover:bg-[hsl(var(--text-main))]/[0.05] transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  GitHub
                </button>
                <div className="relative group overflow-hidden rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-main))]/[0.5] hover:bg-[hsl(var(--text-main))]/[0.05] transition-all">
                  <div className="opacity-0 absolute inset-0 pointer-events-none group-hover:opacity-10 transition-opacity bg-white"></div>
                  <GoogleLogin 
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error('Google Login Failed')}
                    useOneTap
                    theme="outline"
                    shape="square"
                    width="100%"
                    text="continue_with"
                  />
                </div>
              </div>

              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-[hsl(var(--border-subtle))] opacity-50"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em]">or credentials</span>
                  <div className="flex-grow border-t border-[hsl(var(--border-subtle))] opacity-50"></div>
              </div>
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
