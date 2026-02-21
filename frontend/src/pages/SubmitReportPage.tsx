import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { 
  Bug, 
  FileText, 
  Send, 
  ChevronLeft, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  Info,
  ArrowRight,
  UploadCloud,
  BookTemplate,
  CheckCircle2,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import CommentSection from '../components/CommentSection';
import ReportTimeline from '../components/ReportTimeline';

export default function SubmitReportPage() {
  const { programId, reportId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
  });
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(reportId || null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loadedReport, setLoadedReport] = useState<any>(null);

  const defaultTemplates = [
    {
      id: 'xss',
      name: 'Cross-Site Scripting (XSS)',
      title: 'Stored/Reflected XSS in [Endpoint]',
      severity: 'MEDIUM',
      description: `## Vulnerability Description\nCross-Site Scripting (XSS) was found on the [Endpoint] due to improper sanitization of user input.\n\n## Steps to Reproduce\n1. Go to [URL]\n2. Inject the following payload: \`<script>alert(1)</script>\`\n3. Notice the script execution.\n\n## Impact\nAn attacker can execute arbitrary JavaScript in the context of the victim's session, leading to account takeover or data theft.`
    },
    {
      id: 'sqli',
      name: 'SQL Injection (SQLi)',
      title: 'SQL Injection in [Parameter]',
      severity: 'CRITICAL',
      description: `## Vulnerability Description\nA SQL Injection vulnerability exists in the [Parameter] parameter, allowing an attacker to interact directly with the backend database.\n\n## Steps to Reproduce\n1. Navigate to [URL]\n2. Supply the following payload in the input field: \`' OR 1=1 --\`\n3. Check the response showing unintended database records.\n\n## Impact\nThis allows unauthorized access to sensitive database information, modifying or deleting data.`
    },
    {
      id: 'idor',
      name: 'Insecure Direct Object Reference (IDOR)',
      title: 'IDOR allowing unauthorized access to [Resource]',
      severity: 'HIGH',
      description: `## Vulnerability Description\nAn Insecure Direct Object Reference (IDOR) exists on [Endpoint], allowing users to access or modify resources belonging to other accounts.\n\n## Steps to Reproduce\n1. Log in as User A and observe the resource ID [ID_A].\n2. Log in as User B and attempt to access/modify resource [ID_A].\n3. The action succeeds despite lacking authorization.\n\n## Impact\nAttackers can view, modify, or delete sensitive data of other users.`
    }
  ];

  const [customTemplates, setCustomTemplates] = useState<any[]>(() => {
    const saved = localStorage.getItem('researcher_templates');
    return saved ? JSON.parse(saved) : [];
  });

  const allTemplates = [...defaultTemplates, ...customTemplates];

  const handleApplyTemplate = (templateId: string) => {
    if (!templateId) return;
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;
    setFormData({
      title: template.title,
      description: template.description,
      severity: template.severity,
    });
    toast.success(`${template.name} template applied!`);
  };

  const handleSaveTemplate = () => {
    if (!formData.title || !formData.description) {
       toast.error('Title and description are required to save a template');
       return;
    }
    const templateName = prompt('Enter a name for this template:');
    if (!templateName) return;

    const newTemplate = {
       id: `custom_${Date.now()}`,
       name: templateName,
       title: formData.title,
       severity: formData.severity,
       description: formData.description
    };
    
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    localStorage.setItem('researcher_templates', JSON.stringify(updated));
    toast.success('Template saved successfully!');
  };

  // Automated Quality Checker
  const checkQuality = () => {
    let score = 0;
    const checks = [
      { id: 'title', label: 'Descriptive Title', passed: formData.title.length > 10, weight: 20 },
      { id: 'desc_length', label: 'Detailed Description', passed: formData.description.length > 100, weight: 20 },
      { id: 'steps', label: 'Steps to Reproduce Included', passed: /step/i.test(formData.description), weight: 20 },
      { id: 'impact', label: 'Impact Analysis Included', passed: /impact/i.test(formData.description), weight: 20 },
      { id: 'poc', label: 'POC Attachment Provided', passed: !!file, weight: 20 }
    ];

    checks.forEach(check => {
      if (check.passed) score += check.weight;
    });

    return { score, checks };
  };

  const quality = checkQuality();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (reportId) {
          const reportRes = await api.get(`/reports/${reportId}`);
          const report = reportRes.data;
          setFormData({
            title: report.title,
            description: report.description,
            severity: report.severity,
          });
          setProgram(report.program);
          setCurrentDraftId(reportId);
          setLoadedReport(report);
        } else if (programId) {
          const programRes = await api.get(`/programs/${programId}`);
          setProgram(programRes.data);
        }
      } catch (error: any) {
        console.error('Fetch Data Error:', error);
        toast.error('Failed to load required data');
        navigate('/researcher/dashboard');
      }
    };
    fetchData();
  }, [programId, reportId, navigate]);

  // Auto-save logic (30s)
  useEffect(() => {
    if (!formData.title || !formData.description || submitting) return;

    const autoSave = async () => {
      try {
        if (currentDraftId) {
          await api.put(`/reports/${currentDraftId}`, { ...formData, status: 'DRAFT' });
        } else {
          const res = await api.post('/reports', { ...formData, programId, status: 'DRAFT' });
          setCurrentDraftId(res.data.report.id);
        }
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    };

    const timer = setInterval(autoSave, 30000); // 30 seconds
    return () => clearInterval(timer);
  }, [formData, currentDraftId, programId, submitting]);

  const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'SUBMITTED' = 'SUBMITTED') => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      let activeId = currentDraftId;
      
      if (activeId) {
        await api.put(`/reports/${activeId}`, { ...formData, status });
      } else {
        const res = await api.post('/reports', { ...formData, programId, status });
        activeId = res.data.report.id;
        setCurrentDraftId(activeId);
      }
      
      if (file && activeId) {
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('reportId', activeId);
        await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success(status === 'DRAFT' ? 'Report saved to drafts!' : 'Vulnerability submitted for review!');
      navigate('/researcher/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const severities = [
    { value: 'LOW', label: 'Low', color: 'bg-blue-500', icon: Shield, desc: 'Low impact issues like information disclosure.' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-amber-500', icon: ShieldAlert, desc: 'Common vulnerabilities with moderate risk.' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-500', icon: ShieldAlert, desc: 'High risk flaws that could lead to data loss.' },
    { value: 'CRITICAL', label: 'Critical', color: 'bg-rose-500', icon: AlertTriangle, desc: 'Remote code execution or direct system compromise.' },
  ];

  if (!program) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Navigation & Header */}
        <div className="flex items-start justify-between border-b border-[hsl(var(--border-subtle))] pb-8">
           <div className="flex items-center gap-6">
             <button 
                onClick={() => navigate(-1)}
                className="p-3 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-muted))] rounded-xl transition-all border border-[hsl(var(--border-subtle))]"
             >
                <ChevronLeft className="w-5 h-5" />
             </button>
             <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Bug className="w-4 h-4" />
                   </div>
                   <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight">
                     {reportId ? 'Edit Draft Report' : 'New Vulnerability Disclosure'}
                   </h1>
                </div>
                <p className="text-[hsl(var(--text-muted))] text-sm font-medium tracking-wide uppercase">
                   Target: <span className="text-indigo-400 font-bold">{program.name}</span>
                </p>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Main Form Area */}
           <div className="lg:col-span-3 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                 {/* Identification & Priority */}
                 <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-8 space-y-8 shadow-sm">
                    <div className="space-y-4">
                       <label className="text-xs font-black text-[hsl(var(--text-main))] uppercase tracking-[0.2em] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          Vulnerability Title
                       </label>
                       <input
                          required
                          value={formData.title}
                          onChange={e => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g. Broken Access Control on Account Settings"
                          className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-5 py-4 text-sm text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all placeholder:text-[hsl(var(--text-muted))] placeholder:opacity-50 font-semibold"
                       />
                    </div>

                    <div className="space-y-4">
                       <label className="text-xs font-black text-[hsl(var(--text-main))] uppercase tracking-[0.2em] flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-orange-400" />
                          Proposed Severity
                       </label>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {severities.map((sev) => {
                             const Icon = sev.icon;
                             const isActive = formData.severity === sev.value;
                             return (
                                <button
                                   key={sev.value}
                                   type="button"
                                   onClick={() => setFormData({ ...formData, severity: sev.value })}
                                   className={`p-4 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden ${
                                      isActive 
                                      ? `border-${sev.color.replace('bg-', '')}/50 ${sev.color.replace('bg-', 'bg-')}/5` 
                                      : 'border-[hsl(var(--border-subtle))] hover:bg-[hsl(var(--text-main))]/[0.02]'
                                   }`}
                                >
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${isActive ? sev.color : 'bg-[hsl(var(--text-main))]/[0.05] text-[hsl(var(--text-muted))]'}`}>
                                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                                   </div>
                                   <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? sev.color.replace('bg-', 'text-') : 'text-[hsl(var(--text-muted))]'}`}>{sev.label}</p>
                                   {isActive && (
                                     <motion.div 
                                       layoutId="active-indicator"
                                       className={`absolute bottom-0 right-0 p-1 ${sev.color} rounded-tl-lg`}
                                     >
                                        <ShieldCheck className="w-3 h-3 text-white" />
                                     </motion.div>
                                   )}
                                </button>
                             )
                          })}
                       </div>
                    </div>
                 </div>

                 {/* Detailed Disclosure */}
                 <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-8 space-y-6 shadow-sm">
                     <div className="space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[hsl(var(--border-subtle))] mb-4">
                           <label className="text-xs font-black text-[hsl(var(--text-main))] uppercase tracking-[0.2em] flex items-center gap-2">
                              <Shield className="w-4 h-4 text-indigo-400" />
                              Technical Details & Reproduce Steps
                           </label>
                           <div className="flex items-center gap-3">
                              <div className="relative">
                                 <select 
                                   onChange={(e) => {
                                      handleApplyTemplate(e.target.value);
                                      e.target.value = ""; // Reset after selection string so we can re-select same if needed
                                   }}
                                   value=""
                                   className="appearance-none bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest pl-8 pr-4 py-2 rounded-lg outline-none cursor-pointer hover:bg-indigo-500/20 transition-all custom-select"
                                 >
                                    <option value="" disabled>Load Template...</option>
                                    <optgroup label="System Templates">
                                       {defaultTemplates.map(t => (
                                          <option key={t.id} value={t.id}>{t.name}</option>
                                       ))}
                                    </optgroup>
                                    {customTemplates.length > 0 && (
                                       <optgroup label="My Templates">
                                          {customTemplates.map(t => (
                                             <option key={t.id} value={t.id}>{t.name}</option>
                                          ))}
                                       </optgroup>
                                    )}
                                 </select>
                                 <BookTemplate className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                              </div>
                              <button
                                 type="button"
                                 onClick={handleSaveTemplate}
                                 className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all flex items-center gap-1"
                              >
                                 Save as Template
                              </button>
                              <span className="text-[9px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest bg-[hsl(var(--text-main))]/[0.05] px-2 py-1 rounded hidden md:block">Markdown</span>
                           </div>
                        </div>
                        <textarea
                          required
                          rows={14}
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                          placeholder="## Description\nExplain the vulnerability here...\n\n## Impact\nWhat is the business impact?\n\n## Steps to Reproduce\n1. Go to...\n2. Click..."
                          className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-5 py-5 text-sm text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all font-mono leading-relaxed resize-none placeholder:text-[hsl(var(--text-muted))] placeholder:opacity-30"
                       />
                    </div>

                    <div className="space-y-4">
                       <label className="text-xs font-black text-[hsl(var(--text-main))] uppercase tracking-[0.2em] flex items-center gap-2">
                          <UploadCloud className="w-4 h-4 text-indigo-400" />
                          Proof-of-Concept Upload
                       </label>
                       <div 
                          className={`border-2 border-dashed rounded-2xl p-10 transition-all text-center cursor-pointer relative group overflow-hidden ${
                            file ? 'border-indigo-500/50 bg-indigo-500/5 shadow-inner' : 'border-[hsl(var(--border-subtle))] hover:border-indigo-500/50 hover:bg-[hsl(var(--text-main))]/[0.02]'
                          }`}
                          onClick={() => document.getElementById('file-upload')?.click()}
                       >
                          <input 
                            type="file" 
                            id="file-upload" 
                            className="hidden" 
                            onChange={(e) => {
                              const selected = e.target.files?.[0];
                              if (selected) {
                                if (selected.size > 25 * 1024 * 1024) {
                                  toast.error('File size must be less than 25MB');
                                  return;
                                }
                                setFile(selected);
                              }
                            }}
                          />
                          {!file ? (
                             <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400 group-hover:scale-110 transition-transform">
                                   <UploadCloud className="w-10 h-10" />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-[hsl(var(--text-main))]">Drop POC media or click to browse</p>
                                   <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase font-black tracking-widest mt-1">PDF, JPG, PNG, ZIP, TXT (Max 25MB)</p>
                                </div>
                             </div>
                          ) : (
                             <div className="flex items-center justify-center gap-4">
                                <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                   <FileText className="w-8 h-8" />
                                </div>
                                <div className="text-left">
                                   <p className="text-sm font-black text-[hsl(var(--text-main))] truncate max-w-xs">{file.name}</p>
                                   <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB • READY FOR TRANSMISSION</p>
                                </div>
                                <button 
                                   type="button"
                                   onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                   className="ml-4 p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all"
                                >
                                   <X className="w-4 h-4" />
                                </button>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                  {/* Action Bar */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-[hsl(var(--border-subtle))] mt-8">
                     <div className="flex items-center gap-3">
                        <button
                           type="button"
                           onClick={() => navigate(-1)}
                           className="px-6 py-3 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-muted))] font-bold rounded-xl border border-[hsl(var(--border-subtle))] transition-all text-[10px] uppercase tracking-widest"
                        >
                           Discard
                        </button>
                        {lastSaved && (
                          <div className="flex items-center gap-2 text-[hsl(var(--text-muted))] animate-in fade-in slide-in-from-left-2 transition-all">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                        )}
                     </div>
                     <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <button
                           type="button"
                           disabled={submitting}
                           onClick={(e) => handleSubmit(e as any, 'DRAFT')}
                           className="px-8 py-5 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 font-black rounded-xl border border-indigo-500/20 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                           <FileText className="w-4 h-4" />
                           Save to Cloud Draft
                        </button>
                       <button
                          type="submit"
                          disabled={submitting}
                          className="flex-[2] px-8 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-xl shadow-xl shadow-indigo-600/20 transition-all text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3"
                       >
                          {submitting ? 'Transmitting Data...' : 'Submit to Organization'}
                          <Send className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
               </form>
               
               {loadedReport && (
                  <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-8 shadow-sm mt-8">
                     <ReportTimeline report={loadedReport} />
                  </div>
               )}

               {reportId && (
                  <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-8 shadow-sm mt-8">
                     <CommentSection reportId={reportId} currentUserRole={JSON.parse(localStorage.getItem('user') || '{}').role || 'RESEARCHER'} />
                  </div>
               )}
            </div>

            {/* Sidebar: Guidelines */}
           <div className="space-y-6">
              {/* Quality Checker API */}
              <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 shadow-sm space-y-5">
                 <div className="flex items-center gap-3 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Report Quality</h3>
                 </div>
                 
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Quality Score</span>
                       <span className={`text-xs font-black ${
                          quality.score >= 80 ? 'text-emerald-500' : 
                          quality.score >= 40 ? 'text-amber-500' : 'text-rose-500'
                       }`}>{quality.score}%</span>
                    </div>
                    <div className="h-1.5 bg-[hsl(var(--text-main))]/[0.05] rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-500 rounded-full ${
                            quality.score >= 80 ? 'bg-emerald-500' : 
                            quality.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                         }`}
                         style={{ width: `${quality.score}%` }}
                       />
                    </div>
                 </div>

                 <div className="space-y-2.5">
                    {quality.checks.map(check => (
                       <div key={check.id} className="flex items-center gap-3">
                          <CheckCircle2 className={`w-4 h-4 transition-colors ${check.passed ? 'text-emerald-500' : 'text-[hsl(var(--text-muted))] opacity-30'}`} />
                          <span className={`text-[11px] font-bold ${check.passed ? 'text-[hsl(var(--text-main))]' : 'text-[hsl(var(--text-muted))]'}`}>
                             {check.label}
                          </span>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 shadow-sm space-y-6">
                 <div className="flex items-center gap-3 text-indigo-400">
                    <Info className="w-5 h-5" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Reporting Tips</h3>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black text-[hsl(var(--text-main))] uppercase flex items-center gap-2">
                          <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                          Be Descriptive
                       </p>
                       <p className="text-[11px] text-[hsl(var(--text-muted))] leading-relaxed font-medium">Use clear titles that summarize the vulnerability and the affected asset.</p>
                    </div>

                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black text-[hsl(var(--text-main))] uppercase flex items-center gap-2">
                          <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                          Clear Reproduction
                       </p>
                       <p className="text-[11px] text-[hsl(var(--text-muted))] leading-relaxed font-medium">Provide exact, step-by-step instructions. If a human can't follow it, we can't fix it.</p>
                    </div>

                    <div className="space-y-1.5">
                       <p className="text-[10px] font-black text-[hsl(var(--text-main))] uppercase flex items-center gap-2">
                          <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                          Risk Assessment
                       </p>
                       <p className="text-[11px] text-[hsl(var(--text-muted))] leading-relaxed font-medium">Explain the business impact. Why should the organization prioritize this fix?</p>
                    </div>
                 </div>
              </div>

              <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-2xl space-y-3">
                 <div className="flex items-center gap-2 text-rose-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Restricted Actions</span>
                 </div>
                 <ul className="space-y-2">
                    <li className="text-[11px] text-rose-500/80 font-semibold flex gap-2">
                       <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />
                       Do not exfiltrate customer data.
                    </li>
                    <li className="text-[11px] text-rose-500/80 font-semibold flex gap-2">
                       <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />
                       Avoid automated scanners on production.
                    </li>
                 </ul>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
