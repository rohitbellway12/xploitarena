import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Search, DollarSign, ArrowRight, Lock, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Program {
  id: string;
  name: string;
  description: string;
  rewards: string;
  category: string;
  type: 'PUBLIC' | 'PRIVATE';
  company?: {
    firstName: string;
    email: string;
  };
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [minBounty, setMinBounty] = useState<string>('');

  useEffect(() => {
    let isActive = true;
    
    const fetch = async () => {
      // Only show skeleton on first ever load
      if (programs.length === 0) setLoading(true);
      
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (minBounty) params.append('minBounty', minBounty);
      
      try {
        const response = await api.get(`/programs?${params.toString()}`);
        if (isActive) {
          setPrograms(response.data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Fetch Programs Error:', error);
        if (isActive) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetch();
    }, 150); // Fast enough to feel responsive, slow enough to debounce

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [filterType, minBounty]);

  const filteredPrograms = programs.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--text-main))] tracking-tight">Vulnerability Programs</h1>
            <p className="text-[hsl(var(--text-muted))] mt-2">Discover active bug bounty programs and start hunting.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-muted))] focus:outline-none focus:border-indigo-500/50 w-full md:w-48 transition-all shadow-sm"
              />
            </div>

            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl py-2.5 px-4 text-sm text-[hsl(var(--text-main))] focus:outline-none focus:border-indigo-500/50 appearance-none min-w-[120px] shadow-sm cursor-pointer"
            >
              <option value="" className="bg-[hsl(var(--bg-card))] text-[hsl(var(--text-main))]">All Types</option>
              <option value="PUBLIC" className="bg-[hsl(var(--bg-card))] text-[hsl(var(--text-main))]">Public</option>
              <option value="PRIVATE" className="bg-[hsl(var(--bg-card))] text-[hsl(var(--text-main))]">Private</option>
            </select>

            <select 
              value={minBounty}
              onChange={e => setMinBounty(e.target.value)}
              className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl py-2.5 px-4 text-sm text-[hsl(var(--text-main))] focus:outline-none focus:border-indigo-500/50 appearance-none min-w-[140px] shadow-sm cursor-pointer"
            >
              <option value="" className="bg-[hsl(var(--bg-card))] text-[hsl(var(--text-main))]">Min Bounty</option>
              <option value="100" className="bg-[hsl(var(--bg-card))] text-[hsl(var(--text-main))]">$100+</option>
              <option value="500" className="bg-[hsl(var(--bg-card))] text-[hsl(var(--text-main))]">$500+</option>
              <option value="1000" className="bg-[hsl(var(--bg-card))] text-[hsl(var(--text-main))]">$1,000+</option>
              <option value="5000" className="bg-[hsl(var(--bg-card))] text-[hsl(var(--text-main))]">$5,000+</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-[hsl(var(--text-main))]/[0.02] border border-[hsl(var(--border-subtle))] rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <Link 
                to={`/programs/${program.id}`}
                key={program.id} 
                className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 hover:border-indigo-500/50 transition-all group cursor-pointer shadow-sm hover:shadow-md flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                      <span className="text-indigo-400 font-bold text-xl">{program.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[hsl(var(--text-main))] group-hover:text-indigo-400 transition-colors line-clamp-1 tracking-tight">{program.name}</h3>
                      {program.company && (
                        <p className="text-[hsl(var(--text-muted))] text-xs font-medium uppercase tracking-wider mt-0.5">by {program.company.firstName}</p>
                      )}
                    </div>
                  </div>
                  {program.type === 'PRIVATE' ? (
                    <span className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full text-[10px] font-bold uppercase border border-rose-500/20 tracking-wider flex items-center gap-1 shadow-sm">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold uppercase border border-emerald-500/20 tracking-wider flex items-center gap-1 shadow-sm">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  )}
                </div>
                
                <p className="text-[hsl(var(--text-muted))] text-sm line-clamp-2 mb-6 h-10 leading-relaxed mt-2">{program.description}</p>
                
                <div className="mt-auto flex items-center gap-4 text-[hsl(var(--text-muted))] text-[10px] font-bold uppercase tracking-widest border-t border-[hsl(var(--border-subtle))] pt-4">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[hsl(var(--text-main))] opacity-90">{program.rewards}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto group-hover:text-indigo-400 transition-colors">
                    <span className="tracking-[0.2em]">Hunt</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
            
            {programs.length === 0 && (
              <div className="col-span-full py-20 text-center bg-[hsl(var(--text-main))]/[0.02] border border-dashed border-[hsl(var(--border-subtle))] rounded-3xl">
                <p className="text-[hsl(var(--text-muted))] font-medium">No programs found. Check back later!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
