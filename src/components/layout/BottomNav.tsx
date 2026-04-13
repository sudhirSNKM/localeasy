import { Home, Calendar, User, BarChart2, ShieldCheck, PieChart } from 'lucide-react';
import type { NavState } from '../../lib/types';

interface BottomNavProps {
  activePage: string;
  onNavigate: (state: NavState) => void;
}

export default function BottomNav({ activePage, onNavigate }: BottomNavProps) {
  // Determine if we are in an admin/mgmt context
  const isAdmin = activePage === 'admin-dashboard';
  const isSuper = activePage === 'super-admin';

  let tabs = [
    { id: 'home', label: 'Home', icon: <Home size={19} />, page: 'home' },
    { id: 'user-bookings', label: 'Bookings', icon: <Calendar size={19} />, page: 'user-bookings' },
    { id: 'profile', label: 'Profile', icon: <User size={19} />, page: 'profile' },
  ];

  if (isAdmin) {
    tabs = [
      { id: 'home', label: 'Store', icon: <Home size={19} />, page: 'home' },
      { id: 'admin-dashboard', label: 'Console', icon: <PieChart size={19} />, page: 'admin-dashboard' },
      { id: 'admin-analysis', label: 'Analysis', icon: <BarChart2 size={19} />, page: 'admin-analysis' },
    ];
  } else if (isSuper) {
    tabs = [
      { id: 'home', label: 'Home', icon: <Home size={19} />, page: 'home' },
      { id: 'super-admin', label: 'Control', icon: <ShieldCheck size={19} />, page: 'super-admin' },
      { id: 'admin-analysis', label: 'Analysis', icon: <BarChart2 size={19} />, page: 'admin-analysis' },
    ];
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[92%] max-w-[500px]">
      <div className={`pointer-events-auto w-full bg-white/95 backdrop-blur-lg border shadow-xl px-2 py-2.5 rounded-2xl flex justify-around items-center transition-all duration-500 ${
        (isAdmin || isSuper) ? 'border-[#3A6FF8]/30' : 'border-[#E6EAF0]'
      }`}>
        {tabs.map((tab) => {
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate({ page: tab.page as any })}
              className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 flex-1 ${
                isActive ? 'text-[#3A6FF8]' : 'text-[#9AA4B2]'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#3A6FF8] rounded-full border-2 border-white" />
                )}
              </div>
              <span className={`text-[9px] whitespace-nowrap font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
