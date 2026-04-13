import { useEffect, useState } from 'react';
import { Calendar, Clock, ChevronRight, History, Star, ArrowRight } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { NavState } from '../lib/types';
import Badge from '../components/ui/Badge';

interface UserBookingsProps {
  onNavigate: (state: NavState) => void;
}

export default function UserBookings({ onNavigate }: UserBookingsProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = () => {
    const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecentlyViewed(recent);
  };

  useEffect(() => {
    if (!user) return;

    loadHistory();
    // Refresh history when page gets focus (user comes back from another tab)
    window.addEventListener('focus', loadHistory);

    const q = query(
      collection(db, 'bookings'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsub();
      window.removeEventListener('focus', loadHistory);
    };
  }, [user]);

  return (
    <div className="min-h-screen pt-28 pb-12">
      <div className="w-full">
        
        <header className="mb-10">
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Your Activity</h1>
          <p className="text-lg text-[#6B7280] font-medium">Manage your bookings and viewing history</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Main Bookings List */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#3A6FF8]/5 text-[#3A6FF8] rounded-xl flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <h2 className="text-xl font-bold text-[#0F172A]">Current Appointments</h2>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-24 card-soft animate-pulse" />)}
                </div>
              ) : bookings.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-[#E6EAF0]">
                   <p className="text-[#9AA4B2] font-bold text-sm">No bookings found yet.</p>
                   <button onClick={() => onNavigate({ page: 'browse' })} className="text-[#3A6FF8] font-bold text-xs uppercase mt-4 hover:underline">Book Your First Service</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map(b => (
                    <div key={b.id} className="card-soft p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 bg-[#F2F4F7] rounded-2xl flex items-center justify-center text-2xl shrink-0">
                          🏢
                        </div>
                        <div>
                          <h3 className="font-bold text-[#0F172A]">{b.business_name}</h3>
                          <p className="text-sm font-bold text-[#3A6FF8]">{b.service_name}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs font-bold text-[#9AA4B2] uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {b.date}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {b.time || b.time_slot}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={b.status === 'confirmed' || b.status === 'completed' ? 'success' : b.status === 'cancelled' ? 'error' : 'warning'}>
                          {b.status}
                        </Badge>
                        <ChevronRight className="text-[#E6EAF0]" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Recently Viewed Sidebar */}
          <div className="space-y-6">
            <section className="bg-white rounded-3xl p-8 border border-[#E6EAF0] shadow-sm sticky top-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <History size={20} />
                </div>
                <h2 className="text-lg font-bold text-[#0F172A]">Recently Viewed</h2>
              </div>

              {recentlyViewed.length === 0 ? (
                <p className="text-[#9AA4B2] text-sm text-center py-6">Businesses you visit will appear here.</p>
              ) : (
                <div className="space-y-6">
                  {recentlyViewed.map(biz => (
                    <div 
                      key={biz.id} 
                      onClick={() => onNavigate({ page: 'business-detail', businessId: biz.id })}
                      className="flex items-center gap-4 cursor-pointer group"
                    >
                      <img src={biz.logo_url} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#E6EAF0]" alt="" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-[#0F172A] truncate group-hover:text-[#3A6FF8] transition-colors">{biz.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#9AA4B2] uppercase mt-0.5">
                           <Star size={10} className="text-[#F59E0B] fill-current" /> {biz.rating} • {biz.city}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-[#E6EAF0] group-hover:text-[#3A6FF8] transition-transform -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
