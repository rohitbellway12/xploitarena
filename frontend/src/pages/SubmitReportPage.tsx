import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api/axios';
import { Bug, FileText, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  useEffect(() => {
    const fetchData = async () => {
      console.log('SubmitReportPage: reportId:', reportId, 'programId:', programId);
      try {
        if (reportId) {
          console.log('Fetching report:', reportId);
          const reportRes = await api.get(`/reports/${reportId}`);
          const report = reportRes.data;
          console.log('Fetched Report Data:', report);
          setFormData({
            title: report.title,
            description: report.description,
            severity: report.severity,
          });
          setProgram(report.program);
        } else if (programId) {
          const programRes = await api.get(`/programs/${programId}`);
          setProgram(programRes.data);
        }
      } catch (error) {
        console.error('Fetch Data Error:', error);
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, [programId, reportId]);

  const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'SUBMITTED' = 'SUBMITTED') => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (reportId) {
        await api.put(`/reports/${reportId}`, { ...formData, status });
      } else {
        await api.post('/reports', { ...formData, programId, status });
      }
      toast.success(status === 'DRAFT' ? 'Draft saved!' : 'Report submitted successfully!');
      navigate('/researcher/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!program) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold uppercase tracking-widest mb-2">
            <Bug className="w-4 h-4" />
            Vulnerability Report
          </div>
          <h1 className="text-3xl font-bold text-[hsl(var(--text-main))]">Reporting to {program.name}</h1>
          <p className="text-[hsl(var(--text-muted))] mt-2 text-sm uppercase tracking-wider font-bold">Provide detailed information about the vulnerability you discovered.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[hsl(var(--text-main))]">Vulnerability Title</label>
              <input
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. SQL Injection on login form"
                className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all placeholder:text-[hsl(var(--text-muted))]/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[hsl(var(--text-main))]">Severity Level</label>
                <div className="relative">
                  <select
                    value={formData.severity}
                    onChange={e => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--text-muted))]">
                    <Bug className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[hsl(var(--text-main))] flex items-center justify-between">
                <span>Vulnerability Description & Steps to Reproduce</span>
                <span className="text-[10px] text-[hsl(var(--text-muted))] uppercase font-black tracking-widest">Markdown Supported</span>
              </label>
              <textarea
                required
                rows={10}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the bug, impact, and exact steps to reproduce..."
                className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-xl px-4 py-3 text-[hsl(var(--text-main))] focus:border-indigo-500 outline-none transition-all font-mono text-sm resize-none placeholder:text-[hsl(var(--text-muted))]/50"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full md:w-auto px-8 bg-[hsl(var(--text-main))]/[0.05] hover:bg-[hsl(var(--text-main))]/[0.1] text-[hsl(var(--text-main))] font-bold py-4 rounded-xl transition-all border border-[hsl(var(--border-subtle))]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e as any, 'DRAFT')}
              className="w-full md:flex-1 bg-[hsl(var(--text-main))]/[0.05] hover:bg-indigo-500/10 text-[hsl(var(--text-main))] hover:text-indigo-400 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-indigo-500/20"
            >
              <FileText className="w-4 h-4" />
              Save Draft
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:flex-[2] bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-500/50 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Vulnerability'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
