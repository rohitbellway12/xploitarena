import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { 
  Shield, 
  Target, 
  DollarSign, 
  FileText, 
  ChevronLeft, 
  Send,
  Lock,
  Globe,
  Building2,
  Calendar,
  AlertCircle,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ScopeChecker from '../components/ScopeChecker';

export default function ProgramDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [togglingBookmark, setTogglingBookmark] = useState(false);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await api.get(`/programs/${id}`);
        setProgram(response.data);
        // Check if bookmarked (backend should ideally return this, but we can check specifically)
        // For now, let's assume we fetch it or it's in the program object
        if (response.data.bookmarks && response.data.bookmarks.length > 0) {
          setIsBookmarked(true);
        }
      } catch (error: any) {
        console.error('Fetch Program Detail Error:', error);
        toast.error(error.response?.data?.message || 'Failed to load program');
        navigate('/researcher/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, [id, navigate]);

  const handleToggleBookmark = async () => {
    setTogglingBookmark(true);
    try {
      const response = await api.post('/researcher/bookmarks/toggle', { programId: id });
      setIsBookmarked(response.data.bookmarked);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update bookmark');
    } finally {
      setTogglingBookmark(false);
    }
  };

  if (loading) {
    return (
       <DashboardLayout>
         <div className="flex items-center justify-center min-h-[60vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
         </div>
       </DashboardLayout>
    );
  }

  if (!program) return null;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[hsl(var(--border-subtle))]">
           <div className="flex items-center gap-6">
             <button 
                onClick={() => navigate(-1)}
                className="p-3 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-muted))] rounded-xl transition-all border border-[hsl(var(--border-subtle))]"
             >
                <ChevronLeft className="w-5 h-5" />
             </button>
             <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <h1 className="text-3xl font-bold text-[hsl(var(--text-main))] tracking-tight uppercase">{program.name}</h1>
                   <button
                      onClick={handleToggleBookmark}
                      disabled={togglingBookmark}
                      className={`p-2 rounded-lg border transition-all ${
                        isBookmarked 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                          : 'bg-slate-500/5 border-slate-500/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                   {program.type === 'PRIVATE' ? (
                     <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-lg text-[10px] font-black uppercase border border-rose-500/20 tracking-widest flex items-center gap-1.5 shadow-sm">
                       <Lock className="w-3 h-3" /> Private
                     </span>
                   ) : (
                     <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase border border-emerald-500/20 tracking-widest flex items-center gap-1.5 shadow-sm">
                       <Globe className="w-3 h-3" /> Public
                     </span>
                   )}
                </div>
                <div className="flex items-center gap-4 text-[hsl(var(--text-muted))] text-xs font-bold uppercase tracking-wider">
                   <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {program.company.firstName}
                   </div>
                   <div className="w-1 h-1 bg-[hsl(var(--text-muted))]/30 rounded-full"></div>
                   <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Established {new Date(program.createdAt).toLocaleDateString()}
                   </div>
                </div>
             </div>
           </div>

           <button 
              onClick={() => navigate(`/programs/${program.id}/submit`)}
              className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 group"
           >
              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Submit Vulnerability
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column: Details */}
           <div className="lg:col-span-2 space-y-8">
              {/* Program Description */}
              <section className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-8 rounded-2xl space-y-4 shadow-sm">
                 <h2 className="text-sm font-black text-[hsl(var(--text-main))] uppercase tracking-[0.2em] flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Program Overview
                 </h2>
                 <div className="text-[hsl(var(--text-main))] opacity-80 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                    {program.description}
                 </div>
              </section>

              {/* Scope & Assets */}
              <section className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-8 rounded-2xl space-y-6 shadow-sm border-l-4 border-l-indigo-500">
                 <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-[hsl(var(--text-main))] uppercase tracking-[0.2em] flex items-center gap-3">
                       <Target className="w-4 h-4 text-rose-400" />
                       Security Scope
                    </h2>
                    <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-500/20">
                       In-Scope Only
                    </span>
                 </div>
                 <div className="bg-[hsl(var(--bg-main))] p-6 rounded-xl border border-[hsl(var(--border-subtle))] font-mono text-[13px] text-[hsl(var(--text-main))] opacity-90 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                    {program.scope || 'No specific assets listed yet.'}
                 </div>
              </section>

              <ScopeChecker programId={program.id} />

              {/* Rules & Rewards */}
              <section className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-8 rounded-2xl space-y-4 shadow-sm">
                 <h2 className="text-sm font-black text-[hsl(var(--text-main))] uppercase tracking-[0.2em] flex items-center gap-3">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Rules of Engagement
                 </h2>
                 <div className="text-[hsl(var(--text-main))] opacity-80 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                    {program.rules || "Standard bug bounty rules apply. Do not perform Denial of Service (DoS), avoid data exfiltration, and maintain confidentiality."}
                 </div>
              </section>
           </div>

           {/* Right Column: Key Stats & Sidebar */}
           <div className="space-y-6">
              <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden shadow-sm">
                 <div className="p-6 bg-indigo-600/5 border-b border-[hsl(var(--border-subtle))]">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Rewards Matrix</h3>
                 </div>
                 <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                          <DollarSign className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest">Bounty Range</p>
                          <p className="text-2xl font-bold text-[hsl(var(--text-main))] mt-1">{program.rewards}</p>
                       </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-[hsl(var(--border-subtle))]">
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-tighter">Budget Status</span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded">Healthy</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-tighter">Avg Response</span>
                          <span className="text-xs font-bold text-[hsl(var(--text-main))]">{program.slaFirstResponse ? `${program.slaFirstResponse}h Target` : '~24 Hours'}</span>
                       </div>
                       {program.slaTriage && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-tighter">Triage SLA</span>
                          <span className="text-xs font-bold text-[hsl(var(--text-main))]">{program.slaTriage}h</span>
                        </div>
                       )}
                       {program.slaResolution && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-tighter">Resolution SLA</span>
                          <span className="text-xs font-bold text-[hsl(var(--text-main))]">{program.slaResolution}h</span>
                        </div>
                       )}
                    </div>
                 </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl space-y-3">
                 <div className="flex items-center gap-2 text-amber-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Researcher Warning</span>
                 </div>
                 <p className="text-xs text-amber-500/80 leading-relaxed font-semibold">
                    Always stay within the defined scope. Testing outside of these assets may lead to disqualification or legal action.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
