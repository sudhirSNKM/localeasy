import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BookingWithDetails, NavState } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

interface UserDashboardProps {
  onNavigate: (state: NavState) => void;
}

const statusConfig = {
  pending: { variant: 'warning' as const, icon: <AlertCircle size={14} />, label: 'Pending' },
  confirmed: { variant: 'info' as const, icon: <CheckCircle size={14} />, label: 'Confirmed' },
  completed: { variant: 'success' as const, icon: <CheckCircle size={14} />, label: 'Completed' },
  cancelled: { variant: 'error' as const, icon: <XCircle size={14} />, label: 'Cancelled' },
};

export default function UserDashboard({ onNavigate }: UserDashboardProps) {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!user) { onNavigate({ page: 'auth' }); return; }
    supabase
      .from('bookings')
      .select('*, businesses(name, address, city, whatsapp), services(name, price, duration)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setBookings((data as BookingWithDetails[]) || []);
        setLoading(false);
      });
  }, [user]);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(b => b.date >= today && b.status !== 'cancelled' && b.status !== 'completed');
  const past = bookings.filter(b => b.date < today || b.status === 'completed' || b.status === 'cancelled');
  const displayed = activeTab === 'upcoming' ? upcoming : past;

  const cancelBooking = async (id: string) => {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  };

  const handleWhatsApp = (booking: BookingWithDetails) => {
    if (!booking.businesses.whatsapp) return;
    const msg = encodeURIComponent(
      `Hi! I have a booking for "${booking.services.name}" on ${booking.date} at ${booking.time_slot}.`
    );
    window.open(`https://wa.me/${booking.businesses.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">My Dashboard</h1>
          <p className="text-neutral-500 mt-1">Welcome back, {profile?.full_name || 'there'}!</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: bookings.length, color: 'text-primary-600' },
            { label: 'Upcoming', value: upcoming.length, color: 'text-secondary-600' },
            { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: 'text-accent-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl shadow-card p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-neutral-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-0.5 bg-neutral-100 rounded-xl p-1 mb-6 w-fit">
          {(['upcoming', 'past'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-card p-5 animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={22} className="text-neutral-400" />
            </div>
            <h3 className="font-semibold text-neutral-800 mb-2">No {activeTab} bookings</h3>
            <p className="text-neutral-500 text-sm mb-4">
              {activeTab === 'upcoming' ? 'Browse local businesses and book your first appointment.' : 'Your past bookings will appear here.'}
            </p>
            {activeTab === 'upcoming' && (
              <Button onClick={() => onNavigate({ page: 'browse' })}>Browse Businesses</Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(booking => {
              const sc = statusConfig[booking.status];
              return (
                <div key={booking.id} className="bg-white rounded-xl shadow-card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={sc.variant}>
                          <span className="flex items-center gap-1">{sc.icon}{sc.label}</span>
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-neutral-900 mb-0.5">{booking.services.name}</h3>
                      <p className="text-primary-600 text-sm font-medium mb-2">{booking.businesses.name}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1"><Calendar size={12} />{new Date(booking.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{booking.time_slot} · {booking.services.duration} min</span>
                        <span className="flex items-center gap-1"><MapPin size={12} />{booking.businesses.city}</span>
                      </div>
                      {booking.notes && <p className="text-neutral-500 text-xs mt-2 italic">"{booking.notes}"</p>}
                    </div>
                    <div className="flex flex-col gap-2 items-start sm:items-end">
                      <span className="text-lg font-bold text-neutral-900">${booking.services.price.toFixed(2)}</span>
                      <div className="flex gap-2">
                        {booking.businesses.whatsapp && (
                          <button
                            onClick={() => handleWhatsApp(booking)}
                            className="flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 font-medium"
                          >
                            <MessageCircle size={12} /> WhatsApp
                          </button>
                        )}
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="text-xs text-error-500 hover:text-error-700 font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
