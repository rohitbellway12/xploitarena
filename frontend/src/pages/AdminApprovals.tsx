import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import { Inbox, Check, X, ShieldAlert, Clock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PendingItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  kybStatus?: string;
}

export default function AdminApprovals() {
  const [data, setData] = useState<{ users: PendingItem[], kyb: PendingItem[] }>({ users: [], kyb: [] });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'USERS' | 'KYB'>('USERS');

  const fetchPending = async () => {
    try {
      const response = await api.get("/admin/pending-approvals");
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch pending approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await api.post(`/admin/approve-user/${id}`);
      toast.success("Account approved successfully");
      setData(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve user");
    } finally {
      setProcessingId(null);
    }
  };

  const handleKybAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      await api.post(`/admin/${action}-kyb/${id}`);
      toast.success(`KYB ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setData(prev => ({ ...prev, kyb: prev.kyb.filter(u => u.id !== id) }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} KYB`);
    } finally {
      setProcessingId(null);
    }
  };

  const currentItems = activeTab === 'USERS' ? data.users : data.kyb;

  return (
    <DashboardLayout>
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-10">
        <div className="border-b border-[hsl(var(--border-subtle))] pb-8">
          <div className="flex items-center gap-2 mb-2">
             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">Access Control</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight flex items-center gap-3">
                 <ShieldAlert className="w-8 h-8 text-rose-500" />
                 Platform Approvals
              </h1>
              <p className="text-[hsl(var(--text-muted))] text-sm mt-1">Review registrations and company verification requests.</p>
            </div>
            
            <div className="flex bg-[hsl(var(--bg-card))] p-1 rounded-xl border border-[hsl(var(--border-subtle))]">
               <button 
                 onClick={() => setActiveTab('USERS')}
                 className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'USERS' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))]'}`}
               >
                 Accounts ({data.users.length})
               </button>
               <button 
                 onClick={() => setActiveTab('KYB')}
                 className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'KYB' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))]'}`}
               >
                 KYB Verification ({data.kyb.length})
               </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse"></div>)}
          </div>
        ) : currentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {currentItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-[hsl(var(--bg-card))] border ${activeTab === 'KYB' ? 'border-amber-500/20' : 'border-[hsl(var(--border-subtle))]'} p-8 rounded-[2rem] hover:border-indigo-500/30 transition-all shadow-sm group relative overflow-hidden`}
                >
                  {activeTab === 'KYB' && (
                    <div className="absolute top-0 right-0 px-6 py-2 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-3xl border-l border-b border-amber-500/20">
                      KYB Review
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${activeTab === 'KYB' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'} border flex items-center justify-center text-xl font-black`}>
                        {item.firstName[0]}{item.lastName[0]}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[hsl(var(--text-main))]">{item.firstName} {item.lastName}</h4>
                        <p className="text-xs text-[hsl(var(--text-muted))] mt-1 truncate max-w-[150px]">{item.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      Submitted: {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">
                      <User className="w-3 h-3" />
                      Role: {item.role.replace('_', ' ')}
                    </div>
                    {activeTab === 'KYB' && (
                       <button className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">
                          View Uploaded Documents
                       </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => activeTab === 'USERS' ? handleApprove(item.id) : handleKybAction(item.id, 'approve')}
                      disabled={processingId === item.id}
                      className="flex-1 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {processingId === item.id ? (
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {activeTab === 'USERS' ? 'Approve Account' : 'Verify Company'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => activeTab === 'KYB' && handleKybAction(item.id, 'reject')}
                      disabled={processingId === item.id}
                      className="p-4 bg-[hsl(var(--text-main))]/[0.05] hover:bg-rose-500/10 text-[hsl(var(--text-muted))] hover:text-rose-500 border border-[hsl(var(--border-subtle))] transition-all rounded-xl"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] border-dashed p-20 rounded-[3rem] text-center flex flex-col items-center justify-center gap-6">
             <div className="w-20 h-20 rounded-full bg-slate-100/5 flex items-center justify-center text-slate-500">
               <Inbox className="w-10 h-10 opacity-20" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-[hsl(var(--text-main))]">All caught up!</h3>
               <p className="text-sm text-[hsl(var(--text-muted))] mt-1">No pending {activeTab.toLowerCase()} require your attention.</p>
             </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
