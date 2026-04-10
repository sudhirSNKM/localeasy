import { useEffect, useState } from 'react';
import { MapPin, Phone, Star, Clock, MessageCircle, ArrowLeft, Tag, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Business, Service, Promotion, Category, NavState } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

interface BusinessDetailProps {
  businessId: string;
  onNavigate: (state: NavState) => void;
}

const COVER_FALLBACK = 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=1200';

export default function BusinessDetail({ businessId, onNavigate }: BusinessDetailProps) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business & { categories: Category | null } | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'promotions' | 'info'>('services');

  useEffect(() => {
    const load = async () => {
      const [biz, svcs, promos] = await Promise.all([
        supabase.from('businesses').select('*, categories(*)').eq('id', businessId).maybeSingle(),
        supabase.from('services').select('*').eq('business_id', businessId).eq('is_active', true),
        supabase.from('promotions').select('*').eq('business_id', businessId).eq('status', 'active'),
      ]);
      setBusiness(biz.data as (Business & { categories: Category | null }) || null);
      setServices(svcs.data || []);
      setPromotions(promos.data || []);
      setLoading(false);
    };
    load();
  }, [businessId]);

  const handleWhatsApp = () => {
    if (!business?.whatsapp) return;
    const msg = encodeURIComponent(`Hi! I'd like to book an appointment at ${business.name}.`);
    window.open(`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  const handleBookService = (service: Service) => {
    if (!user) { onNavigate({ page: 'auth' }); return; }
    setSelectedService(service);
    onNavigate({ page: 'booking', businessId, serviceId: service.id });
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-neutral-50">
        <div className="h-72 bg-neutral-200 animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/3" />
          <div className="h-4 bg-neutral-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="pt-32 text-center">
        <p className="text-neutral-500">Business not found.</p>
        <button onClick={() => onNavigate({ page: 'browse' })} className="mt-4 text-primary-600 hover:underline">
          Back to Browse
        </button>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-neutral-50">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={business.cover_url || COVER_FALLBACK}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={() => onNavigate({ page: 'browse' })}
          className="absolute top-6 left-4 sm:left-8 flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium bg-black/20 hover:bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all"
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-card -mt-10 relative z-10 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {business.categories && <Badge variant="info">{business.categories.name}</Badge>}
                {business.rating > 0 && (
                  <div className="flex items-center gap-1 text-sm font-medium text-neutral-700">
                    <Star size={14} className="text-secondary-500 fill-secondary-500" />
                    {business.rating.toFixed(1)}
                    {business.review_count > 0 && <span className="text-neutral-400 font-normal">({business.review_count})</span>}
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">{business.name}</h1>
              <p className="text-neutral-500 text-sm leading-relaxed mb-4">{business.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                {business.city && (
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary-500" />{business.address}, {business.city}</span>
                )}
                {business.phone && (
                  <span className="flex items-center gap-1.5"><Phone size={14} className="text-primary-500" />{business.phone}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              {business.whatsapp && (
                <Button onClick={handleWhatsApp} variant="success" className="gap-2">
                  <MessageCircle size={16} />
                  Book via WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-0.5 bg-neutral-100 rounded-xl p-1 mb-6 w-fit">
          {(['services', 'promotions', 'info'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab}
              {tab === 'promotions' && promotions.length > 0 && (
                <span className="ml-1.5 bg-secondary-500 text-white text-xs px-1.5 py-0.5 rounded-full">{promotions.length}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'services' && (
          <div className="space-y-3 pb-12">
            {services.length === 0 ? (
              <p className="text-neutral-500 text-sm py-8 text-center">No services listed yet.</p>
            ) : (
              services.map(svc => (
                <div key={svc.id} className="bg-white rounded-xl shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1">{svc.name}</h3>
                    {svc.description && <p className="text-neutral-500 text-sm mb-2">{svc.description}</p>}
                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                      <span className="flex items-center gap-1"><Clock size={13} />{svc.duration} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-neutral-900">${svc.price.toFixed(2)}</span>
                    <Button onClick={() => handleBookService(svc)} size="sm">Book Now</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'promotions' && (
          <div className="space-y-3 pb-12">
            {promotions.length === 0 ? (
              <p className="text-neutral-500 text-sm py-8 text-center">No active promotions.</p>
            ) : (
              promotions.map(promo => (
                <div key={promo.id} className="bg-gradient-to-r from-secondary-50 to-secondary-100 border border-secondary-200 rounded-xl p-5 flex items-start gap-4">
                  <div className="w-14 h-14 bg-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {promo.discount_pct}%
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag size={14} className="text-secondary-600" />
                      <span className="text-xs font-medium text-secondary-600 uppercase tracking-wide">Limited Offer</span>
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">{promo.title}</h3>
                    <p className="text-neutral-600 text-sm mb-2">{promo.description}</p>
                    <p className="text-xs text-neutral-500">Valid: {new Date(promo.start_date).toLocaleDateString()} – {new Date(promo.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="bg-white rounded-xl shadow-card p-6 pb-12 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <MapPin size={16} className="text-primary-500" />, label: 'Address', value: `${business.address}, ${business.city}` },
                { icon: <Phone size={16} className="text-primary-500" />, label: 'Phone', value: business.phone },
                { icon: <MessageCircle size={16} className="text-accent-500" />, label: 'WhatsApp', value: business.whatsapp },
                { icon: <CheckCircle size={16} className="text-accent-500" />, label: 'Status', value: 'Verified & Approved' },
              ].filter(item => item.value).map(item => (
                <div key={item.label} className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
                  <div className="mt-0.5">{item.icon}</div>
                  <div>
                    <div className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-1">{item.label}</div>
                    <div className="text-sm text-neutral-800 font-medium">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
