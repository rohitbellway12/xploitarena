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
  Cpu,
  type LucideIcon
} from 'lucide-react';

interface SidebarProps {
  role: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const permissions = user?.permissions || [];
  const isRoot = !user?.parentId;

  const adminLinks: NavItem[] = [
    { name: 'Management', path: '/admin/dashboard', icon: LayoutDashboard, permission: 'admin:stats' },
    { name: 'Researchers', path: '/admin/researchers', icon: Users, permission: 'admin:researchers' },
    { name: 'Company Hub', path: '/admin/companies', icon: Building2, permission: 'admin:companies' },
    { name: 'Triagers', path: '/admin/triagers', icon: ShieldCheck, permission: 'admin:triagers' },
    { name: 'Audit Logs', path: '/admin/logs', icon: FileText, permission: 'admin:audit' },
    { name: 'Permissions', path: '/admin/permissions', icon: ShieldCheck, permission: 'admin:settings' },
    { name: 'Event Management', path: '/admin/events', icon: Trophy, permission: 'admin:events' },
    { name: 'Admin Team', path: '/admin/team', icon: Users, permission: 'admin:stats' },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const companyLinks: NavItem[] = [
    { name: 'Overview', path: '/company/dashboard', icon: LayoutDashboard, permission: 'company:stats' },
    { name: 'Programs', path: '/company/programs', icon: ShieldCheck, permission: 'company:programs' },
    { name: 'Events', path: '/events', icon: Trophy },
    { name: 'Asset Management', path: '#', icon: Building2 },
    { name: 'Security Review', path: '#', icon: CheckCircle2 },
    { name: 'Team', path: '/team-management', icon: Users, permission: 'company:team' },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const researcherLinks: NavItem[] = [
    { name: 'Dashboard', path: '/researcher/dashboard', icon: LayoutDashboard, permission: 'researcher:dashboard' },
    { name: 'Directory', path: '/researcher/programs', icon: Search, permission: 'researcher:programs' },
    { name: 'Events', path: '/researcher/events', icon: Trophy },
    { name: 'Submissions', path: '/researcher/submissions', icon: FileText, permission: 'researcher:reports' },
    { name: 'Leaderboard', path: '/researcher/leaderboard', icon: Trophy, permission: 'researcher:leaderboard' },
    { name: 'Team', path: '/researcher/teams', icon: Users, permission: 'researcher:teams' },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const triagerLinks: NavItem[] = [
    { name: 'Triage Panel', path: '/triager/dashboard', icon: LayoutDashboard },
    { name: 'Public Programs', path: '/researcher/programs', icon: Search },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const getLinks = () => {
    let baseLinks: NavItem[] = [];
    switch (role) {
      case 'SUPER_ADMIN': return adminLinks; // Super Admin sees all
      case 'ADMIN': baseLinks = adminLinks; break;
      case 'COMPANY_ADMIN': baseLinks = companyLinks; break;
      case 'TRIAGER': baseLinks = triagerLinks; break;
      default: baseLinks = researcherLinks; break;
    }

    // If Root, they see everything in their category
    if (isRoot && role !== 'SUPER_ADMIN') {
      return baseLinks;
    }

    // If sub-account, filter by explicit permissions
    // Note: If permissions are empty, they will only see links without the 'permission' key (like Settings)


    return baseLinks.filter(link => {
      if (!link.permission) return true; // Always show settings/links without perms
      return permissions.includes(link.permission);
    });
  };

  const links = getLinks();

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
                e.preventDefault();
                if (link.path !== '#') navigate(link.path);
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
