import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Search, DollarSign, ArrowRight, Lock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Program {
  id: string;
  name: string;
  description: string;
  rewards: string;
  category: string;
  type: 'PUBLIC' | 'PRIVATE';
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get('/programs');
        setPrograms(response.data);
      } catch (error) {
        console.error('Fetch Programs Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--text-main))] tracking-tight">Vulnerability Programs</h1>
            <p className="text-[hsl(var(--text-muted))] mt-2">Discover active bug bounty programs and start hunting.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
            <input 
              type="text" 
              placeholder="Search programs..." 
              className="bg-[hsl(var(--text-main))]/[0.05] border border-[hsl(var(--border-subtle))] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-muted))] focus:outline-none focus:border-indigo-500/50 w-full md:w-64 transition-all"
            />
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
            {programs.map((program) => (
              <div 
                key={program.id} 
                className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 hover:border-indigo-500/50 transition-all group cursor-pointer shadow-sm hover:shadow-md"
                onClick={() => navigate(`/programs/${program.id}`)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                    <span className="text-indigo-400 font-bold text-xl">{program.name.charAt(0)}</span>
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
                
                <h3 className="text-xl font-bold text-[hsl(var(--text-main))] mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1 tracking-tight">{program.name}</h3>
                <p className="text-[hsl(var(--text-muted))] text-sm line-clamp-2 mb-6 h-10 leading-relaxed">{program.description}</p>
                
                <div className="flex items-center gap-4 text-[hsl(var(--text-muted))] text-[10px] font-bold uppercase tracking-widest border-t border-[hsl(var(--border-subtle))] pt-4">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[hsl(var(--text-main))] opacity-90">{program.rewards}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto group-hover:text-indigo-400 transition-colors">
                    <span className="tracking-[0.2em]">Hunt</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
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
