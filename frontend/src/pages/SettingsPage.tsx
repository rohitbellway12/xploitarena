import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  Shield, 
  Bell, 
  User, 
  Mail, 
  Zap, 
  Palette, 
  Lock, 
  Key, 
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'security' | 'notifications' | 'account' | 'smtp' | 'ratelimit' | 'branding';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('security');
  const [userRole, setUserRole] = useState<string>('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [smtp, setSmtp] = useState({ host: '', port: '', user: '', pass: '', secure: false });
  const [traffic, setTraffic] = useState({ apiLimit: 100, lockoutTime: 15 });
  const [branding, setBranding] = useState({ title: 'XploitArena', logo: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const SERVER_URL = API_BASE_URL.replace('/api', '');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [userResponse, settingsResponse] = await Promise.all([
          api.get('/auth/me'),
          api.get('/settings')
        ]);
        
        setUserRole(userResponse.data.role);
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
      toast.success('SMTP configuration saved');
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
      toast.success('Rate limits updated');
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
      toast.success('Branding updated');
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

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

  const tabs = [
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'account', name: 'Profile', icon: User },
    ...(isAdmin ? [
      { id: 'smtp', name: 'SMTP', icon: Mail },
      { id: 'ratelimit', name: 'Rate Limit', icon: Zap },
      { id: 'branding', name: 'Branding', icon: Palette },
    ] : [])
  ];

  return (
    <DashboardLayout>
      <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
        <header>
          <h1 className="text-3xl font-bold text-[hsl(var(--text-main))] tracking-tight">Settings</h1>
          <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Manage your account and platform preferences.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
           <div className="lg:col-span-1 flex flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] hover:bg-white/5'
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
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.15 }}
                   className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden"
                 >
                    {activeTab === 'security' && (
                       <div className="space-y-8">
                          <section>
                             <div className="mb-6">
                                <h3 className="text-xl font-bold text-[hsl(var(--text-main))]">Security</h3>
                             </div>

                             <div className="p-6 bg-white/5 border border-[hsl(var(--border-subtle))] rounded-2xl">
                                <div className="flex items-center justify-between">
                                   <div className="flex gap-4 items-center">
                                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                         <Lock className="w-5 h-5" />
                                      </div>
                                      <div>
                                         <h4 className="text-sm font-bold text-[hsl(var(--text-main))]">Email 2FA</h4>
                                         <p className="text-xs text-[hsl(var(--text-muted))]">Login codes via email</p>
                                      </div>
                                   </div>
                                   
                                   <div className="flex items-center gap-4">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${mfaEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                         {mfaEnabled ? 'Enabled' : 'Disabled'}
                                      </span>
                                      <button 
                                        onClick={handleToggleMFA}
                                        disabled={updating}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                          mfaEnabled ? 'bg-indigo-600' : 'bg-white/10'
                                        }`}
                                      >
                                        <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            mfaEnabled ? 'translate-x-6' : 'translate-x-1'
                                          }`}
                                        />
                                      </button>
                                   </div>
                                </div>
                             </div>
                          </section>

                          <section className="space-y-4 pt-8 border-t border-[hsl(var(--border-subtle))] opacity-40 grayscale pointer-events-none">
                             <h3 className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider">Additional Methods</h3>
                             <div className="p-4 bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3 text-xs font-bold">
                                   <Key className="w-4 h-4" />
                                   <span>Hardware Keys</span>
                                </div>
                                <span className="text-[10px] italic">Coming Soon</span>
                             </div>
                          </section>
                       </div>
                    )}

                    {activeTab === 'notifications' && (
                       <div className="py-20 text-center opacity-40">
                          <Bell className="w-10 h-10 text-[hsl(var(--text-muted))] mx-auto mb-4" />
                          <h3 className="text-lg font-bold">Notifications</h3>
                          <p className="text-xs mt-1">Coming soon in future updates.</p>
                       </div>
                    )}

                     {activeTab === 'account' && (
                        <div className="py-20 text-center opacity-40">
                           <User className="w-10 h-10 text-[hsl(var(--text-muted))] mx-auto mb-4" />
                           <h3 className="text-lg font-bold">Profile</h3>
                           <p className="text-xs mt-1">Profile management coming soon.</p>
                        </div>
                     )}

                      {activeTab === 'smtp' && (
                         <div className="space-y-6">
                            <div>
                               <h3 className="text-xl font-bold">SMTP Settings</h3>
                               <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Configure email dispatch.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-[hsl(var(--text-muted))]">Host</label>
                                  <input 
                                   type="text" 
                                   value={smtp.host}
                                   onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                                   placeholder="smtp.example.com" 
                                   className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-all" 
                                  />
                               </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-bold text-[hsl(var(--text-muted))]">Port</label>
                                 <input 
                                  type="text" 
                                  value={smtp.port}
                                  onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                                  placeholder="587" 
                                  className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-all" 
                                 />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-bold text-[hsl(var(--text-muted))]">Username</label>
                                 <input 
                                  type="text" 
                                  value={smtp.user}
                                  onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                                  placeholder="api_key_or_user" 
                                  className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-all" 
                                 />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-xs font-bold text-[hsl(var(--text-muted))]">Password</label>
                                 <input 
                                  type="password" 
                                  value={smtp.pass}
                                  onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                                  placeholder="••••••••••••" 
                                  className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-all" 
                                 />
                              </div>
                           </div>
                           
                           <button 
                             onClick={handleSaveSmtp}
                             disabled={updating}
                             className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2"
                            >
                               {updating ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                               Save SMTP
                            </button>
                         </div>
                      )}

                      {activeTab === 'ratelimit' && (
                         <div className="space-y-6">
                            <div>
                               <h3 className="text-xl font-bold">Rate Limiting</h3>
                               <p className="text-xs text-[hsl(var(--text-muted))] mt-1">System protection settings.</p>
                            </div>

                            <div className="p-6 bg-white/5 border border-[hsl(var(--border-subtle))] rounded-2xl space-y-4">
                               <div className="flex items-center justify-between">
                                  <div>
                                     <h4 className="text-sm font-bold">API Limit</h4>
                                     <p className="text-[10px] text-[hsl(var(--text-muted))]">Requests per 15 mins</p>
                                  </div>
                                  <input 
                                   type="number" 
                                   value={traffic.apiLimit}
                                   onChange={(e) => setTraffic({ ...traffic, apiLimit: parseInt(e.target.value) })}
                                   className="w-20 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-right font-bold text-indigo-400 outline-none focus:border-indigo-500" 
                                  />
                               </div>
                               <div className="flex items-center justify-between">
                                  <div>
                                     <h4 className="text-sm font-bold">Lockout Duration</h4>
                                     <p className="text-[10px] text-[hsl(var(--text-muted))]">Minutes blocked after breach</p>
                                  </div>
                                  <input 
                                   type="number" 
                                   value={traffic.lockoutTime}
                                   onChange={(e) => setTraffic({ ...traffic, lockoutTime: parseInt(e.target.value) })}
                                   className="w-20 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-right font-bold text-indigo-400 outline-none focus:border-indigo-500" 
                                  />
                               </div>
                            </div>

                           <button 
                             onClick={handleSaveTraffic}
                             disabled={updating}
                             className="px-6 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-600/20 rounded-xl font-bold text-xs transition-colors"
                            >
                               {updating ? 'Saving...' : 'Apply Limits'}
                            </button>
                         </div>
                      )}

                      {activeTab === 'branding' && (
                         <div className="space-y-8">
                            <div>
                               <h3 className="text-xl font-bold">Branding</h3>
                               <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Platform customization.</p>
                            </div>

                           <div className="flex items-center gap-8">
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    setUpdating(true);
                                    try {
                                      const res = await api.post('/api/upload', formData, {
                                        headers: { 'Content-Type': 'multipart/form-data' }
                                      });
                                      const logoUrl = res.data.file.url;
                                      const newBranding = { ...branding, logo: logoUrl };
                                      setBranding(newBranding);
                                      await api.post('/settings/update', { key: 'branding_config', value: newBranding });
                                      toast.success('Logo uploaded and saved');
                                    } catch (err) {
                                      toast.error('Logo upload failed');
                                    } finally {
                                      setUpdating(false);
                                    }
                                  }
                                }} 
                              />
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-2xl bg-white/5 border border-dashed border-[hsl(var(--border-subtle))] flex flex-col items-center justify-center gap-1 group cursor-pointer hover:border-indigo-500/40 transition-colors overflow-hidden"
                              >
                                 {branding.logo ? (
                                   <img src={branding.logo} alt="Logo" className="w-full h-full object-cover" />
                                 ) : (
                                   <>
                                     <Palette className="w-5 h-5 text-[hsl(var(--text-muted))] group-hover:text-indigo-400" />
                                     <span className="text-[9px] font-bold text-[hsl(var(--text-muted))]">New Logo</span>
                                   </>
                                 )}
                              </div>
                              <div className="flex-1 space-y-4">
                                 <div className="space-y-1">
                                    <label className="text-xs font-bold text-[hsl(var(--text-muted))]">Website Title</label>
                                    <input 
                                     type="text" 
                                     value={branding.title}
                                     onChange={(e) => setBranding({ ...branding, title: e.target.value })}
                                     className="w-full bg-white/5 border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none transition-all" 
                                    />
                                 </div>
                              </div>
                           </div>

                           <button 
                             onClick={handleSaveBranding}
                             className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/10 transition-all"
                            >
                               Update Branding
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
