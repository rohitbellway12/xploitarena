import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Plus, Mail, Calendar, Shield } from 'lucide-react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Triager {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isVerified: boolean;
  isActive: boolean;
}

export default function TriagersPage() {
  const [triagers, setTriagers] = useState<Triager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTriager, setSelectedTriager] = useState<Triager | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTriagers();
  }, []);

  const fetchTriagers = async () => {
    try {
      const response = await api.get('/admin/triagers');
      setTriagers(response.data);
    } catch (error) {
      console.error('Failed to fetch triagers:', error);
      toast.error('Failed to load triagers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTriager = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await api.post('/admin/create-triager', formData);
      toast.success('Triager account created successfully!');
      setFormData({ email: '', firstName: '', lastName: '', password: '' });
      setShowCreateForm(false);
      fetchTriagers(); // Refresh list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create Triager account');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (triager: Triager) => {
    try {
      const response = await api.patch(`/admin/users/${triager.id}/toggle-status`, {
        isActive: !triager.isActive
      });
      toast.success(response.data.message);
      fetchTriagers(); // Refresh list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full space-y-8 animate-pulse p-4">
          <div className="h-8 w-48 bg-white/5 rounded"></div>
          <div className="h-96 bg-white/5 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[hsl(var(--border-subtle))] pb-8">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-main))] tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-500" />
              Triager Management
            </h1>
            <p className="text-[hsl(var(--text-muted))] text-sm mt-1">
              Manage vulnerability review team members
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Create Triager
          </button>
        </div>

        {/* Create Form (Collapsible) */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl p-6"
          >
            <h3 className="text-sm font-bold text-[hsl(var(--text-main))] mb-4 uppercase tracking-wide">
              New Triager Account
            </h3>
            <form onSubmit={handleCreateTriager} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
                  placeholder="triager@xploitarena.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 focus:bg-[hsl(var(--text-main))]/[0.06] sm:text-sm transition-all outline-none"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[hsl(var(--text-main))]/[0.05] transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Triagers List */}
        <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.01]">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-subtle))]">
                {triagers.map((triager) => (
                  <tr key={triager.id} className="hover:bg-[hsl(var(--text-main))]/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                          {triager.firstName[0]}{triager.lastName[0]}
                        </div>
                        <span className="text-sm font-semibold text-[hsl(var(--text-main))]">
                          {triager.firstName} {triager.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-[hsl(var(--text-muted))]">
                        <Mail className="w-3 h-3" />
                        {triager.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-black tracking-tighter uppercase ${
                        triager.isVerified 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                      }`}>
                        {triager.isVerified ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-[hsl(var(--text-muted))] font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(triager.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={triager.isActive}
                            onChange={() => handleToggleStatus(triager)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-rose-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500/30"></div>
                        </label>
                        
                        <button
                          onClick={() => {
                            setSelectedTriager(triager);
                            setShowViewModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTriager(triager);
                            setShowEditModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {triagers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[hsl(var(--text-muted))] text-xs font-medium uppercase tracking-widest">
                      No triagers found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Triager Modal */}
        {showViewModal && selectedTriager && (
          <ViewTriagerModal
            triager={selectedTriager}
            onClose={() => {
              setShowViewModal(false);
              setSelectedTriager(null);
            }}
          />
        )}

        {/* Edit Triager Modal */}
        {showEditModal && selectedTriager && (
          <EditTriagerModal
            triager={selectedTriager}
            onClose={() => {
              setShowEditModal(false);
              setSelectedTriager(null);
            }}
            onUpdate={fetchTriagers}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// View Triager Modal Component (Read-only)
interface ViewTriagerModalProps {
  triager: Triager;
  onClose: () => void;
}

function ViewTriagerModal({ triager, onClose }: ViewTriagerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h3 className="text-lg font-bold text-[hsl(var(--text-main))] mb-4 uppercase tracking-wide">
          Triager Details
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5">
              Name
            </label>
            <p className="text-sm text-[hsl(var(--text-main))] font-semibold">
              {triager.firstName} {triager.lastName}
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5">
              Email
            </label>
            <p className="text-sm text-[hsl(var(--text-muted))]">{triager.email}</p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5">
              Status
            </label>
            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
              triager.isActive 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
            }`}>
              {triager.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5">
              Verification Status
            </label>
            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
              triager.isVerified 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
            }`}>
              {triager.isVerified ? 'Verified' : 'Pending'}
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5">
              Created On
            </label>
            <p className="text-sm text-[hsl(var(--text-muted))] font-mono">
              {new Date(triager.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[hsl(var(--text-main))]/[0.05] transition-all"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}

// Edit Triager Modal Component
interface EditTriagerModalProps {
  triager: Triager;
  onClose: () => void;
  onUpdate: () => void;
}

function EditTriagerModal({ triager, onClose, onUpdate }: EditTriagerModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setUpdating(true);
    try {
      await api.patch(`/admin/triagers/${triager.id}/password`, { password: newPassword });
      toast.success('Password updated successfully!');
      setNewPassword('');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-subtle))] rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h3 className="text-lg font-bold text-[hsl(var(--text-main))] mb-4 uppercase tracking-wide">
          Manage Triager
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5">
              Name
            </label>
            <p className="text-sm text-[hsl(var(--text-main))] font-semibold">
              {triager.firstName} {triager.lastName}
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5">
              Email
            </label>
            <p className="text-sm text-[hsl(var(--text-muted))]">{triager.email}</p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--text-main))]/[0.03] px-4 py-3.5 text-[hsl(var(--text-main))] placeholder-[hsl(var(--text-muted))]/40 focus:border-indigo-500/50 sm:text-sm transition-all outline-none"
                placeholder="Enter new password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-indigo-400 text-xs font-bold uppercase tracking-widest"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpdatePassword}
            disabled={updating || !newPassword}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : 'Update Password'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-[hsl(var(--text-main))]/[0.05] transition-all"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
