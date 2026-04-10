import { useState } from 'react';
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
  const [nav, setNav] = useState<NavState>({ page: 'home' });

  const handleNavigate = (state: NavState) => {
    setNav(state);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      <main>{renderPage()}</main>
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
