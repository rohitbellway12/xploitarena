import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Users, 
  Settings,
  LogOut, 
  Trophy, 
  ShieldCheck,
  Building2,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const researcherLinks = [
    { name: 'Dashboard', path: '/researcher/dashboard', icon: LayoutDashboard },
    { name: 'Directory', path: '/researcher/programs', icon: Search },
    { name: 'Submissions', path: '#', icon: FileText },
    { name: 'Leaderboard', path: '/researcher/events', icon: Trophy },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const companyLinks = [
    { name: 'Overview', path: '/company/dashboard', icon: LayoutDashboard },
    { name: 'Programs', path: '/company/create-program', icon: ShieldCheck },
    { name: 'Asset Management', path: '#', icon: Building2 },
    { name: 'Team Access', path: '/company/teams', icon: Users },
    { name: 'Security Review', path: '#', icon: CheckCircle2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminLinks = [
    { name: 'Management', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Researchers', path: '/admin/researchers', icon: Users },
    { name: 'Company Hub', path: '/admin/companies', icon: Building2 },
    { name: 'Audit Logs', path: '/admin/logs', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const links = (role === 'ADMIN' || role === 'SUPER_ADMIN') ? adminLinks : role === 'COMPANY_ADMIN' ? companyLinks : researcherLinks;

  return (
    <aside className="w-64 bg-[hsl(var(--bg-card))] border-r border-[hsl(var(--border-subtle))] flex flex-col h-screen sticky top-0 overflow-hidden transition-colors duration-300">
      <div className="p-8 flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/10 ring-1 ring-white/10 shrink-0">
          <Cpu className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-[hsl(var(--text-main))] uppercase">Xploit<span className="text-indigo-400">Arena</span></span>
          <span className="text-[8px] font-bold text-[hsl(var(--text-muted))] tracking-[0.3em] uppercase opacity-70">Security Nexus</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        <p className="px-4 text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-[0.2em] mb-4">Operations</p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <a
              key={link.name}
              href={link.path}
              onClick={(e) => {
                if (link.path === '#') e.preventDefault();
                else navigate(link.path);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-500 dark:text-white shadow-sm ring-1 ring-indigo-500/20' 
                  : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-main))] hover:bg-[hsl(var(--text-main))]/[0.03]'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-[hsl(var(--text-muted))] group-hover:text-indigo-400'}`} />
              <span className="uppercase tracking-widest">{link.name}</span>
            </a>
          );
        })}
      </nav>

      <div className="p-6">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-[10px] font-bold text-[hsl(var(--text-muted))] hover:text-rose-400 hover:bg-rose-500/5 transition-all uppercase tracking-widest"
        >
          <LogOut className="w-3.5 h-3.5 opacity-60" />
          Terminate
        </button>
      </div>
    </aside>
  );
}
