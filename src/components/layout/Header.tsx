import { useState } from 'react';
import { MapPin, Menu, X, LogOut, LayoutDashboard, Shield, BookOpen, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import type { NavState } from '../../lib/types';

interface HeaderProps {
  nav: NavState;
  onNavigate: (state: NavState) => void;
}

const isEmoji = (str: string) => !!str && str.length <= 4;

export default function Header({ nav, onNavigate }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { pendingBookings, pendingBusinesses, total } = useNotifications();
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
    if (profile?.role === 'super_admin') return { icon: <Shield size={15} className="text-blue-600" />, text: 'Super Admin', count: pendingBusinesses };
    if (profile?.role === 'admin') return { icon: <LayoutDashboard size={15} className="text-blue-600" />, text: 'Business Console', count: pendingBookings };
    return { icon: <BookOpen size={15} className="text-blue-600" />, text: 'My Bookings', count: 0 };
  };

  const dashLabel = getDashboardLabel();
  const avatar = profile?.avatar_url;
  const useEmojiAvatar = avatar && isEmoji(avatar);
  const initial = profile?.full_name?.charAt(0)?.toUpperCase() || 'U';
  const profileComplete = profile && profile.full_name && profile.phone && profile.phone.length >= 10;

  // Notification Dot component
  const NotifDot = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm z-10">
        {count > 9 ? '9+' : count}
      </span>
    ) : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-md border-b border-[#E6EAF0] w-full">
      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <button onClick={() => onNavigate({ page: 'home' })} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-200">
              <img src="/logo.png" className="w-full h-full object-cover" alt="LocalEase Logo" />
            </div>
            <span className="text-2xl font-black text-[#0F172A] tracking-tighter">Local<span className="text-[#3A6FF8]">Ease</span></span>
          </button>


          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate({ page: 'browse' })}
              className={`text-sm font-semibold transition-colors ${nav.page === 'browse' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Browse
            </button>

            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {/* Avatar with notification dot */}
                  <div className="relative">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base ${
                      useEmojiAvatar ? 'bg-blue-50 border-2 border-blue-100 text-xl' : 'bg-blue-600 text-white text-sm'
                    }`}>
                      {useEmojiAvatar ? avatar : initial}
                    </div>
                    {/* Red dot: profile incomplete OR has notifications */}
                    {(!profileComplete || total > 0) && (
                      <NotifDot count={profileComplete ? total : 1} />
                    )}
                  </div>
                  <span className="max-w-[100px] truncate">{profile.full_name?.split(' ')[0] || 'Account'}</span>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">

                      {/* Profile header */}
                      <div className="px-4 py-3 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                            useEmojiAvatar ? 'bg-blue-50' : 'bg-blue-600 text-white font-bold text-sm'
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
                          <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 font-semibold border border-amber-200">
                            ⚠️ Profile incomplete — add phone number
                          </div>
                        )}
                      </div>

                      {/* Edit Profile */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onNavigate({ page: 'profile' });
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors font-semibold relative z-[60]"
                      >
                        <UserCircle size={15} className="text-blue-600" />
                        Edit Profile
                      </button>

                      {/* Dashboard link with notification badge */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onNavigate({ page: getDashboardPage() });
                          setDropdownOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-800 hover:bg-blue-50 transition-colors font-semibold relative z-[60]"
                      >
                        <span className="flex items-center gap-2.5">
                          {dashLabel.icon}
                          {dashLabel.text}
                        </span>
                        {dashLabel.count > 0 && (
                          <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                            {dashLabel.count > 9 ? '9+' : dashLabel.count}
                          </span>
                        )}
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
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-gray-600 relative" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
            {total > 0 && !menuOpen && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
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
                className="flex items-center justify-between text-sm font-semibold text-gray-700 py-2.5 px-3 rounded-xl hover:bg-blue-50 w-full"
              >
                <span className="flex items-center gap-2">{dashLabel.icon} {dashLabel.text}</span>
                {dashLabel.count > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {dashLabel.count}
                  </span>
                )}
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
