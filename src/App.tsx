import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import type { NavState } from './lib/types';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Browse from './pages/Browse';
import BusinessDetail from './pages/BusinessDetail';
import Booking from './pages/Booking';
import Auth from './pages/Auth';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdmin from './pages/SuperAdmin';

function AppContent() {
  const [nav, setNav] = useState<NavState>(() => {
    // Basic URL parsing for initial load
    const path = window.location.pathname.split('/').filter(Boolean);
    if (path[0] === 'browse') return { page: 'browse' };
    if (path[0] === 'auth') return { page: 'auth' };
    if (path[0] === 'super-admin') return { page: 'super-admin' };
    if (path[0] === 'admin-dashboard') return { page: 'admin-dashboard' };
    if (path[0] === 'dashboard') return { page: 'user-dashboard' };
    if (path[0] === 'business' && path[1]) return { page: 'business-detail', businessId: path[1] };
    if (path[0] === 'book' && path[1] && path[2]) return { page: 'booking', businessId: path[1], serviceId: path[2] };
    return { page: 'home' };
  });

  const handleNavigate = (state: NavState, push = true) => {
    setNav(state);
    
    // Update URL
    if (push) {
      let url = '/';
      if (state.page === 'browse') url = '/browse';
      if (state.page === 'auth') url = '/auth';
      if (state.page === 'super-admin') url = '/super-admin';
      if (state.page === 'admin-dashboard') url = '/admin-dashboard';
      if (state.page === 'user-dashboard') url = '/dashboard';
      if (state.page === 'business-detail') url = `/business/${state.businessId}`;
      if (state.page === 'booking') url = `/book/${state.businessId}/${state.serviceId}`;
      window.history.pushState(state, '', url);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state) handleNavigate(e.state, false);
      else handleNavigate({ page: 'home' }, false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderPage = () => {
    switch (nav.page) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'browse':
        return <Browse onNavigate={handleNavigate} />;
      case 'business-detail':
        return nav.businessId
          ? <BusinessDetail businessId={nav.businessId} onNavigate={handleNavigate} />
          : <Home onNavigate={handleNavigate} />;
      case 'booking':
        return nav.businessId && nav.serviceId
          ? <Booking businessId={nav.businessId} serviceId={nav.serviceId} onNavigate={handleNavigate} />
          : <Browse onNavigate={handleNavigate} />;
      case 'auth':
        return <Auth onNavigate={handleNavigate} />;
      case 'user-dashboard':
        return <UserDashboard onNavigate={handleNavigate} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'super-admin':
        return <SuperAdmin onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  const showHeader = nav.page !== 'auth';
  const showFooter = nav.page !== 'auth' && nav.page !== 'booking';

  return (
    <div className="min-h-screen font-sans">
      {showHeader && <Header nav={nav} onNavigate={handleNavigate} />}
      <main className="transition-all duration-300">{renderPage()}</main>
      {showFooter && <Footer onNavigate={handleNavigate} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
