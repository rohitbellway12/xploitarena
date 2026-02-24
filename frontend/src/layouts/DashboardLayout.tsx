import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import GlobalSearch from '../components/GlobalSearch';
import { User, Bell, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    // Refresh count every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[hsl(var(--bg-main))] text-[hsl(var(--text-main))] font-sans selection:bg-indigo-500/30 transition-colors duration-300">
      <Sidebar role={user?.role || 'RESEARCHER'} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-indigo-500/[0.03] blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        
        {/* Clean Top Header */}
        <header className="h-20 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between px-10 bg-[hsl(var(--bg-card))]/90 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2.5 text-[hsl(var(--text-muted))] hover:text-indigo-500 transition-all rounded-xl hover:bg-indigo-500/5 relative group"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4.5 h-4.5" />
                ) : (
                  <Moon className="w-4.5 h-4.5" />
                )}
              </button>

              <button 
                onClick={() => navigate('/inbox')}
                className="p-2.5 text-[hsl(var(--text-muted))] hover:text-indigo-500 transition-all relative group rounded-xl hover:bg-indigo-500/5"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 bg-indigo-600 text-[8px] font-bold text-white rounded-full flex items-center justify-center border border-[hsl(var(--bg-card))] transition-all animate-in zoom-in duration-300">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="h-8 w-px bg-[hsl(var(--border-subtle))]"></div>

            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-4 group cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[hsl(var(--text-main))] leading-tight uppercase tracking-tight group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{user?.firstName} {user?.lastName}</p>
                <p className="text-[9px] font-semibold text-[hsl(var(--text-muted))] uppercase tracking-[0.2em] mt-0.5">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 bg-[hsl(var(--bg-card))] rounded-xl flex items-center justify-center border border-[hsl(var(--border-subtle))] group-hover:border-indigo-500/50 transition-all shadow-lg relative">
                 <User className="w-5 h-5 text-[hsl(var(--text-muted))] group-hover:text-indigo-400 transition-colors" />
                 <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[hsl(var(--bg-main))] rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
