import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { ChevronLeft, ChevronRight, Search, X, Mail, Send, Shield, UserPlus, Globe, Phone, ArrowUpRight, Activity, Zap, Eye, Check, Trash2, Ban, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Company {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  website?: string;
  address?: string;
  phone?: string;
  biography?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  assignedTriagerId: string | null;
  assignedTriager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count: { programs: number };
}

interface Triager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AdminCompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [triagers, setTriagers] = useState<Triager[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [bulkTriagerId, setBulkTriagerId] = useState('');

  const itemsPerPage = 10; // Slightly more per page due to compact layout

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, triagersRes] = await Promise.all([
          api.get('/admin/companies'),
          api.get('/admin/triagers')
        ]);
        setCompanies(companiesRes.data);
        setTriagers(triagersRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error("Cloud synchronization failed");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssignTriager = async (companyId: string, triagerId: string) => {
    setAssigningId(companyId);
    try {
      await api.patch(`/admin/companies/${companyId}/assign-triager`, { triagerId });
      toast.success('Triager synchronized');
      setCompanies(prev => prev.map(c => {
        if (c.id === companyId) {
          const triager = triagers.find(t => t.id === triagerId);
          return { 
            ...c, 
            assignedTriagerId: triagerId || null,
            assignedTriager: triager ? { id: triager.id, firstName: triager.firstName, lastName: triager.lastName } : undefined
          };
        }
        return c;
      }));
    } catch (error: any) {
      toast.error('Assignment protocol failed');
    } finally {
      setAssigningId(null);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkTriagerId || selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.patch('/admin/companies/bulk-assign-triager', { 
        companyIds: selectedIds, 
        triagerId: bulkTriagerId 
      });
      toast.success(`Synchronized ${selectedIds.length} entities`);
      
      const triager = triagers.find(t => t.id === bulkTriagerId);
      setCompanies(prev => prev.map(c => 
        selectedIds.includes(c.id) 
          ? { ...c, assignedTriagerId: bulkTriagerId, assignedTriager: triager ? { id: triager.id, firstName: triager.firstName, lastName: triager.lastName } : undefined }
          : c
      ));
      setSelectedIds([]);
      setBulkTriagerId('');
    } catch (error) {
      toast.error("Bulk synchronization failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatusToggle = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.patch('/admin/users/bulk-toggle-status', { 
        userIds: selectedIds, 
        isActive 
      });
      toast.success(`${selectedIds.length} entities ${isActive ? 'activated' : 'deactivated'}`);
      
      setCompanies(prev => prev.map(c => 
        selectedIds.includes(c.id) ? { ...c, isActive } : c
      ));
      setSelectedIds([]);
    } catch (error) {
      toast.error("Bulk status update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await api.patch(`/admin/users/${id}/toggle-status`, { isActive: !currentStatus });
      const updatedUser = response.data;
      
      setCompanies(companies.map(c => 
        c.id === id ? { ...c, isActive: updatedUser.isActive } : c
      ));

      if (selectedCompany?.id === id) {
        setSelectedCompany(prev => prev ? { ...prev, isActive: updatedUser.isActive } : null);
      }

      toast.success(updatedUser.isActive ? "Entity Restored" : "Entity Suspended");
    } catch (error: any) {
      toast.error('Status modification failed');
    }
  };

  const handleApproveUser = async (id: string) => {
    try {
      await api.post(`/admin/users/${id}/approve`);
      setCompanies(companies.map(c => 
        c.id === id ? { ...c, isActive: true } : c
      ));
      if (selectedCompany?.id === id) {
        setSelectedCompany(prev => prev ? { ...prev, isActive: true } : null);
      }
      toast.success("Security Clearance Granted");
    } catch (err) {
      toast.error("Approval protocol failed");
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length && currentItems.length > 0) setSelectedIds([]);
    else setSelectedIds(currentItems.map(c => c.id));
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-10">
        {/* Header Section - More Compact */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
            <div>
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 mb-1.5"
                >
                    <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1.5">
                        <Zap className="w-2.5 h-2.5 text-indigo-400 fill-indigo-400" />
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Partner Matrix</span>
                    </div>
                </motion.div>
                <div className="flex items-baseline gap-3">
                    <motion.h1 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-black text-white tracking-tighter"
                    >
                        Organization <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 italic">Registry</span>
                    </motion.h1>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest hidden md:block">
                        Nodes {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCompanies.length)} of {filteredCompanies.length}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative group min-w-[280px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Scan entities..." 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-slate-950/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-[13px] text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 backdrop-blur-md transition-all"
                    />
                </div>
                <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2 active:scale-95"
                >
                    <UserPlus className="w-3.5 h-3.5" />
                    Invite
                </button>
            </div>
        </div>

        {/* Top Controls & Bulk Bar Area */}
        <div className="relative z-50">
            <div className="flex items-center justify-between px-2 mb-2">
                <button 
                    onClick={toggleSelectAll}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${selectedIds.length === currentItems.length && currentItems.length > 0 ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
                >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${selectedIds.length === currentItems.length && currentItems.length > 0 ? 'bg-indigo-500 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                        {selectedIds.length === currentItems.length && currentItems.length > 0 && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    Select Range
                </button>
            </div>

            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="mb-4 bg-slate-900/80 border border-indigo-500/30 p-2.5 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-3 px-5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-indigo-500/20">
                                {selectedIds.length}
                            </div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hidden sm:inline">Bulk Matrix Override</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 pr-3 border-r border-white/10">
                                <button 
                                    onClick={() => handleBulkStatusToggle(true)}
                                    disabled={bulkLoading}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all border border-emerald-500/20 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Activate
                                </button>
                                <button 
                                    onClick={() => handleBulkStatusToggle(false)}
                                    disabled={bulkLoading}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all border border-rose-500/20 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                                >
                                    <Ban className="w-3.5 h-3.5" />
                                    Deactivate
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <select 
                                    value={bulkTriagerId}
                                    onChange={(e) => setBulkTriagerId(e.target.value)}
                                    className="bg-slate-950/60 border border-white/5 rounded-lg pl-3 pr-7 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none appearance-none hover:bg-slate-950 transition-colors w-36"
                                >
                                    <option value="">Select Triager</option>
                                    {triagers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                                </select>
                                <button 
                                    onClick={handleBulkAssign}
                                    disabled={!bulkTriagerId || bulkLoading}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                >
                                    Assign
                                </button>
                                <button 
                                    onClick={() => setSelectedIds([])}
                                    className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-600 hover:text-white rounded-lg transition-all"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Compact Dynamic List Section */}
        <div className="grid grid-cols-1 gap-2.5">
            <AnimatePresence mode="popLayout">
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-16 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
                    ))
                ) : currentItems.length > 0 ? (
                    currentItems.map((company, index) => (
                        <motion.div
                            key={company.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="group relative"
                        >
                            <div className={`relative bg-slate-900/30 border p-3.5 rounded-2xl backdrop-blur-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-default ${selectedIds.includes(company.id) ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/[0.02] hover:border-white/10 hover:bg-white/[0.01]'}`}>
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <button 
                                        onClick={() => toggleSelect(company.id)}
                                        className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${selectedIds.includes(company.id) ? 'bg-indigo-500 border-indigo-500 shadow-sm' : 'border-white/10 bg-white/5 group-hover:border-white/20'}`}
                                    >
                                        {selectedIds.includes(company.id) && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                    
                                    <div className="relative flex-shrink-0">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-[1px]">
                                            <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden">
                                                <span className="text-sm font-black text-white">{company.firstName[0]}{company.lastName[0]}</span>
                                            </div>
                                        </div>
                                        {company.isVerified && (
                                            <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                                <Shield className="w-2.5 h-2.5 text-slate-900 fill-slate-900" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-[14px] font-black text-white tracking-tight truncate">{company.firstName} {company.lastName}</h3>
                                            <span className="text-[9px] text-indigo-400/50 font-mono hidden sm:inline">@{company.username || 'n/a'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
                                                <Mail className="w-3 h-3 opacity-30" />
                                                {company.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-6 lg:px-4">
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Lead Triager</p>
                                        <select
                                            value={company.assignedTriagerId || ''}
                                            onChange={(e) => handleAssignTriager(company.id, e.target.value)}
                                            disabled={assigningId === company.id}
                                            className="bg-slate-950/40 border border-white/5 disabled:opacity-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 outline-none appearance-none cursor-pointer hover:bg-slate-950 transition-colors w-32"
                                        >
                                            <option value="">Vacant</option>
                                            {triagers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-0.5 items-center">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Programs</p>
                                        <div className="flex items-center gap-1.5">
                                            <Activity className="w-3 h-3 text-emerald-500/40" />
                                            <span className="text-[14px] font-black text-white">{company._count.programs}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className={`px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${company.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border-rose-500/10'}`}>
                                            <div className={`w-1 h-1 rounded-full ${company.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                                            {company.isActive ? 'Active' : 'Offline'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setSelectedCompany(company)}
                                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/5 active:scale-95"
                                        title="View Detail"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleStatus(company.id, company.isActive)}
                                        className={`p-2 rounded-lg transition-all border border-transparent active:scale-95 ${company.isActive ? 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white' : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white'}`}
                                    >
                                        {company.isActive ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="py-20 bg-slate-900/20 border border-white/5 rounded-3xl text-center">
                        <Activity className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                        <h3 className="text-lg font-black text-white">No nodes detected</h3>
                    </div>
                )}
            </AnimatePresence>
        </div>

        {/* Pagination - More Compact */}
        {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 px-2">
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Sector {currentPage} / {totalPages}</span>
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-20 text-slate-500 rounded-lg transition-all"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-20 text-slate-500 rounded-lg transition-all"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        )}

        {/* Invite Modal Redesign - Persistent Position at Top */}
        <AnimatePresence>
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[250] flex items-start justify-center p-4 pt-10 overflow-y-auto custom-scrollbar">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsInviteModalOpen(false)}
                        className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-3xl mb-10"
                    >
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-indigo-500/[0.02]">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase italic">Invite <span className="text-indigo-500">Partner</span></h3>
                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Dispatching Secure Invitation Protocol</p>
                            </div>
                            <button onClick={() => setIsInviteModalOpen(false)} className="p-3 bg-white/5 hover:bg-rose-500/20 text-slate-600 hover:text-white rounded-xl transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-1">Target Email Vector</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                                    <input 
                                        type="email" 
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="security@corphq.io"
                                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-11 pr-5 py-3 text-sm text-white placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-1">Custom Payload</label>
                                <textarea 
                                    rows={3}
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder="Operational directives..."
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none font-bold"
                                />
                            </div>

                            <button 
                                disabled={isSending}
                                onClick={async () => {
                                    if (!inviteEmail) return;
                                    setIsSending(true);
                                    try {
                                        await api.post('/admin/invite-company', { email: inviteEmail, message: customMessage });
                                        toast.success("Packet Transmitted");
                                        setIsInviteModalOpen(false);
                                        setInviteEmail('');
                                    } catch (err) { toast.error("Transmission Failed"); }
                                    finally { setIsSending(false); }
                                }}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/10 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                {isSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Execute Transmission <Send className="w-3.5 h-3.5" /></>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Detailed Modal Redesign - Aligned Top */}
        <AnimatePresence>
            {selectedCompany && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-10 lg:pt-20 overflow-y-auto custom-scrollbar">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedCompany(null)}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full max-w-4xl bg-slate-900/90 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row backdrop-blur-3xl mb-10"
                    >
                        {/* Side Visual */}
                        <div className="w-full lg:w-1/3 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 p-10 flex flex-col justify-between border-b lg:border-r border-white/5 relative overflow-hidden">
                           <div className="relative z-10">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-500 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-indigo-500/30 mb-5">
                                    {selectedCompany.firstName[0]}{selectedCompany.lastName[0]}
                                </div>
                                <h2 className="text-2xl font-black text-white leading-tight">{selectedCompany.firstName} <br/> {selectedCompany.lastName}</h2>
                                <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest mt-1.5">@{selectedCompany.username || 'unknown'}</p>
                           </div>

                           <div className="relative z-10 space-y-3 pt-8">
                                <div className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${selectedCompany.isVerified ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/10' : 'bg-amber-500/20 text-amber-500 border-amber-500/10'}`}>
                                    <Shield className="w-3.5 h-3.5" />
                                    {selectedCompany.isVerified ? 'Verified Partner' : 'Identity Unverified'}
                                </div>
                                <div className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${selectedCompany.isActive ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/10' : 'bg-rose-500/20 text-rose-400 border-rose-500/10'}`}>
                                    <Activity className="w-3.5 h-3.5" />
                                    {selectedCompany.isActive ? 'Connection Active' : 'Access Restricted'}
                                </div>
                           </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-8 lg:p-12 space-y-8 bg-slate-900/40">
                            <div className="flex items-center justify-between pb-5 border-b border-white/5">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Intelligence</h4>
                                <button 
                                    onClick={() => setSelectedCompany(null)}
                                    className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest">Digital Vector</p>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                                        <p className="text-[13px] font-bold text-white">{selectedCompany.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest">Secure Line</p>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                                        <p className="text-[13px] font-bold text-white">{selectedCompany.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <p className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest">Corporate Node</p>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                                        {selectedCompany.website ? (
                                            <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-emerald-400 hover:underline flex items-center gap-1.5">
                                                {selectedCompany.website}
                                                <ArrowUpRight className="w-3 h-3" />
                                            </a>
                                        ) : <p className="text-[13px] font-bold text-slate-600">None defined</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {selectedCompany.address && (
                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest">HQ Sector</p>
                                        <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-[12px] text-slate-400 font-medium">
                                            {selectedCompany.address}
                                        </div>
                                    </div>
                                )}
                                {selectedCompany.biography && (
                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest">Directives</p>
                                        <p className="text-[11px] text-slate-500 font-medium italic pl-3 border-l border-indigo-500/30">"{selectedCompany.biography}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 space-y-3">
                                <div className="flex gap-3">
                                    {!selectedCompany.isActive && (
                                        <button 
                                            onClick={() => handleApproveUser(selectedCompany.id)}
                                            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Authorize Access
                                        </button>
                                    )}
                                    {selectedCompany.isActive && (
                                        <button 
                                            onClick={() => handleToggleStatus(selectedCompany.id, true)}
                                            className="flex-1 py-3.5 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-rose-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <Ban className="w-4 h-4" />
                                            Terminate Access
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5 flex items-center justify-center gap-2">
                                        Launch Control
                                    </button>
                                    <button className="px-5 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5">
                                        Audit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 3px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.15); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.3); }
        `}</style>
      </div>
    </DashboardLayout>
  );
}
