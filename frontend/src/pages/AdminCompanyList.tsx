import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Building2, ChevronLeft, ChevronRight, Search, ShieldCheck, X, Mail, Calendar, Briefcase, DollarSign, ExternalLink } from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Company {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  _count: { programs: number };
}

export default function AdminCompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
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
    fetchCompanies();
  }, []);

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

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">System</span>
               <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">/ User Management</span>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-400" />
              Companies
            </h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
            <input 
              type="text" 
              placeholder="Search companies..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-muted))] focus:outline-none focus:border-emerald-500/50 w-full md:w-64 transition-all focus:bg-[hsl(var(--text-main))]/[0.1]"
            />
          </div>
        </div>

        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-3xl overflow-hidden backdrop-blur-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-[hsl(var(--text-muted))] border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                  <th className="p-4 font-bold uppercase tracking-wider">Organization</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Contact</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Programs</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
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
                    <tr key={c.id} className="hover:bg-[hsl(var(--text-main))]/[0.02] transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-[hsl(var(--border-subtle))] flex items-center justify-center text-sm font-bold text-emerald-300 shadow-inner">
                            {c.firstName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[hsl(var(--text-main))]">{c.firstName} {c.lastName}</div>
                            <div className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-wider font-medium">ID: {c.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-[hsl(var(--text-main))] opacity-90">{c.email}</div>
                        <div className="text-[10px] text-[hsl(var(--text-muted))] mt-0.5">Joined {new Date(c.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
                           <span className="font-mono text-emerald-400">{c._count.programs}</span>
                           <span className="text-xs text-[hsl(var(--text-muted))]">Active Programs</span>
                        </div>
                      </td>
                      <td className="p-4">
                         <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex w-fit items-center gap-1.5 ${c.isVerified 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-4px_rgba(16,185,129,0.3)]' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_-4px_rgba(244,63,94,0.3)]'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${c.isVerified ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                          {c.isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setSelectedCompany(c)}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500 rounded-lg transition-all border border-emerald-500/20 hover:border-emerald-500/0"
                        >
                          View Details
                        </button>
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
            <div className="p-4 border-t border-[hsl(var(--border-subtle))] flex items-center justify-between bg-[hsl(var(--text-main))]/[0.01]">
              <div className="text-xs text-[hsl(var(--text-muted))] font-medium">
                Showing <span className="text-[hsl(var(--text-main))]">{indexOfFirstItem + 1}</span> to <span className="text-[hsl(var(--text-main))]">{Math.min(indexOfLastItem, filteredCompanies.length)}</span> of <span className="text-[hsl(var(--text-main))]">{filteredCompanies.length}</span> organizations
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
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-105' 
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setSelectedCompany(null)}
                className="absolute top-6 right-6 p-2 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] rounded-full text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-80"></div>
              
              <div className="px-8 pb-10">
                <div className="relative -mt-16 mb-6">
                  <div className="w-32 h-32 rounded-[2rem] bg-[hsl(var(--bg-main))] border-4 border-[hsl(var(--bg-card))] shadow-2xl flex items-center justify-center text-4xl font-black text-emerald-400">
                    {selectedCompany.firstName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute bottom-2 right-0 w-8 h-8 rounded-full bg-emerald-500 border-4 border-[hsl(var(--bg-card))] shadow-lg"></div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight">{selectedCompany.firstName} {selectedCompany.lastName}</h2>
                    <p className="text-[hsl(var(--text-muted))] font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Enterprise Organization</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-widest ${selectedCompany.isVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {selectedCompany.isVerified ? 'VERIFIED PARTNER' : 'PENDING REVIEW'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                  <div className="p-4 bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Contact Email</p>
                      <p className="text-sm font-semibold text-[hsl(var(--text-main))]">{selectedCompany.email}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Partnership Date</p>
                      <p className="text-sm font-semibold text-[hsl(var(--text-main))]">{new Date(selectedCompany.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Active Programs</p>
                      <p className="text-sm font-semibold text-[hsl(var(--text-main))]">{selectedCompany._count.programs} Live Programs</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Total Bounty Spend</p>
                        <p className="text-sm font-semibold text-[hsl(var(--text-main))]">$45,200 Paid</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-[hsl(var(--border-subtle))] flex gap-4">
                  <button className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Visit Portal
                  </button>
                  <button className="flex-1 py-4 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-[hsl(var(--border-subtle))] transition-all">
                    System Audit
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
