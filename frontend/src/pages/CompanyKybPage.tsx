import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import { ShieldCheck, Upload, Clock, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CompanyKybPage() {
  const [loading, setLoading] = useState(true);
  const [kybStatus, setKybStatus] = useState<string>("UNVERIFIED");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get("/auth/me");
        setKybStatus(res.data.kybStatus || "UNVERIFIED");
      } catch (error) {
        console.error("Failed to fetch KYB status:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one document");
      return;
    }

    setSubmitting(true);
    try {
      const documentIds: string[] = [];

      // Upload each file
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        documentIds.push(res.data.file.id);
      }

      // Submit verification
      await api.post("/company/verify", {
        documentIds,
        companyDetails: "Company Verification Request"
      });

      toast.success("Verification documents submitted!");
      setKybStatus("PENDING");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><div className="p-8 animate-pulse bg-white/5 rounded-3xl h-96"></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
        <div className="border-b border-[hsl(var(--border-subtle))] pb-8">
          <h1 className="text-3xl font-black text-[hsl(var(--text-main))] tracking-tight flex items-center gap-3 uppercase">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
            Company Identity Verification
          </h1>
          <p className="text-[hsl(var(--text-muted))] text-sm mt-1 uppercase tracking-wider font-bold">Know Your Business (KYB) Compliance Framework</p>
        </div>

        {kybStatus === 'VERIFIED' ? (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-12 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
               <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
               <h2 className="text-2xl font-black text-[hsl(var(--text-main))] uppercase">Organization Verified</h2>
               <p className="text-[hsl(var(--text-muted))] mt-2 font-medium">Your company is fully verified. You have full access to all private program features.</p>
            </div>
            <button 
              onClick={() => navigate('/company/dashboard')}
              className="px-8 py-4 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-emerald-500/20"
            >
              Back to Terminal
            </button>
          </div>
        ) : kybStatus === 'PENDING' ? (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-12 text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
               <Clock className="w-10 h-10 animate-spin-slow" />
            </div>
            <div>
               <h2 className="text-2xl font-black text-[hsl(var(--text-main))] uppercase">Review In Progress</h2>
               <p className="text-[hsl(var(--text-muted))] mt-2 font-medium text-sm">Our compliance team is currently reviewing your documentation. This usually takes 24-48 business hours.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
               <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] p-8 rounded-[2.5rem] space-y-8">
                  <div className="space-y-4">
                     <h3 className="text-sm font-black text-[hsl(var(--text-main))] uppercase tracking-widest">Upload Required Documentation</h3>
                     <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">Please provide a valid Registration Certificate (Incorporation) and a Business Address Proof to proceed with account activation.</p>
                  </div>

                  <div className="relative group">
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-[hsl(var(--border-subtle))] group-hover:border-indigo-500/50 group-hover:bg-indigo-500/[0.02] p-12 rounded-[2rem] text-center transition-all flex flex-col items-center gap-4">
                       <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-xs font-black text-[hsl(var(--text-main))] uppercase tracking-widest">Select Intelligence Files</p>
                          <p className="text-[10px] text-[hsl(var(--text-muted))] mt-1 uppercase font-bold">PDF, JPG, or PNG (MAX 10MB)</p>
                       </div>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest px-1">Selected Assets ({files.length})</p>
                       <div className="grid grid-cols-1 gap-2">
                          {files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[hsl(var(--text-main))]/[0.03] rounded-xl border border-[hsl(var(--border-subtle))]">
                               <div className="flex items-center gap-3 overflow-hidden">
                                  <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                  <span className="text-xs font-bold text-[hsl(var(--text-main))] truncate">{f.name}</span>
                               </div>
                               <button onClick={() => removeFile(i)} className="text-[hsl(var(--text-muted))] hover:text-rose-500 transition-colors">
                                  <X className="w-4 h-4" />
                               </button>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <button 
                    disabled={submitting || files.length === 0}
                    onClick={handleSubmit}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
                  >
                    {submitting ? 'TRANSMITTING...' : 'INITIATE VERIFICATION'}
                  </button>
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-[2.5rem] space-y-4">
                  <div className="flex items-center gap-3 text-amber-500">
                     <AlertCircle className="w-5 h-5" />
                     <h4 className="text-[10px] font-black uppercase tracking-widest">Access Restricted</h4>
                  </div>
                  <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] leading-relaxed uppercase">Verification is mandatory to launch private programs and invite researchers. Your account remains in 'Restricted Strategy' mode until KYB completion.</p>
               </div>

               <div className="bg-indigo-500 border border-indigo-400/20 p-8 rounded-[2.5rem] text-white">
                  <h4 className="text-xs font-black uppercase tracking-widest mb-4">Security Standards</h4>
                  <ul className="space-y-3">
                     {[
                       "ISO/IEC 27001 Compliance",
                       "Encrypted Document Vault",
                       "Automated Malware Scan",
                       "Global Sanctions Screening"
                     ].map(item => (
                       <li key={item} className="flex items-center gap-2 text-[10px] font-bold opacity-80">
                          <CheckCircle2 className="w-3 h-3" />
                          {item}
                       </li>
                     ))}
                  </ul>
               </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
