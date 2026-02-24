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
  Key,
  Mail,
  Zap,
  Palette,
  Globe,
  X
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'security' | 'notifications' | 'account' | 'smtp' | 'ratelimit' | 'branding';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('security');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [smtp, setSmtp] = useState({ host: '', port: '', user: '', pass: '', secure: false });
  const [traffic, setTraffic] = useState({ apiLimit: 100, lockoutTime: 15 });
  const [branding, setBranding] = useState({ title: 'XploitArena', primaryColor: '230 100% 60%' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [userResponse, settingsResponse] = await Promise.all([
          api.get('/auth/me'),
          api.get('/settings')
        ]);
        
        setMfaEnabled(userResponse.data.mfaEnabled);
        
        const s = settingsResponse.data;
        if (s.smtp_config) setSmtp(s.smtp_config);
        if (s.traffic_config) setTraffic(s.traffic_config);
        if (s.branding_config) setBranding(s.branding_config);

      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSmtp = async () => {
    setUpdating(true);
    try {
      await api.post('/settings/update', { key: 'smtp_config', value: smtp });
      toast.success('SMTP configuration saved and synced');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save SMTP settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveTraffic = async () => {
    setUpdating(true);
    try {
      await api.post('/settings/update', { key: 'traffic_config', value: traffic });
      toast.success('Traffic control parameters updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update traffic settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveBranding = async () => {
    setUpdating(true);
    try {
      await api.post('/settings/update', { key: 'branding_config', value: branding });
      toast.success('Theme and branding synchronized');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update branding');
    } finally {
      setUpdating(false);
    }
  };

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
    { id: 'smtp', name: 'Mail Server (SMTP)', icon: Mail },
    { id: 'ratelimit', name: 'Traffic Control', icon: Zap },
    { id: 'branding', name: 'Branding & UI', icon: Palette },
  ];

  return (
    <DashboardLayout>
      <div className="w-full max-w-5xl mx-auto space-y-10 pb-20">
        <header>
          <h1 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight uppercase">System Settings</h1>
          <p className="text-[hsl(var(--text-muted))] text-xs font-bold uppercase tracking-[0.2em] mt-2 px-1">Infrastructure parameters and operational preferences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
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

                     {activeTab === 'smtp' && (
                        <div className="space-y-8 relative z-10">
                           <div>
                              <h3 className="text-xl font-black text-[hsl(var(--text-main))] uppercase tracking-tight">SMTP Communication Node</h3>
                              <p className="text-xs text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-1">Configure automated dispatch protocols for system alerts.</p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest ml-1">Host Endpoint</label>
                                 <input 
                                  type="text" 
                                  value={smtp.host}
                                  onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                                  placeholder="smtp.provider.com" 
                                  className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all placeholder:opacity-30" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest ml-1">Port</label>
                                 <input 
                                  type="text" 
                                  value={smtp.port}
                                  onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                                  placeholder="587" 
                                  className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all placeholder:opacity-30" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest ml-1">Authentication User</label>
                                 <input 
                                  type="text" 
                                  value={smtp.user}
                                  onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                                  placeholder="api_key_or_user" 
                                  className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all placeholder:opacity-30" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest ml-1">Password / Secure Key</label>
                                 <input 
                                  type="password" 
                                  value={smtp.pass}
                                  onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                                  placeholder="••••••••••••" 
                                  className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all placeholder:opacity-30" 
                                 />
                              </div>
                           </div>
                           
                           <button 
                            onClick={handleSaveSmtp}
                            disabled={updating}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"
                           >
                              {updating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                              Test Connection & Sync
                           </button>
                        </div>
                     )}

                     {activeTab === 'ratelimit' && (
                        <div className="space-y-8 relative z-10">
                           <div>
                              <h3 className="text-xl font-black text-[hsl(var(--text-main))] uppercase tracking-tight">Traffic Control Layer</h3>
                              <p className="text-xs text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-1">Regulate request velocity and mitigate flood vectors.</p>
                           </div>

                           <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] space-y-6">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <h4 className="text-sm font-black text-[hsl(var(--text-main))] uppercase tracking-tight">API Threshold</h4>
                                    <p className="text-[10px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-1">Global request limit per window.</p>
                                 </div>
                                 <input 
                                  type="number" 
                                  value={traffic.apiLimit}
                                  onChange={(e) => setTraffic({ ...traffic, apiLimit: parseInt(e.target.value) })}
                                  className="w-24 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-right font-black text-indigo-400 outline-none focus:border-indigo-500 transition-all" 
                                 />
                              </div>
                              <div className="flex items-center justify-between">
                                 <div>
                                    <h4 className="text-sm font-black text-[hsl(var(--text-main))] uppercase tracking-tight">Lockout Duration</h4>
                                    <p className="text-[10px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-1">Penalty time for threshold breach (minutes).</p>
                                 </div>
                                 <input 
                                  type="number" 
                                  value={traffic.lockoutTime}
                                  onChange={(e) => setTraffic({ ...traffic, lockoutTime: parseInt(e.target.value) })}
                                  className="w-24 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-right font-black text-indigo-400 outline-none focus:border-indigo-500 transition-all" 
                                 />
                              </div>
                           </div>

                           <div className="flex gap-4">
                              <button 
                                onClick={handleSaveTraffic}
                                disabled={updating}
                                className="flex-1 py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                              >
                                {updating ? 'Saving...' : 'Reload Middleware'}
                              </button>
                           </div>
                        </div>
                     )}

                     {activeTab === 'branding' && (
                        <div className="space-y-10 relative z-10">
                           <div>
                              <h3 className="text-xl font-black text-[hsl(var(--text-main))] uppercase tracking-tight">Platform Identity</h3>
                              <p className="text-xs text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest mt-1">Customize visual telemetry and organizational branding.</p>
                           </div>

                           <div className="flex items-center gap-10">
                              <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-dashed border-[hsl(var(--border-subtle))] flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-indigo-500/40 transition-all">
                                 <Palette className="w-6 h-6 text-[hsl(var(--text-muted))] group-hover:text-indigo-400 transition-colors" />
                                 <span className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-tighter">New Logo</span>
                              </div>
                              <div className="flex-1 space-y-4">
                                 <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Platform Title</label>
                                    <input 
                                     type="text" 
                                     value={branding.title}
                                     onChange={(e) => setBranding({ ...branding, title: e.target.value })}
                                     className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all" 
                                    />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Primary Accent HSL</label>
                                    <input 
                                     type="text" 
                                     value={branding.primaryColor}
                                     onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                     className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all" 
                                    />
                                 </div>
                              </div>
                           </div>

                           <button 
                            onClick={handleSaveBranding}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all"
                           >
                              Update Visual Node
                           </button>
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
