import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GitHubCallback from './pages/GitHubCallback';
import ResearcherDashboard from './pages/ResearcherDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TriagerDashboard from './pages/TriagerDashboard';
import ProgramsPage from './pages/ProgramsPage';
import CreateProgramPage from './pages/CreateProgramPage';
import SubmitReportPage from './pages/SubmitReportPage';
import EventsPage from './pages/EventsPage';
import AdminResearcherList from './pages/AdminResearcherList';
import AdminCompanyList from './pages/AdminCompanyList';
import AdminAuditLogs from './pages/AdminAuditLogs';
import TriagersPage from './pages/TriagersPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import CompanyRegistrationPage from './pages/CompanyRegistrationPage';
import AdminApprovals from './pages/AdminApprovals';
import CompanyProgramsPage from './pages/CompanyProgramsPage';
import EditProgramPage from './pages/EditProgramPage';
import ProgramDetailPage from './pages/ProgramDetailPage';
import TeamManagementPage from './pages/TeamManagementPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PermissionRegistryPage from './pages/PermissionRegistryPage';
import CompanyKybPage from './pages/CompanyKybPage';
import CompanyTeamPage from './pages/CompanyTeamPage';
import AdminTeamPage from './pages/AdminTeamPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import RoleManagementPage from './pages/RoleManagementPage';
import AdminEventsPage from './pages/AdminEventsPage';
import EventDashboard from './pages/EventDashboard';
import InboxPage from './pages/InboxPage';
import ResearcherSubmissionsPage from './pages/ResearcherSubmissionsPage';
import ResearcherTeamsPage from './pages/ResearcherTeamsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } }} />
        <div className="min-h-screen bg-[hsl(var(--bg-main))] text-[hsl(var(--text-main))] selection:bg-indigo-500/30 transition-colors duration-300">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register-company" element={<CompanyRegistrationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
            <Route path="/auth/github/callback" element={<GitHubCallback />} />
            
            {/* Dashboard Routes */}
            <Route path="/researcher/dashboard" element={<ResearcherDashboard />} />
            <Route path="/researcher/programs" element={<ProgramsPage />} />
            <Route path="/researcher/leaderboard" element={<LeaderboardPage />} />
            <Route path="/researcher/submissions" element={<ResearcherSubmissionsPage />} />
            <Route path="/researcher/events" element={<EventsPage />} />
            <Route path="/researcher/teams" element={<ResearcherTeamsPage />} />
            <Route path="/programs/:id" element={<ProgramDetailPage />} />
            <Route path="/programs/:programId/submit" element={<SubmitReportPage />} />
            <Route path="/reports/:reportId" element={<SubmitReportPage />} />
            <Route path="/company/dashboard" element={<CompanyDashboard />} />
            <Route path="/company/verify" element={<CompanyKybPage />} />
            <Route path="/company/programs" element={<CompanyProgramsPage />} />
            <Route path="/company/programs/edit/:id" element={<EditProgramPage />} />
            <Route path="/company/create-program" element={<CreateProgramPage />} />
            <Route path="/company/team" element={<CompanyTeamPage />} />
            

            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/researchers" element={<AdminResearcherList />} />
            <Route path="/admin/companies" element={<AdminCompanyList />} />
            <Route path="/admin/triagers" element={<TriagersPage />} />
            <Route path="/admin/logs" element={<AdminAuditLogs />} />
            <Route path="/admin/approvals" element={<AdminApprovals />} />
            <Route path="/admin/team" element={<AdminTeamPage />} />
            <Route path="/admin/employees" element={<EmployeeManagementPage />} />
            <Route path="/admin/roles" element={<RoleManagementPage />} />
            <Route path="/admin/events" element={<AdminEventsPage />} />
            <Route path="/events/:id/dashboard" element={<EventDashboard />} />
            
            <Route path="/triager/dashboard" element={<TriagerDashboard />} />
            
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/team-management" element={<TeamManagementPage />} />
            <Route path="/admin/permissions" element={<PermissionRegistryPage />} />
            
            <Route path="/" element={
              <div className="dark flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[hsl(var(--bg-main))] text-[hsl(var(--text-main))]">
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
                  Xploit<span className="text-indigo-500">Arena</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-400 max-w-2xl">
                  The ultimate hub for security researchers and organizations. 
                  Streamlining bug bounty programs with transparency and efficiency.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <a href="/login" className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 transition-all">
                    Login
                  </a>
                  <a href="/register" className="text-sm font-semibold leading-6 text-white hover:text-indigo-400 transition-colors">
                    Join Now <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
