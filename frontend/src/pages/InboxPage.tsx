import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Bell, Check, Trash2, Mail, Info, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight, Inbox as InboxIcon } from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REPORT_UPDATE' | 'SLA_BREACH';
  isRead: boolean;
  createdAt: string;
  relatedReportId?: string;
}

export default function InboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/inbox');
      setNotifications(response.data);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      if (error.response) {
        console.error('Error Status:', error.response.status);
        console.error('Error Data:', error.response.data);
      }
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/inbox/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/inbox/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/inbox/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'ERROR': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'REPORT_UPDATE': return <Mail className="w-5 h-5 text-indigo-500" />;
      case 'SLA_BREACH': return <AlertCircle className="w-5 h-5 text-rose-600" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 shadow-inner border border-indigo-500/20">
                <InboxIcon className="w-8 h-8" />
              </div>
              Unified <span className="text-indigo-500">Inbox</span>
            </h1>
            <p className="text-[hsl(var(--text-muted))] mt-2 font-medium tracking-wide">
              Centralized intelligence and system alerts.
            </p>
          </div>
          
          <button 
            onClick={markAllAsRead}
            disabled={!notifications.some(n => !n.isRead)}
            className="px-4 py-2 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-main))] rounded-xl text-xs font-bold uppercase tracking-widest border border-[hsl(var(--border-subtle))] transition-all disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>

        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-xl">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-xs font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em]">Synchronizing Inbox...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-[hsl(var(--border-subtle))]">
              <AnimatePresence initial={false}>
                {notifications.map((n) => (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    key={n.id} 
                    className={`p-6 flex items-start justify-between gap-6 transition-all hover:bg-[hsl(var(--text-main))]/[0.02] ${!n.isRead ? 'bg-indigo-500/[0.03] border-l-4 border-l-indigo-500' : ''}`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getIcon(n.type)}
                      </div>
                      <div className="space-y-1">
                        <h3 className={`font-bold text-sm tracking-tight ${!n.isRead ? 'text-indigo-400' : 'text-[hsl(var(--text-main))]'}`}>
                          {n.title}
                        </h3>
                        <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed max-w-2xl font-medium">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest opacity-60">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500 rounded-lg transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(n.id)}
                        className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {n.relatedReportId && (
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all translate-x-1">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-indigo-500/5 flex items-center justify-center text-indigo-500/30 shadow-inner border border-indigo-500/10">
                <Bell className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[hsl(var(--text-main))] tracking-tight uppercase">Operational Silence</h3>
                <p className="text-sm text-[hsl(var(--text-muted))] font-medium tracking-wide mt-2">
                  No notifications or system alerts detected in your encrypted stream.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
