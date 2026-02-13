import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  User, 
  Mail, 
  Shield, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Hash,
  Activity
} from 'lucide-react';
import api from '../api/axios';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-pulse p-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/5 rounded-full"></div>
            <div className="space-y-3">
              <div className="h-6 w-48 bg-white/5 rounded"></div>
              <div className="h-4 w-32 bg-white/5 rounded"></div>
            </div>
          </div>
          <div className="h-64 bg-white/5 rounded-2xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return (
    <DashboardLayout>
       <div className="p-12 text-center text-[hsl(var(--text-muted))] uppercase tracking-widest font-black text-xs">
          Profile data Unavailable
       </div>
    </DashboardLayout>
  );

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'ADMIN': case 'SUPER_ADMIN': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'RESEARCHER': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'COMPANY_ADMIN': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-[hsl(var(--text-muted))] bg-[hsl(var(--text-main))]/[0.05] border-[hsl(var(--border-subtle))]';
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto space-y-10 pb-20">
        {/* Profile Card */}
        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur opacity-30"></div>
           <div className="relative bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl overflow-hidden backdrop-blur-xl shadow-sm">
              <div className="h-32 bg-gradient-to-r from-indigo-900/50 via-slate-900 to-purple-900/50 border-b border-[hsl(var(--border-subtle))] opacity-80"></div>
              <div className="px-8 pb-10">
                <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12 mb-8">
                   <div className="relative">
                    <div className="w-32 h-32 rounded-3xl bg-[hsl(var(--bg-main))] border-4 border-[hsl(var(--bg-card))] flex items-center justify-center overflow-hidden shadow-2xl">
                      <User className="w-16 h-16 text-[hsl(var(--text-muted))]" />
                    </div>
                    {user.isVerified && (
                      <div className="absolute -right-2 -bottom-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg border border-[hsl(var(--bg-card))]">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h1 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight leading-none">
                      {user.firstName} {user.lastName}
                    </h1>
                    <div className="flex items-center gap-2">
                       <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRoleColor(user.role)}`}>
                         {user.role} Finding Analyst
                       </span>
                       <span className="text-[hsl(var(--text-muted))] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                         <Hash className="w-3 h-3" />
                         ID: {user.id.slice(0, 8)}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[hsl(var(--border-subtle))]">
                   <div className="space-y-6">
                      <h3 className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em] mb-4">Identity Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 group/item">
                           <div className="w-9 h-9 rounded-xl bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--text-muted))] group-hover/item:text-indigo-400 group-hover/item:border-indigo-500/20 transition-all">
                              <Mail className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Email Address</p>
                              <p className="text-sm font-bold text-[hsl(var(--text-main))]">{user.email}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 group/item">
                           <div className="w-9 h-9 rounded-xl bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--text-muted))] group-hover/item:text-rose-400 group-hover/item:border-rose-500/20 transition-all">
                              <Shield className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Account Status</p>
                              <p className={`text-sm font-bold ${user.isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {user.isVerified ? 'Security Verified' : 'Awaiting Verification'}
                              </p>
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h3 className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em] mb-4">Platform Activity</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 group/item">
                           <div className="w-9 h-9 rounded-xl bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--text-muted))] group-hover/item:text-amber-400 group-hover/item:border-amber-500/20 transition-all">
                              <Calendar className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Registry Date</p>
                              <p className="text-sm font-bold text-[hsl(var(--text-main))]">
                                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 group/item">
                           <div className="w-9 h-9 rounded-xl bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--text-muted))] group-hover/item:text-indigo-400 group-hover/item:border-indigo-500/20 transition-all">
                              <Activity className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Global Rank Signal</p>
                              <p className="text-sm font-bold text-[hsl(var(--text-main))]">Standard Tier Access</p>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Action Triggers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="p-8 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl hover:border-indigo-500/20 transition-all group shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                 <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[hsl(var(--text-main))] mb-2">Security Sessions</h4>
              <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed mb-6">Review your active operational sessions across multiple nodes and platforms.</p>
              <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-500 transition-colors">
                Initialize Audit
              </button>
           </div>
           
           <div className="p-8 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl hover:border-rose-500/20 transition-all group shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
                 <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[hsl(var(--text-main))] mb-2">Account Quarantine</h4>
              <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed mb-6">Permanent deactivation of platform access and historical finding signals.</p>
              <button className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 transition-colors">
                Deactivate analyst
              </button>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
