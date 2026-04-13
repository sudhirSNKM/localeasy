import { useState } from 'react';
import { MapPin, Mail, Lock, User, Building2, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { NavState } from '../lib/types';
import Button from '../components/ui/Button';

interface AuthProps {
  onNavigate: (state: NavState) => void;
}

type Mode = 'login' | 'register';

export default function Auth({ onNavigate }: AuthProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) { setError(err); setLoading(false); return; }
      // Role-based redirect after login is handled by AuthContext profile
      // We navigate home and let Header direct them
      onNavigate({ page: 'home' });
    } else {
      if (!fullName.trim()) { setError('Full name is required.'); setLoading(false); return; }
      const { error: err } = await signUp(email, password, fullName.trim(), role);
      if (err) { setError(err); setLoading(false); return; }
      // After registration, send to appropriate page
      if (role === 'admin') {
        onNavigate({ page: 'admin-dashboard' });
      } else {
        onNavigate({ page: 'home' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel – hidden on mobile */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-700 to-blue-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative text-center text-white">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-6 shadow-2xl shadow-blue-900/20">
            <img src="/logo.png" className="w-full h-full object-cover" alt="LocalEase Logo" />
          </div>
          <h2 className="text-3xl font-bold mb-4">LocalEase</h2>
          <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
            Your gateway to discovering and booking the best local services.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[['500+', 'Local Businesses'], ['10K+', 'Happy Customers'], ['4.8★', 'Average Rating'], ['99%', 'Satisfaction Rate']].map(([num, label]) => (
              <div key={label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{num}</div>
                <div className="text-blue-200 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-200">
                <img src="/logo.png" className="w-full h-full object-cover" alt="LocalEase Logo" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Local<span className="text-blue-600">Ease</span></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Tab Toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg capitalize transition-all ${
                    mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            {/* Demo Credentials */}
            {mode === 'login' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-3 uppercase tracking-wider">
                  <Shield size={14} /> Demo Access
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Super Admin:</span>
                    <button
                      onClick={() => { setEmail('superadmin@localeasy.com'); setPassword('admin123'); }}
                      className="font-mono text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      superadmin@localeasy.com
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Password:</span>
                    <span className="font-mono text-gray-600 font-semibold">admin123</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                    required
                    minLength={6}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Account Type selector for registration */}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'user' as const, icon: <User size={20} />, label: 'Customer', desc: 'Browse & book services' },
                      { value: 'admin' as const, icon: <Building2 size={20} />, label: 'Business Owner', desc: 'Manage your business' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col h-full relative group ${
                          role === opt.value
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm shadow-blue-100'
                            : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all ${
                          role === opt.value 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                          {opt.icon}
                        </div>
                        <div className="font-bold text-gray-900 text-sm leading-tight flex-grow mb-1">
                          {opt.label}
                        </div>
                        <div className="text-[11px] leading-relaxed text-gray-500">
                          {opt.desc}
                        </div>
                        {role === opt.value && (
                          <div className="absolute top-3 right-3">
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">{error}</p>
              )}

              <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
