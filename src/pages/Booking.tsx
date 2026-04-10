import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Business, Service, NavState } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface BookingProps {
  businessId: string;
  serviceId: string;
  onNavigate: (state: NavState) => void;
}

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

export default function Booking({ businessId, serviceId, onNavigate }: BookingProps) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { onNavigate({ page: 'auth' }); return; }
    Promise.all([
      supabase.from('businesses').select('*').eq('id', businessId).maybeSingle(),
      supabase.from('services').select('*').eq('id', serviceId).maybeSingle(),
    ]).then(([biz, svc]) => {
      setBusiness(biz.data);
      setService(svc.data);
    });
  }, [businessId, serviceId, user]);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !timeSlot) { setError('Please select a date and time slot.'); return; }
    if (!user || !business || !service) return;

    setLoading(true);
    setError('');

    const { error: err } = await supabase.from('bookings').insert({
      user_id: user.id,
      business_id: businessId,
      service_id: serviceId,
      date,
      time_slot: timeSlot,
      notes,
      status: 'pending',
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
  };

  const handleWhatsApp = () => {
    if (!business?.whatsapp) return;
    const msg = encodeURIComponent(
      `Hi! I'd like to book "${service?.name}" at ${business.name} on ${date} at ${timeSlot}.${notes ? `\nNotes: ${notes}` : ''}`
    );
    window.open(`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-20 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-accent-500" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Booking Confirmed!</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Your booking for <strong>{service?.name}</strong> at <strong>{business?.name}</strong> on {new Date(date).toLocaleDateString()} at {timeSlot} has been submitted.
          </p>
          <p className="text-neutral-400 text-xs mb-6">The business will confirm your appointment shortly.</p>
          <div className="flex flex-col gap-3">
            {business?.whatsapp && (
              <Button onClick={handleWhatsApp} variant="success" fullWidth>
                <MessageCircle size={16} />
                Confirm via WhatsApp
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
    <div className="min-h-screen bg-neutral-50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => onNavigate({ page: 'business-detail', businessId })}
          className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 mb-6 mt-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Business
        </button>

        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Book Appointment</h1>

        {service && business && (
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-primary-600 font-medium mb-1">{business.name}</div>
              <div className="font-semibold text-neutral-900">{service.name}</div>
              <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                <span className="flex items-center gap-1"><Clock size={13} />{service.duration} min</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-600">${service.price.toFixed(2)}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Calendar size={14} className="inline mr-1.5" />
              Select Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={minDateStr}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              <Clock size={14} className="inline mr-1.5" />
              Select Time Slot
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlot(slot)}
                  className={`py-2 text-sm rounded-lg border transition-all font-medium ${
                    timeSlot === slot
                      ? 'border-primary-500 bg-primary-600 text-white'
                      : 'border-neutral-200 text-neutral-700 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special requests or information..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {error && <p className="text-error-500 text-sm bg-error-50 px-4 py-2.5 rounded-lg">{error}</p>}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Confirm Booking
          </Button>

          {business?.whatsapp && (
            <Button type="button" onClick={handleWhatsApp} variant="success" fullWidth>
              <MessageCircle size={16} />
              Book via WhatsApp Instead
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
