import { useState } from 'react';
import { MapPin, Mail, Lock, User, Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { NavState } from '../lib/types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

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
      onNavigate({ page: 'home' });
    } else {
      if (!fullName.trim()) { setError('Full name is required.'); setLoading(false); return; }
      const { error: err } = await signUp(email, password, fullName.trim(), role);
      if (err) { setError(err); setLoading(false); return; }
      onNavigate({ page: role === 'admin' ? 'admin-dashboard' : 'home' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-700 to-primary-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-400 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">LocalEase</h2>
          <p className="text-primary-200 text-lg leading-relaxed max-w-sm">
            Your gateway to discovering and booking the best local services.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[['500+', 'Local Businesses'], ['10K+', 'Happy Customers'], ['4.8★', 'Average Rating'], ['99%', 'Satisfaction Rate']].map(([num, label]) => (
              <div key={label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{num}</div>
                <div className="text-primary-200 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <MapPin size={20} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-neutral-900">Local<span className="text-primary-600">Ease</span></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8">
            <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 mb-8">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg capitalize transition-all ${
                    mode === m ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <Input
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  icon={<User size={16} />}
                  required
                />
              )}

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={<Mail size={16} />}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                  icon={<Lock size={16} />}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'user' as const, icon: <User size={18} />, label: 'Customer', desc: 'Browse & book services' },
                      { value: 'admin' as const, icon: <Building2 size={18} />, label: 'Business Owner', desc: 'List & manage your business' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          role === opt.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className={`mb-2 ${role === opt.value ? 'text-primary-600' : 'text-neutral-500'}`}>{opt.icon}</div>
                        <div className="font-medium text-neutral-900 text-sm">{opt.label}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-error-500 text-sm bg-error-50 px-4 py-2.5 rounded-lg">{error}</p>}

              <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <p className="text-center text-sm text-neutral-500 mt-6">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-primary-600 font-medium hover:text-primary-700"
              >
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
