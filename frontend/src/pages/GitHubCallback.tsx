import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      exchangeCode(code);
    } else {
      navigate('/login');
    }
  }, [searchParams]);

  const exchangeCode = async (code: string) => {
    try {
      const response = await api.post('/auth/social/github', { code });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'COMPANY_ADMIN') {
        navigate('/company/dashboard');
      } else {
        navigate('/researcher/dashboard');
      }
    } catch (error) {
      console.error('GitHub exchange failed', error);
      navigate('/login?error=github_failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-bold uppercase tracking-widest italic animate-pulse">Establishing Secure Session...</h2>
      <p className="text-slate-500 text-sm mt-2 font-mono">Verifying identity via GitHub</p>
    </div>
  );
}
