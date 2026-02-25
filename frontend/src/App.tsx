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
import AdminReportsPage from './pages/AdminReportsPage';
import ProtectedRoute from './components/ProtectedRoute';

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
            <Route path="/researcher/dashboard" element={<ProtectedRoute allowedRoles={['RESEARCHER', 'ADMIN', 'SUPER_ADMIN']}><ResearcherDashboard /></ProtectedRoute>} />
            <Route path="/researcher/programs" element={<ProtectedRoute allowedRoles={['RESEARCHER', 'ADMIN', 'SUPER_ADMIN']}><ProgramsPage /></ProtectedRoute>} />
            <Route path="/researcher/leaderboard" element={<ProtectedRoute allowedRoles={['RESEARCHER', 'ADMIN', 'SUPER_ADMIN']}><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/researcher/submissions" element={<ProtectedRoute allowedRoles={['RESEARCHER', 'ADMIN', 'SUPER_ADMIN']}><ResearcherSubmissionsPage /></ProtectedRoute>} />
            <Route path="/researcher/events" element={<ProtectedRoute allowedRoles={['RESEARCHER', 'ADMIN', 'SUPER_ADMIN']}><EventsPage /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute allowedRoles={['RESEARCHER', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'TRIAGER']}><EventsPage /></ProtectedRoute>} />
            <Route path="/researcher/teams" element={<ProtectedRoute allowedRoles={['RESEARCHER', 'ADMIN', 'SUPER_ADMIN']}><ResearcherTeamsPage /></ProtectedRoute>} />
            <Route path="/programs/:id" element={<ProtectedRoute><ProgramDetailPage /></ProtectedRoute>} />
            <Route path="/programs/:programId/submit" element={<ProtectedRoute allowedRoles={['RESEARCHER', 'ADMIN', 'SUPER_ADMIN']}><SubmitReportPage /></ProtectedRoute>} />
            <Route path="/reports/:reportId" element={<ProtectedRoute><SubmitReportPage /></ProtectedRoute>} />
            
            <Route path="/company/dashboard" element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN']}><CompanyDashboard /></ProtectedRoute>} />
            <Route path="/company/verify" element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN']}><CompanyKybPage /></ProtectedRoute>} />
            <Route path="/company/programs" element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN']}><CompanyProgramsPage /></ProtectedRoute>} />
            <Route path="/company/programs/edit/:id" element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN']}><EditProgramPage /></ProtectedRoute>} />
            <Route path="/company/create-program" element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN']}><CreateProgramPage /></ProtectedRoute>} />
            <Route path="/company/team" element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN']}><CompanyTeamPage /></ProtectedRoute>} />
            
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/researchers" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminResearcherList /></ProtectedRoute>} />
            <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminCompanyList /></ProtectedRoute>} />
            <Route path="/admin/triagers" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><TriagersPage /></ProtectedRoute>} />
            <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminAuditLogs /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminApprovals /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminReportsPage /></ProtectedRoute>} />
            <Route path="/admin/team" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminTeamPage /></ProtectedRoute>} />
            <Route path="/admin/employees" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><EmployeeManagementPage /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><RoleManagementPage /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminEventsPage /></ProtectedRoute>} />
            <Route path="/admin/permissions" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><PermissionRegistryPage /></ProtectedRoute>} />
            <Route path="/events/:id/dashboard" element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />
            
            <Route path="/triager/dashboard" element={<ProtectedRoute allowedRoles={['TRIAGER', 'ADMIN', 'SUPER_ADMIN']}><TriagerDashboard /></ProtectedRoute>} />
            
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
            <Route path="/team-management" element={<ProtectedRoute><TeamManagementPage /></ProtectedRoute>} />

            
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
