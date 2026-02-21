import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email successfully verified.');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify email. The link may have expired.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(var(--bg-main))] relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #4f46e5 0%, transparent 50%)' }} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--text-main))]/[0.02] flex items-center justify-center border border-[hsl(var(--border-subtle))]">
           {status === 'loading' && <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />}
           {status === 'success' && <CheckCircle className="w-8 h-8 text-emerald-500" />}
           {status === 'error' && <XCircle className="w-8 h-8 text-rose-500" />}
        </div>
        
        <div>
          <h2 className="text-2xl font-black text-[hsl(var(--text-main))] mb-2 tracking-tight">
            {status === 'loading' && 'Verifying Your Identity...'}
            {status === 'success' && 'Verification Complete'}
            {status === 'error' && 'Verification Failed'}
          </h2>
          <p className="text-sm font-medium text-[hsl(var(--text-muted))] leading-relaxed">
            {status === 'loading' && 'Please wait while we validate your secure token against our intelligence database.'}
            {status !== 'loading' && message}
          </p>
        </div>

        {status === 'success' && (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold tracking-widest text-xs uppercase shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            Access Terminal
          </button>
        )}

        {status === 'error' && (
          <div className="space-y-4 w-full">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-main))] rounded-xl font-bold tracking-widest text-xs uppercase transition-all"
            >
              Return to Login
            </button>
            <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-widest font-black">
              Need assistance? <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Re-register</Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
