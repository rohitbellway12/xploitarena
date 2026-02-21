import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { ChevronLeft, ChevronRight, Search, X, Mail, Calendar, Briefcase, DollarSign, ExternalLink, Send, Shield, UserPlus } from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Company {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/admin/companies');
        setCompanies(response.data);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchTriagers = async () => {
      try {
        const response = await api.get('/admin/triagers');
        setTriagers(response.data);
      } catch (error) {
        console.error('Failed to fetch triagers:', error);
      }
    };
    fetchCompanies();
    fetchTriagers();
  }, []);

  const handleAssignTriager = async (companyId: string, triagerId: string) => {
    setAssigningId(companyId);
    try {
      await api.patch(`/admin/companies/${companyId}/assign-triager`, { triagerId });
      toast.success('Triager assigned successfully');
      // Update local state
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
      toast.error(error.response?.data?.message || 'Failed to assign triager');
    } finally {
      setAssigningId(null);
    }
  };

  const handleInviteCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSending(true);
    try {
      await api.post('/admin/invite-company', { email: inviteEmail, message: customMessage });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setCustomMessage('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await api.patch(`/admin/users/${id}/toggle-status`, { isActive: !currentStatus });
      setCompanies(companies.map(c => 
        c.id === id ? { ...c, isActive: response.data.isActive } : c
      ));
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/admin/export/companies', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'companies_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  // Filter and Pagination Logic
  const filteredCompanies = companies.filter(c => 
    c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleBulkAssignTriager = async (triagerId: string) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.patch('/admin/companies/bulk-assign-triager', { 
        companyIds: selectedIds,
        triagerId 
      });
      
      const triager = triagers.find(t => t.id === triagerId);
      setCompanies(prev => prev.map(c => 
        selectedIds.includes(c.id) 
          ? { 
              ...c, 
              assignedTriagerId: triagerId || null,
              assignedTriager: triager ? { id: triager.id, firstName: triager.firstName, lastName: triager.lastName } : undefined
            } 
          : c
      ));
      
      toast.success(`Assigned triager to ${selectedIds.length} partners`);
      setSelectedIds([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to bulk assign triager');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkToggleStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    
    setBulkLoading(true);
    try {
      await api.patch('/admin/users/bulk-toggle-status', { 
        userIds: selectedIds,
        isActive 
      });
      
      setCompanies(prev => prev.map(c => 
        selectedIds.includes(c.id) ? { ...c, isActive } : c
      ));
      
      toast.success(`Updated ${selectedIds.length} organizations`);
      setSelectedIds([]);
    } catch (error: any) {
      console.error('Bulk Toggle Status Error:', error);
      toast.error(error.response?.data?.message || 'Failed to update companies');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3 mb-1.5">
               <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-[0.15em]">Enterprise</span>
               <div className="w-1 h-1 rounded-full bg-slate-700"></div>
               <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Partner Network</span>
            </div>
            <h1 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-400" />
              Company Registry
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 h-12">
            <AnimatePresence mode="wait">
              {selectedIds.length === 0 ? (
                <motion.div 
                  key="normal-actions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3"
                >
                  <button 
                    onClick={handleExportCSV}
                    className="px-5 py-2.5 bg-[hsl(var(--text-main))]/5 hover:bg-[hsl(var(--text-main))]/10 text-[hsl(var(--text-main))] rounded-2xl text-[11px] font-black tracking-widest uppercase border border-white/5 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Briefcase className="w-4 h-4 opacity-70" />
                    Export
                  </button>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))] group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search organizations..." 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="pl-11 pr-5 py-2.5 bg-[hsl(var(--text-main))]/5 border border-white/5 rounded-2xl text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-muted))/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-72 transition-all focus:bg-[hsl(var(--text-main))]/10"
                    />
                  </div>
                  <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_-5px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(16,185,129,0.4)] active:scale-95 whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="bulk-actions"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-slate-900 border border-emerald-500/30 rounded-2xl px-4 py-1.5 flex items-center gap-5 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-slate-950">
                      {selectedIds.length}
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest hidden lg:block">Selected</span>
                  </div>

                  <div className="h-6 w-px bg-white/10"></div>

                  <div className="flex items-center gap-2">
                    <button 
                      disabled={bulkLoading}
                      onClick={() => handleBulkToggleStatus(true)}
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      Activate
                    </button>
                    <button 
                      disabled={bulkLoading}
                      onClick={() => handleBulkToggleStatus(false)}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-500/20 transition-all disabled:opacity-50"
                    >
                      Suspend
                    </button>
                  </div>

                  <div className="h-6 w-px bg-white/10 mx-1"></div>

                  <div className="relative group/select">
                    <select
                      disabled={bulkLoading}
                      onChange={(e) => handleBulkAssignTriager(e.target.value)}
                      value=""
                      className="bg-slate-950 border border-white/5 hover:border-indigo-500/50 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest text-indigo-400 outline-none cursor-pointer transition-all appearance-none pr-9"
                    >
                      <option value="" disabled>Assign Triager</option>
                      <option value="">Unassign</option>
                      {triagers.map(t => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedIds([])}
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                    title="Cancel Selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative bg-[hsl(var(--bg-card))] border border-white/[0.03] rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-slate-500 border-b border-white/[0.03] bg-white/[0.01]">
                  <th className="p-6 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded-md border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-6 font-black uppercase tracking-[0.2em]">Organization</th>
                  <th className="p-6 font-black uppercase tracking-[0.2em]">Contact & Identity</th>
                  <th className="p-6 font-black uppercase tracking-[0.2em]">Scale</th>
                  <th className="p-6 font-black uppercase tracking-[0.2em]">Internal Lead</th>
                  <th className="p-6 font-black uppercase tracking-[0.2em]">Status</th>
                  <th className="p-6 font-black uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[hsl(var(--text-main))] divide-y divide-[hsl(var(--border-subtle))]">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[hsl(var(--text-main))]/[0.05]"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-[hsl(var(--text-main))]/[0.05] rounded w-1/4"></div>
                            <div className="h-3 bg-[hsl(var(--text-main))]/[0.05] rounded w-1/3"></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : currentItems.length > 0 ? (
                  currentItems.map((c) => (
                    <tr key={c.id} className={`hover:bg-white/[0.02] transition-all group ${selectedIds.includes(c.id) ? 'bg-emerald-500/5' : ''}`}>
                      <td className="p-6 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 rounded-md border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-white/5 flex items-center justify-center text-base font-black text-white shadow-inner group-hover:scale-110 transition-transform">
                            {c.firstName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-base tracking-tight">{c.firstName} {c.lastName}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-[0.1em] font-black mt-0.5">Partner Entity</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="text-slate-300 font-medium">{c.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID:</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.id.substring(0, 8)}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-baseline gap-1.5">
                           <span className="text-xl font-black text-emerald-400 leading-none">{c._count.programs}</span>
                           <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Programs</span>
                        </div>
                        <div className="text-[9px] text-slate-600 mt-1 uppercase tracking-tight">Active Coverage</div>
                      </td>
                      <td className="p-6">
                        <div className="relative min-w-[160px]">
                          {assigningId === c.id ? (
                            <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] bg-indigo-500/5 rounded-xl border border-indigo-500/20">
                              <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
                              Syncing...
                            </div>
                          ) : (
                            <div className="relative group/select">
                              <select
                                value={c.assignedTriagerId || ''}
                                onChange={(e) => handleAssignTriager(c.id, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white outline-none transition-all cursor-pointer appearance-none pr-10"
                              >
                                <option value="">No Lead Assigned</option>
                                {triagers.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.firstName} {t.lastName}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/select:text-indigo-400 transition-colors">
                                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-2">
                          <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black border flex w-fit items-center gap-2 tracking-[0.1em] ${c.isVerified 
                            ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' 
                            : 'bg-rose-500/5 text-rose-400 border-rose-500/10'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${c.isVerified ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                            {c.isVerified ? 'VERIFIED' : 'PENDING'}
                          </div>
                          <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black border flex w-fit items-center gap-2 tracking-[0.1em] ${c.isActive 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                            {c.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <button
                            onClick={() => handleToggleStatus(c.id, c.isActive)}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all focus:outline-none ${c.isActive ? 'bg-emerald-500/20 ring-1 ring-emerald-500/30' : 'bg-slate-800 ring-1 ring-slate-700'}`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full transition-all duration-300 ${
                                c.isActive ? 'translate-x-5.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'translate-x-1 bg-slate-500'
                              }`}
                            />
                          </button>
                          <button 
                            onClick={() => setSelectedCompany(c)}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-slate-950 bg-emerald-500/10 hover:bg-emerald-400 rounded-xl transition-all border border-emerald-500/20 hover:border-transparent active:scale-95"
                          >
                            View Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-[hsl(var(--text-muted))]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="w-8 h-8 opacity-20" />
                        <p>No companies found matching "{searchTerm}"</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          
           {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="px-8 py-5 border-t border-white/[0.03] flex items-center justify-between bg-white/[0.01]">
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                Displaying <span className="text-white">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCompanies.length)}</span> of <span className="text-white">{filteredCompanies.length}</span> Entities
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-xl hover:bg-white/5 disabled:opacity-20 transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1.5 px-3">
                   {Array.from({ length: totalPages }, (_, i) => i + 1).filter(page => {
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                   }).map((page, index, array) => {
                      const showEllipsisStart = index > 0 && page > array[index - 1] + 1;
                      return (
                        <div key={page} className="flex items-center gap-1.5">
                          {showEllipsisStart && <span className="text-slate-600 text-xs font-black">...</span>}
                          <button
                            onClick={() => paginate(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${
                              currentPage === page
                                ? 'bg-emerald-500 text-slate-950 shadow-[0_8px_16px_-4px_rgba(16,185,129,0.4)] scale-110' 
                                : 'text-slate-500 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5 shadow-none'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                   })}
                </div>

                <button 
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-xl hover:bg-white/5 disabled:opacity-20 transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/5"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Company Detail Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCompany(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/5 rounded-[3rem] shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl"
            >
              <button 
                onClick={() => setSelectedCompany(null)}
                className="absolute top-8 right-8 p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all z-10 border border-white/5 backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="h-40 bg-gradient-to-br from-emerald-600/40 via-teal-600/20 to-indigo-900/40 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
              </div>
              
              <div className="px-10 pb-12">
                <div className="relative -mt-20 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex items-end gap-6">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 border-4 border-slate-900 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex items-center justify-center text-4xl font-black text-white relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative z-10">{selectedCompany.firstName.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{selectedCompany.firstName} {selectedCompany.lastName}</h2>
                      <p className="text-emerald-500 font-black uppercase tracking-[0.25em] text-[10px] mt-1.5 flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Enterprise Organization
                      </p>
                    </div>
                  </div>
                  <div className="pb-1">
                    <span className={`px-5 py-2 rounded-full text-[10px] font-black border tracking-[0.15em] shadow-lg ${selectedCompany.isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10'}`}>
                      {selectedCompany.isVerified ? 'VERIFIED PARTNER' : 'PENDING REVIEW'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Primary Contact', value: selectedCompany.email, icon: Mail, color: 'emerald' },
                    { label: 'Partnership Since', value: new Date(selectedCompany.createdAt).toLocaleDateString(), icon: Calendar, color: 'teal' },
                    { label: 'Active Programs', value: `${selectedCompany._count.programs} Security Missions`, icon: Briefcase, color: 'indigo' },
                    { label: 'Cumulative Bounty', value: '$45,200.00 USD', icon: DollarSign, color: 'amber' }
                  ].map((stat, i) => (
                    <div key={i} className="p-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex items-center gap-5 hover:bg-white/[0.04] transition-all group">
                      <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                        <p className="text-sm font-bold text-white tracking-wide">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-10 border-t border-white/[0.03] flex gap-5">
                  <button className="flex-[2] py-4.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-[0_15px_30px_-10px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95">
                    <ExternalLink className="w-4 h-4" />
                    Launch Control Portal
                  </button>
                  <button className="flex-1 py-4.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] border border-white/5 transition-all active:scale-95">
                    Security Audit
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-slate-900 border border-white/5 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
            >
              <div className="p-8 border-b border-white/[0.03] flex items-center justify-between bg-indigo-500/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Expand Network</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] mt-0.5">Invite new organizational lead</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-2.5 hover:bg-white/5 rounded-full text-slate-500 transition-all border border-transparent hover:border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleInviteCompany} className="p-10 space-y-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                    Corporate Identity Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. security@vault.com"
                      className="w-full bg-slate-950 border border-white/[0.05] rounded-2xl pl-11 pr-5 py-4 text-sm text-white placeholder:text-slate-700/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                    />
                  </div>
                  <p className="text-[9px] text-slate-600 font-medium leading-relaxed tracking-wide mt-3 px-1">
                    This will dispatch a high-security cryptographic invitation to the specified address. The recipient will enter our vetting process immediately upon registration.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                    Personalized Protocol Message
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="We wish to incorporate your specialized infrastructure..."
                    rows={4}
                    className="w-full bg-slate-950 border border-white/[0.05] rounded-2xl px-5 py-4 text-sm text-white placeholder:text-slate-700/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-medium"
                  />
                </div>
                
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1 px-4 py-4 bg-white/5 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-transparent hover:border-rose-500/10"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-[2] px-8 py-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_15px_30px_-10px_rgba(99,102,241,0.5)] flex items-center justify-center gap-3 active:scale-95"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Transmit Invite
                        <Send className="w-4 h-4 opacity-70" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
