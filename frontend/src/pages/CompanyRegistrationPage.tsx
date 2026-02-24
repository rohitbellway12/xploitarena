import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import { Building2, ShieldCheck, User, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CompanyRegistrationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [biography, setBiography] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid registration link. Token is missing.");
      navigate("/login");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await api.get(`/auth/validate-invite/${token}`);
        setEmail(response.data.email);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Invalid or expired invitation");
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/auth/register-company", {
        token,
        firstName,
        lastName,
        username,
        website,
        address,
        phone,
        biography,
        password
      });
      toast.success("Registration successful! Waiting for admin approval.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bg-main))] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-main))] text-[hsl(var(--text-main))] flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-[2rem] overflow-hidden shadow-2xl relative my-10"
      >
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center relative">
          <Building2 className="w-10 h-10 text-white" />
          <div className="absolute -bottom-6 right-10 w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center border-4 border-[hsl(var(--bg-card))] shadow-xl">
             <ShieldCheck className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="p-10">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">
              Partner <span className="text-indigo-500">Node Entry</span>
            </h1>
            <p className="text-[hsl(var(--text-muted))] text-xs font-bold uppercase tracking-[0.2em] mt-3 leading-relaxed">
              Registering organizational intelligence for <span className="text-indigo-400">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Identity Cluster */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Admin First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                  <input
                    type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John" className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Admin Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" />
                  <input
                    type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe" className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Platform Username</label>
                <input
                  type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. AcmeSecurity" className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Corporate Website</label>
                <input
                  type="url" required value={website} onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://acme.org" className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                />
              </div>

               <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Contact Phone</label>
                <input
                  type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0199" className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                />
              </div>
              
               <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Security PIN / Password</label>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Physical Headquarters Address</label>
              <textarea
                required value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
                placeholder="Street, City, Zip, Country" className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Organizational Biography / Mission</label>
              <textarea
                required value={biography} onChange={(e) => setBiography(e.target.value)} rows={3}
                placeholder="Describe your security focus..." className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold resize-none"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-[10px] text-[hsl(var(--text-muted))] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Subject to administrative review and approval
          </p>
        </div>
      </motion.div>
    </div>
  );
}
