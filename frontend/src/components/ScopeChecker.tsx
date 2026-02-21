import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Search, Loader2 } from 'lucide-react';
import axios from '../api/axios';

interface ScopeCheckerProps {
  programId: string;
}

const ScopeChecker: React.FC<ScopeCheckerProps> = ({ programId }) => {
  const [asset, setAsset] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inScope: boolean; message: string } | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setLoading(true);
    setResult(null);
    try {
      const response = await axios.post('/researcher/tools/check-scope', {
        programId,
        asset
      });
      setResult(response.data);
    } catch (error) {
      console.error('Scope Check Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[hsl(var(--text-main))] tracking-tight">Scope Checker</h3>
          <p className="text-[hsl(var(--text-muted))] text-xs font-medium uppercase tracking-wider">Verify if an asset is within the program scope</p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="relative">
        <input
          type="text"
          value={asset}
          onChange={(e) => setAsset(e.target.value)}
          placeholder="Enter asset (e.g., api.example.com)"
          className="w-full bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] rounded-lg py-3 pl-4 pr-12 text-[hsl(var(--text-main))] placeholder:text-[hsl(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
        />
        <button
          type="submit"
          disabled={loading || !asset}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[hsl(var(--text-muted))] hover:text-indigo-500 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
          result.inScope 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
        }`}>
          {result.inScope ? (
            <ShieldCheck className="w-5 h-5 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{result.inScope ? 'Asset In Scope' : 'Asset Out of Scope'}</p>
            <p className="text-sm opacity-80 mt-0.5">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScopeChecker;
