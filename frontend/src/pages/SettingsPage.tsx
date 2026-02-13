import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Smartphone,
  ChevronRight,
  CheckCircle2,
  Key
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'security' | 'notifications' | 'account';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('security');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/auth/me');
        setMfaEnabled(response.data.mfaEnabled);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleMFA = async () => {
    setUpdating(true);
    try {
      const response = await api.post('/auth/toggle-2fa', { enabled: !mfaEnabled });
      setMfaEnabled(response.data.mfaEnabled);
      toast.success(`Two-Factor Authentication ${!mfaEnabled ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update MFA settings');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-pulse p-4">
          <div className="h-10 w-48 bg-white/5 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             <div className="lg:col-span-1 space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl"></div>)}
             </div>
             <div className="lg:col-span-3 h-[500px] bg-white/5 rounded-3xl"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'security', name: 'Security & Access', icon: Shield },
    { id: 'notifications', name: 'Signal Alerts', icon: Bell },
    { id: 'account', name: 'Account Identity', icon: User },
  ];

  return (
    <DashboardLayout>
      <div className="w-full max-w-5xl mx-auto space-y-10 pb-20">
        <header>
          <h1 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight uppercase">System Settings</h1>
          <p className="text-[hsl(var(--text-muted))] text-xs font-bold uppercase tracking-[0.2em] mt-2 px-1">Infrastructure parameters and operational preferences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
           {/* Navigation Tabs */}
           <div className="lg:col-span-1 flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 group ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 ring-1 ring-white/10' 
                      : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] hover:bg-[hsl(var(--text-main))]/[0.03]'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-[hsl(var(--text-muted))] group-hover:text-indigo-400'}`} />
                  {tab.name}
                </button>
              ))}
           </div>

           {/* Content Area */}
           <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -10 }}
                   transition={{ duration: 0.2 }}
                   className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[40px] p-10 backdrop-blur-sm relative overflow-hidden shadow-sm"
                 >
                    {/* Background Detail */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    
                    {activeTab === 'security' && (
                       <div className="space-y-12 relative z-10">
                          <section>
                             <div className="flex items-center justify-between mb-8">
                                <div>
                                   <h3 className="text-xl font-black text-[hsl(var(--text-main))] uppercase tracking-tight">Access Hardening</h3>
                                   <p className="text-xs text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-1">Configure multi-layered authentication protocols.</p>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${mfaEnabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-[hsl(var(--bg-main))] text-[hsl(var(--text-muted))] border border-[hsl(var(--border-subtle))]'}`}>
                                   Status: {mfaEnabled ? 'Operational' : 'Inactive'}
                                </div>
                             </div>

                             <div className="p-8 bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-3xl hover:border-indigo-500/20 transition-all">
                                <div className="flex items-start justify-between">
                                   <div className="flex gap-6">
                                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                                         <Lock className="w-7 h-7" />
                                      </div>
                                      <div className="max-w-md">
                                         <h4 className="text-base font-bold text-[hsl(var(--text-main))] uppercase tracking-tight mb-2">Satellite 2FA (Email)</h4>
                                         <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed font-medium">Verify login attempts via temporary codes dispatched to your primary secure communication node.</p>
                                      </div>
                                   </div>
                                   
                                   <button 
                                     onClick={handleToggleMFA}
                                     disabled={updating}
                                     className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 focus:outline-none ${
                                       mfaEnabled ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-[hsl(var(--border-subtle))]'
                                     }`}
                                   >
                                     <span
                                       className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                                         mfaEnabled ? 'translate-x-7' : 'translate-x-1'
                                       }`}
                                     />
                                   </button>
                                </div>

                                <div className="mt-8 pt-8 border-t border-[hsl(var(--border-subtle))] grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div className="flex gap-3">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                      <span className="text-[10px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-wide">Mandatory on high-tier nodes</span>
                                   </div>
                                   <div className="flex gap-3">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                      <span className="text-[10px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-wide">Automatic session revocation</span>
                                   </div>
                                </div>
                             </div>
                          </section>

                          <section className="space-y-6 pt-12 border-t border-[hsl(var(--border-subtle))]">
                             <h3 className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.3em]">Advanced Credentials</h3>
                             <div className="space-y-4">
                                <button className="w-full p-6 bg-[hsl(var(--text-main))]/[0.01] border border-[hsl(var(--border-subtle))] rounded-2xl flex items-center justify-between group hover:bg-[hsl(var(--text-main))]/[0.03] transition-all text-[hsl(var(--text-muted))] hover:text-indigo-400 pointer-events-none opacity-40">
                                   <div className="flex items-center gap-5">
                                      <Key className="w-5 h-5" />
                                      <span className="text-xs font-black uppercase tracking-widest">Rotate Primary Access Hash</span>
                                   </div>
                                   <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="w-full p-6 bg-[hsl(var(--text-main))]/[0.01] border border-[hsl(var(--border-subtle))] rounded-2xl flex items-center justify-between group hover:bg-[hsl(var(--text-main))]/[0.03] transition-all text-[hsl(var(--text-muted))] hover:text-indigo-400 pointer-events-none opacity-40">
                                   <div className="flex items-center gap-5">
                                      <Smartphone className="w-5 h-5" />
                                      <span className="text-xs font-black uppercase tracking-widest">Connect Hardware Token</span>
                                   </div>
                                   <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                             </div>
                          </section>
                       </div>
                    )}

                    {activeTab === 'notifications' && (
                       <div className="space-y-10 relative z-10 text-center py-20 opacity-50">
                          <Bell className="w-16 h-16 text-[hsl(var(--text-muted))] mx-auto mb-6 opacity-20" />
                          <div>
                            <h3 className="text-xl font-black text-[hsl(var(--text-main))] uppercase tracking-tight">Signal Telemetry UI</h3>
                            <p className="text-xs text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-2 px-1">Configure notification push protocols for system event loops.</p>
                          </div>
                          <div className="max-w-xs mx-auto p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Module Locked: Development Tier 2</span>
                          </div>
                       </div>
                    )}

                    {activeTab === 'account' && (
                       <div className="space-y-10 relative z-10 text-center py-20 opacity-50">
                          <User className="w-16 h-16 text-[hsl(var(--text-muted))] mx-auto mb-6 opacity-20" />
                          <div>
                            <h3 className="text-xl font-black text-[hsl(var(--text-main))] uppercase tracking-tight">Identity Assessment</h3>
                            <p className="text-xs text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-2 px-1">Manage core registry data and organizational telemetry.</p>
                          </div>
                          <div className="max-w-xs mx-auto p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                             <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Security Clearance Insufficient</span>
                          </div>
                       </div>
                    )}
                 </motion.div>
              </AnimatePresence>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
