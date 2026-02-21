import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Users, ChevronLeft, ChevronRight, Search, ShieldCheck, X, Mail, Calendar, FileText, Award, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Researcher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  _count: { reports: number };
}

export default function AdminResearcherList() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const itemsPerPage = 10;

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    const fetchResearchers = async () => {
      try {
        const response = await api.get('/admin/researchers');
        // Sort by creation date by default
        setResearchers(response.data);
      } catch (error) {
        console.error('Failed to fetch researchers:', error);
        toast.error('Failed to load researchers');
      } finally {
        setLoading(false);
      }
    };
    fetchResearchers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const response = await api.patch(`/admin/users/${id}/toggle-status`, { 
        isActive: !currentStatus 
      });
      
      setResearchers(prev => prev.map(r => 
        r.id === id ? { ...r, isActive: response.data.isActive } : r
      ));
      
      toast.success(`Researcher ${response.data.isActive ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      console.error('Toggle Status Error:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete researcher ${email}? This action cannot be undone.`)) {
      return;
    }

    setTogglingId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setResearchers(prev => prev.filter(r => r.id !== id));
      toast.success('Researcher deleted successfully');
      if (selectedResearcher?.id === id) {
        setSelectedResearcher(null);
      }
    } catch (error: any) {
      console.error('Delete User Error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete researcher');
    } finally {
      setTogglingId(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/admin/export/researchers', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'researchers_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  // Filter and Pagination Logic
  const filteredResearchers = researchers.filter(r => {
    const fName = (r.firstName || '').toLowerCase();
    const lName = (r.lastName || '').toLowerCase();
    const email = (r.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fName.includes(search) || 
           lName.includes(search) ||
           email.includes(search);
  });

  const totalPages = Math.ceil(filteredResearchers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredResearchers.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleBulkToggleStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    
    setBulkLoading(true);
    try {
      await api.patch('/admin/users/bulk-toggle-status', { 
        userIds: selectedIds,
        isActive 
      });
      
      setResearchers(prev => prev.map(r => 
        selectedIds.includes(r.id) ? { ...r, isActive } : r
      ));
      
      toast.success(`Updated ${selectedIds.length} researchers`);
      setSelectedIds([]);
    } catch (error: any) {
      console.error('Bulk Toggle Status Error:', error);
      toast.error(error.response?.data?.message || 'Failed to update researchers');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map(r => r.id));
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">System</span>
               <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">/ User Management</span>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              Researchers
            </h1>
          </div>

          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-[100] bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white shadow-lg shadow-indigo-500/20">
                    {selectedIds.length}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Selected</span>
                </div>
                
                <div className="h-5 w-px bg-slate-700"></div>
                
                <div className="flex items-center gap-2">
                  <button 
                    disabled={bulkLoading}
                    onClick={() => handleBulkToggleStatus(true)}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    Activate
                  </button>
                  <button 
                    disabled={bulkLoading}
                    onClick={() => handleBulkToggleStatus(false)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-500/20 transition-all disabled:opacity-50"
                  >
                    Suspend
                  </button>
                  <button 
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[hsl(var(--text-muted))] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportCSV}
                className="px-4 py-2 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-main))] rounded-xl text-xs font-bold border border-[hsl(var(--border-subtle))] transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export CSV
              </button>
              <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                <input 
                  type="text" 
                  placeholder="Search researchers..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-4 py-2 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-muted))] focus:outline-none focus:border-indigo-500/50 w-full md:w-64 transition-all focus:bg-[hsl(var(--text-main))]/[0.1]"
                />
              </div>
            </div>
        </div>

        <div className="relative bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl overflow-hidden backdrop-blur-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-[hsl(var(--text-muted))] border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[hsl(var(--border-subtle))] bg-slate-800 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 font-bold uppercase tracking-wider">Researcher</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Contact</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Activity</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Verification</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Account Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[hsl(var(--text-main))] divide-y divide-[hsl(var(--border-subtle))]">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="p-4">
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
                  currentItems.map((r) => (
                    <tr key={r.id} className={`hover:bg-[hsl(var(--text-main))]/[0.02] transition-colors group ${selectedIds.includes(r.id) ? 'bg-indigo-500/[0.03]' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-[hsl(var(--border-subtle))] bg-slate-800 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[hsl(var(--border-subtle))] flex items-center justify-center text-sm font-bold text-indigo-300 shadow-inner">
                            {(r.firstName?.[0] || '')}{(r.lastName?.[0] || '')}
                          </div>
                          <div>
                            <div className="font-semibold text-[hsl(var(--text-main))]">{r.firstName} {r.lastName}</div>
                            <div className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider font-medium">ID: {r.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-[hsl(var(--text-main))] opacity-90">{r.email}</div>
                        <div className="text-[10px] text-[hsl(var(--text-muted))] mt-0.5">Joined {new Date(r.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
                           <span className="font-mono text-emerald-400">{r._count.reports}</span>
                           <span className="text-xs text-[hsl(var(--text-muted))]">Reports filed</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex w-fit items-center gap-1.5 ${r.isVerified 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-4px_rgba(16,185,129,0.3)]' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_-4px_rgba(244,63,94,0.3)]'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${r.isVerified ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                          {r.isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleStatus(r.id, r.isActive)}
                            disabled={togglingId === r.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                              r.isActive ? 'bg-indigo-500' : 'bg-slate-700'
                            } ${togglingId === r.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                r.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-bold tracking-wider ${r.isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                            {r.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedResearcher(r)}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500 rounded-lg transition-all border border-indigo-500/20 hover:border-indigo-500/0"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(r.id, r.email)}
                            disabled={togglingId === r.id}
                            className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-all border border-rose-500/20 hover:border-rose-500/0 disabled:opacity-30"
                            title="Delete Researcher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-[hsl(var(--text-muted))]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="w-8 h-8 opacity-20" />
                        <p>No researchers found matching "{searchTerm}"</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          
          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-[hsl(var(--border-subtle))] flex items-center justify-between bg-[hsl(var(--text-main))]/[0.01]">
              <div className="text-xs text-[hsl(var(--text-muted))] font-medium">
                Showing <span className="text-[hsl(var(--text-main))]">{indexOfFirstItem + 1}</span> to <span className="text-[hsl(var(--text-main))]">{Math.min(indexOfLastItem, filteredResearchers.length)}</span> of <span className="text-[hsl(var(--text-main))]">{filteredResearchers.length}</span> researchers
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-[hsl(var(--text-main))]/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[hsl(var(--text-muted))]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1 px-2">
                   {Array.from({ length: totalPages }, (_, i) => i + 1).filter(page => {
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                   }).map((page, index, array) => {
                      const showEllipsisStart = index > 0 && page > array[index - 1] + 1;
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsisStart && <span className="text-[hsl(var(--text-muted))] text-xs px-1">...</span>}
                          <button
                            onClick={() => paginate(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                              currentPage === page
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-105' 
                                : 'text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--text-main))]/[0.05] hover:text-[hsl(var(--text-main))]'
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
                  className="p-2 rounded-lg hover:bg-[hsl(var(--text-main))]/[0.05] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[hsl(var(--text-muted))]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Researcher Detail Modal */}
      <AnimatePresence>
        {selectedResearcher && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResearcher(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setSelectedResearcher(null)}
                className="absolute top-6 right-6 p-2 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] rounded-full text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-80"></div>
              
              <div className="px-8 pb-10">
                <div className="relative -mt-16 mb-6">
                  <div className="w-32 h-32 rounded-[2rem] bg-[hsl(var(--bg-main))] border-4 border-[hsl(var(--bg-card))] shadow-2xl flex items-center justify-center text-4xl font-black text-indigo-400">
                    {selectedResearcher.firstName[0]}{selectedResearcher.lastName[0]}
                  </div>
                  <div className="absolute bottom-2 right-0 w-8 h-8 rounded-full bg-emerald-500 border-4 border-[hsl(var(--bg-card))] shadow-lg"></div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight">{selectedResearcher.firstName} {selectedResearcher.lastName}</h2>
                    <p className="text-[hsl(var(--text-muted))] font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Platform Researcher</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-widest ${selectedResearcher.isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {selectedResearcher.isVerified ? 'VERIFIED IDENTITY' : 'PENDING VERIFICATION'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                  <div className="p-4 bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-semibold text-[hsl(var(--text-main))]">{selectedResearcher.email}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Member Since</p>
                      <p className="text-sm font-semibold text-[hsl(var(--text-main))]">{new Date(selectedResearcher.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Reports Filed</p>
                      <p className="text-sm font-semibold text-[hsl(var(--text-main))]">{selectedResearcher._count.reports} Submissions</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Platform Rank</p>
                      <p className="text-sm font-semibold text-[hsl(var(--text-main))]">Top 12% Researcher</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-[hsl(var(--border-subtle))] flex gap-4">
                  <button className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 transition-all font-bold">
                    Message User
                  </button>
                  <button className="flex-1 py-4 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-[hsl(var(--border-subtle))] transition-all font-bold">
                    Account Actions
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
