import { useState } from 'react';
import { MapPin, Menu, X, LogOut, LayoutDashboard, Shield, BookOpen, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { NavState } from '../../lib/types';

interface HeaderProps {
  nav: NavState;
  onNavigate: (state: NavState) => void;
}

const isEmoji = (str: string) => {
  // Simple check: if avatar_url is a short string (emoji), use it directly
  return str && str.length <= 4;
};

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

  const getDashboardPage = (): NavState['page'] => {
    if (profile?.role === 'super_admin') return 'super-admin';
    if (profile?.role === 'admin') return 'admin-dashboard';
    return 'user-dashboard';
  };

  const getDashboardLabel = () => {
    if (profile?.role === 'super_admin') return { icon: <Shield size={15} className="text-blue-600" />, text: 'Super Admin' };
    if (profile?.role === 'admin') return { icon: <LayoutDashboard size={15} className="text-blue-600" />, text: 'Business Console' };
    return { icon: <BookOpen size={15} className="text-blue-600" />, text: 'My Bookings' };
  };

  const dashLabel = getDashboardLabel();

  // Determine avatar display
  const avatar = profile?.avatar_url;
  const useEmojiAvatar = avatar && isEmoji(avatar);
  const initial = profile?.full_name?.charAt(0)?.toUpperCase() || 'U';

  // Check profile completion
  const profileComplete = profile && profile.full_name && profile.phone && profile.phone.length >= 10;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button
            onClick={() => onNavigate({ page: 'home' })}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MapPin size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Local<span className="text-blue-600">Ease</span></span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate({ page: 'browse' })}
              className={`text-sm font-semibold transition-colors ${
                nav.page === 'browse' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Browse
            </button>

            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base relative ${
                    useEmojiAvatar ? 'bg-blue-50 border-2 border-blue-100 text-xl' : 'bg-blue-600 text-white'
                  }`}>
                    {useEmojiAvatar ? avatar : initial}
                    {/* Red dot if profile incomplete */}
                    {!profileComplete && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <span className="max-w-[100px] truncate">{profile.full_name?.split(' ')[0] || 'Account'}</span>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                      
                      {/* Profile header in dropdown */}
                      <div className="px-4 py-3 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                            useEmojiAvatar ? 'bg-blue-50' : 'bg-blue-600 text-white font-bold'
                          }`}>
                            {useEmojiAvatar ? avatar : initial}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">{profile.full_name}</div>
                            <div className={`text-xs font-semibold ${
                              profile.role === 'super_admin' ? 'text-purple-600' :
                              profile.role === 'admin' ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {profile.role === 'super_admin' ? '⚡ Super Admin' :
                               profile.role === 'admin' ? '🏢 Business Owner' : '👤 Customer'}
                            </div>
                          </div>
                        </div>
                        {!profileComplete && (
                          <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5 font-medium">
                            ⚠️ Complete your profile
                          </div>
                        )}
                      </div>

                      {/* Edit Profile */}
                      <button
                        onClick={() => { onNavigate({ page: 'profile' }); setDropdownOpen(false); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <UserCircle size={15} className="text-gray-400" /> Edit Profile
                      </button>

                      {/* Dashboard link */}
                      <button
                        onClick={() => { onNavigate({ page: getDashboardPage() }); setDropdownOpen(false); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
                      >
                        {dashLabel.icon}
                        {dashLabel.text}
                      </button>

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate({ page: 'auth' })}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1">
          <button
            onClick={() => { onNavigate({ page: 'browse' }); setMenuOpen(false); }}
            className="block w-full text-left text-sm font-semibold text-gray-700 py-2.5 px-3 rounded-xl hover:bg-gray-50"
          >
            Browse Businesses
          </button>
          {user && profile ? (
            <>
              <button
                onClick={() => { onNavigate({ page: 'profile' }); setMenuOpen(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 py-2.5 px-3 rounded-xl hover:bg-gray-50 w-full"
              >
                <UserCircle size={15} /> Edit Profile {!profileComplete && '⚠️'}
              </button>
              <button
                onClick={() => { onNavigate({ page: getDashboardPage() }); setMenuOpen(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 py-2.5 px-3 rounded-xl hover:bg-gray-50 w-full"
              >
                {dashLabel.icon} {dashLabel.text}
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-semibold text-red-500 py-2.5 px-3 rounded-xl hover:bg-red-50 w-full"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => { onNavigate({ page: 'auth' }); setMenuOpen(false); }}
              className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
}
