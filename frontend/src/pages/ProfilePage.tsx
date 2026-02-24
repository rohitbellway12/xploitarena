import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  User, 
  Shield, 
  Lock,
  Globe,
  Phone,
  FileText,
  Save,
  Key
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  username?: string;
  website?: string;
  phone?: string;
  biography?: string;
  address?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Profile Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    website: '',
    phone: '',
    biography: '',
    address: ''
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        const data = response.data;
        setUser(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          username: data.username || '',
          website: data.website || '',
          phone: data.phone || '',
          biography: data.biography || '',
          address: data.address || ''
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const response = await api.put('/auth/profile', formData);
      setUser(response.data.user);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setUpdating(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return (
    <DashboardLayout>
       <div className="p-12 text-center text-slate-500">
          Profile data unavailable
       </div>
    </DashboardLayout>
  );

  const isCompany = user.role === 'COMPANY_ADMIN';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
        <header className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.firstName} {user.lastName}</h1>
            <p className="text-slate-500 text-sm flex items-center gap-1">
              <Shield size={14} /> {user.role} • {user.email}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" /> Personal Information
                </h3>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                    <input 
                      type="text" 
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                    <input 
                      type="text" 
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    placeholder="@username"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                {isCompany && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Globe size={12} /> Website
                        </label>
                        <input 
                          type="url" 
                          value={formData.website}
                          onChange={e => setFormData({...formData, website: e.target.value})}
                          placeholder="https://example.com"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Phone size={12} /> Phone
                        </label>
                        <input 
                          type="tel" 
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          placeholder="+1234567890"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biography</label>
                      <textarea 
                        rows={3}
                        value={formData.biography}
                        onChange={e => setFormData({...formData, biography: e.target.value})}
                        placeholder="Tell us about your company..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium resize-none"
                      />
                    </div>
                  </>
                )}

                <button 
                  type="submit"
                  disabled={updating}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm"
                >
                  <Save size={16} /> {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </section>
          </div>

          {/* Right Column: Security */}
          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock size={18} className="text-rose-500" /> Security
                </h3>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                  <input 
                    type="password" 
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-rose-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                  <input 
                    type="password" 
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-rose-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-rose-500 transition-all font-medium"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm"
                >
                  <Key size={16} /> {updating ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
