import { useState } from 'react';
import { MapPin, Menu, X, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { NavState } from '../../lib/types';

interface HeaderProps {
  nav: NavState;
  onNavigate: (state: NavState) => void;
}

export default function Header({ nav, onNavigate }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onNavigate({ page: 'home' });
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  const getDashboardPage = () => {
    if (profile?.role === 'super_admin') return 'super-admin';
    if (profile?.role === 'admin') return 'admin-dashboard';
    return 'user-dashboard';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate({ page: 'home' })}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <MapPin size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">Local<span className="text-primary-600">Ease</span></span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate({ page: 'browse' })}
              className={`text-sm font-medium transition-colors ${nav.page === 'browse' ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Browse
            </button>
            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span>{profile.full_name || 'Account'}</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-modal border border-neutral-100 py-1 z-50">
                    <button
                      onClick={() => { onNavigate({ page: getDashboardPage() as NavState['page'] }); setDropdownOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      {profile.role === 'super_admin' ? <Shield size={16} /> : <LayoutDashboard size={16} />}
                      Dashboard
                    </button>
                    <hr className="my-1 border-neutral-100" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-error-500 hover:bg-error-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate({ page: 'auth' })}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </nav>

          <button
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-4 py-4 space-y-3">
          <button
            onClick={() => { onNavigate({ page: 'browse' }); setMenuOpen(false); }}
            className="block w-full text-left text-sm font-medium text-neutral-700 py-2"
          >
            Browse Businesses
          </button>
          {user && profile ? (
            <>
              <button
                onClick={() => { onNavigate({ page: getDashboardPage() as NavState['page'] }); setMenuOpen(false); }}
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 py-2"
              >
                <User size={16} />
                Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-medium text-error-500 py-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => { onNavigate({ page: 'auth' }); setMenuOpen(false); }}
              className="w-full bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
}
