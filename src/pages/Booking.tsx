import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, CheckCircle, MessageCircle, IndianRupee, Phone, UserCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import type { Business, Service, NavState } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

interface BookingProps {
  businessId: string;
  serviceId: string;
  onNavigate: (state: NavState) => void;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

export default function Booking({ businessId, serviceId, onNavigate }: BookingProps) {
  const { user, profile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Profile must be complete (name + phone) to book
  const profileComplete = profile && profile.full_name && profile.phone && profile.phone.length >= 10;

  useEffect(() => {
    if (!user) { onNavigate({ page: 'auth' }); return; }

    const loadData = async () => {
      try {
        const [bizSnap, svcSnap] = await Promise.all([
          getDoc(doc(db, 'businesses', businessId)),
          getDoc(doc(db, 'services', serviceId))
        ]);
        if (bizSnap.exists()) setBusiness({ id: bizSnap.id, ...bizSnap.data() } as Business);
        if (svcSnap.exists()) setService({ id: svcSnap.id, ...svcSnap.data() } as Service);
      } catch (err) {
        console.error('Error loading booking data:', err);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [businessId, serviceId, user]);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !timeSlot) { setError('Please select a date and time slot.'); return; }
    if (!user || !business || !service) return;
    if (!profileComplete) { setError('Please complete your profile before booking.'); return; }

    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'bookings'), {
        user_id: user.uid,
        user_name: profile?.full_name || user.email?.split('@')[0] || 'Customer',
        user_email: user.email || '',
        user_phone: profile?.phone || '',
        user_avatar: profile?.avatar_url || '😊',
        business_id: businessId,
        service_id: serviceId,
        service_name: service.name,
        business_name: business.name,
        business_whatsapp: business.whatsapp || '',
        price: service.price,
        date,
        time: timeSlot,
        time_slot: timeSlot,
        notes,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('Firestore Booking Error:', err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!business?.whatsapp) return;
    const msg = encodeURIComponent(
      `Hi! I'd like to book "${service?.name}" at ${business.name} on ${date} at ${timeSlot}.${notes ? `\nNotes: ${notes}` : ''}`
    );
    window.open(`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  // Gate: require profile completion before booking
  if (!profileComplete) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile First</h2>
          <p className="text-gray-500 text-sm mb-6">
            We need your name and phone number to confirm bookings and let businesses contact you.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => onNavigate({ page: 'profile' })} fullWidth size="lg">
              <UserCircle size={16} /> Complete My Profile
            </Button>
            <Button onClick={() => onNavigate({ page: 'business-detail', businessId })} variant="ghost" fullWidth>
              <ArrowLeft size={16} /> Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed! 🎉</h2>
          <p className="text-gray-500 text-sm mb-2">
            <strong>{service?.name}</strong> at <strong>{business?.name}</strong>
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {timeSlot}
          </p>
          <div className="flex flex-col gap-3">
            {business?.whatsapp && (
              <Button onClick={handleWhatsApp} variant="success" fullWidth>
                <MessageCircle size={16} /> Confirm via WhatsApp
              </Button>
            )}
            <Button onClick={() => onNavigate({ page: 'user-dashboard' })} variant="outline" fullWidth>
              View My Bookings
            </Button>
            <Button onClick={() => onNavigate({ page: 'home' })} variant="ghost" fullWidth>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => onNavigate({ page: 'business-detail', businessId })}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-6 mt-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Business
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Appointment</h1>

        {/* Customer info strip */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-center gap-3">
          <div className="text-2xl">{profile?.avatar_url || '😊'}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Booking as</div>
            <div className="font-bold text-gray-900 text-sm truncate">{profile?.full_name}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} />{profile?.phone}</div>
          </div>
        </div>

        {service && business && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 flex items-center gap-4 shadow-sm">
            <div className="flex-1">
              <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wider">{business.name}</div>
              <div className="font-bold text-gray-900 text-lg">{service.name}</div>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Clock size={13} />{service.duration} min</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600 flex items-center gap-1">
              <IndianRupee size={20} />{service.price}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar size={14} className="inline mr-1.5" />Select Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={minDateStr}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Clock size={14} className="inline mr-1.5" />Select Time Slot
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlot(slot)}
                  className={`py-2 text-sm rounded-xl border-2 transition-all font-medium ${
                    timeSlot === slot
                      ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special requests or information..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">{error}</p>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Confirm Booking
          </Button>

          {business?.whatsapp && (
            <Button type="button" onClick={handleWhatsApp} variant="success" fullWidth>
              <MessageCircle size={16} /> Book via WhatsApp Instead
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
