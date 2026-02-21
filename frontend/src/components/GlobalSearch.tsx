import { useState, useEffect, useRef } from 'react';
import { Search, User, ShieldAlert, Building2, Loader2, X, Activity, Fingerprint, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const userString = localStorage.getItem('user');
  const userRole = userString ? JSON.parse(userString).role : null;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAdmin || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get(`/admin/search?q=${query}`);
        setResults(response.data);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, isAdmin]);

  const handleResultClick = (type: string, id: string) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'user') navigate(`/admin/users/${id}`);
    if (type === 'company') navigate(`/admin/companies/${id}`);
    if (type === 'report') navigate(`/reports/${id}`);
    if (type === 'program') navigate(`/programs/${id}`);
    if (type === 'audit') navigate(`/admin/logs`); 
    if (type === 'role') navigate(`/admin/rbac`); 
  };

  const hasNoResults = !results || (
    (!results.users || results.users.length === 0) && 
    (!results.reports || results.reports.length === 0) && 
    (!results.programs || results.programs.length === 0) &&
    (!results.companies || results.companies.length === 0) &&
    (!results.auditLogs || results.auditLogs.length === 0) &&
    (!results.customRoles || results.customRoles.length === 0)
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-3 px-3 py-1.5 bg-[hsl(var(--text-main))]/[0.03] border border-[hsl(var(--border-subtle))] rounded-xl focus-within:border-indigo-500/50 transition-all">
        <Search className="w-4 h-4 text-[hsl(var(--text-muted))]" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          placeholder={isAdmin ? "SEARCH EVERYTHING..." : "GLOBAL SEARCH"} 
          className="bg-transparent border-none text-[11px] font-bold text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))] outline-none w-48 tracking-wider uppercase"
        />
        {loading && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
        {query && (
          <button onClick={() => setQuery('')} className="text-[hsl(var(--text-muted))] hover:text-indigo-500 transition-colors">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-full left-0 mt-2 w-96 bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl shadow-2xl overflow-hidden z-[100] backdrop-blur-xl"
          >
            <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
              {/* Users & Researchers */}
              {results.users?.length > 0 && (
                <div className="p-2">
                  <h3 className="px-3 py-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/5 rounded-lg mb-1 flex items-center gap-2">
                     <User className="w-3 h-3" /> Users
                  </h3>
                  {results.users.map((u: any) => (
                    <button 
                      key={u.id}
                      onClick={() => handleResultClick('user', u.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[hsl(var(--text-main))]/[0.03] rounded-xl flex items-center gap-3 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))]">{u.email} • {u.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Companies */}
              {results.companies?.length > 0 && (
                <div className="p-2 border-t border-[hsl(var(--border-subtle))]">
                  <h3 className="px-3 py-2 text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/5 rounded-lg mb-1 flex items-center gap-2">
                     <Building2 className="w-3 h-3" /> Companies
                  </h3>
                  {results.companies.map((c: any) => (
                    <button 
                      key={c.id}
                      onClick={() => handleResultClick('company', c.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[hsl(var(--text-main))]/[0.03] rounded-xl flex items-center gap-3 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors">{c.firstName}</p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))]">{c.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Reports */}
              {results.reports?.length > 0 && (
                <div className="p-2 border-t border-[hsl(var(--border-subtle))]">
                  <h3 className="px-3 py-2 text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/5 rounded-lg mb-1 flex items-center gap-2">
                     <ShieldAlert className="w-3 h-3" /> Reports
                  </h3>
                  {results.reports.map((r: any) => (
                    <button 
                      key={r.id}
                      onClick={() => handleResultClick('report', r.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[hsl(var(--text-main))]/[0.03] rounded-xl flex items-center gap-3 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors truncate">{r.title}</p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))]">{r.status} • {r.severity}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Programs */}
              {results.programs?.length > 0 && (
                <div className="p-2 border-t border-[hsl(var(--border-subtle))]">
                  <h3 className="px-3 py-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/5 rounded-lg mb-1 flex items-center gap-2">
                     <Activity className="w-3 h-3" /> Programs
                  </h3>
                  {results.programs.map((p: any) => (
                    <button 
                      key={p.id}
                      onClick={() => handleResultClick('program', p.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[hsl(var(--text-main))]/[0.03] rounded-xl flex items-center gap-3 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors truncate">{p.name}</p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-tighter">{p.type} • {p.status}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Audit Logs */}
              {results.auditLogs?.length > 0 && (
                <div className="p-2 border-t border-[hsl(var(--border-subtle))]">
                  <h3 className="px-3 py-2 text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/5 rounded-lg mb-1 flex items-center gap-2">
                     <Fingerprint className="w-3 h-3" /> Audit Logs
                  </h3>
                  {results.auditLogs.map((log: any) => (
                    <button 
                      key={log.id}
                      onClick={() => handleResultClick('audit', log.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[hsl(var(--text-main))]/[0.03] rounded-xl flex items-center gap-3 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors truncate">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))]">{new Date(log.createdAt).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Roles */}
              {results.customRoles?.length > 0 && (
                <div className="p-2 border-t border-[hsl(var(--border-subtle))]">
                  <h3 className="px-3 py-2 text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/5 rounded-lg mb-1 flex items-center gap-2">
                     <Lock className="w-3 h-3" /> Custom Roles
                  </h3>
                  {results.customRoles.map((role: any) => (
                    <button 
                      key={role.id}
                      onClick={() => handleResultClick('role', role.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[hsl(var(--text-main))]/[0.03] rounded-xl flex items-center gap-3 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors truncate">{role.name}</p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))]">System RBAC Role</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {hasNoResults && (
                <div className="p-8 text-center">
                  <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">No results found</p>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-[hsl(var(--text-main))]/[0.02] border-t border-[hsl(var(--border-subtle))] text-center">
               <p className="text-[9px] font-black text-[hsl(var(--text-muted))] uppercase tracking-[0.2em]">Comprehensive Platform Search Active</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
