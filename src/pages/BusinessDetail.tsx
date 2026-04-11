import { useState, useEffect } from 'react';
import { MapPin, Phone, MessageSquare, Star, Clock, Info, ShieldCheck, Heart, Share2, ArrowLeft, ChevronRight, Calendar, IndianRupee } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dataService } from '../lib/dataService';
import type { BusinessWithCategory, Service, Promotion, NavState } from '../lib/types';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

interface BusinessDetailProps {
  businessId: string;
  onNavigate: (state: NavState) => void;
}

export default function BusinessDetail({ businessId, onNavigate }: BusinessDetailProps) {
  const [business, setBusiness] = useState<BusinessWithCategory | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'promotions' | 'info'>('services');

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const biz = await dataService.getBusinessById(businessId);
        setBusiness(biz);
      } catch (err) {
        console.error('Error loading business:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBusiness();

    const unsubSvcs = onSnapshot(query(collection(db, 'services'), where('business_id', '==', businessId)), (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });
    const unsubPromos = onSnapshot(query(collection(db, 'promotions'), where('business_id', '==', businessId)), (snap) => {
      setPromotions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion)));
    });

    return () => { unsubSvcs(); unsubPromos(); };
  }, [businessId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Business Not Found</h2>
        <Button onClick={() => onNavigate({ page: 'home' })}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Hero Section */}
      <div className="relative h-64 md:h-96 bg-neutral-200">
        <img 
          src={business.cover_url} 
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <button 
          onClick={() => onNavigate({ page: 'home' })}
          className="absolute top-24 left-4 md:left-8 bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-card p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="flex gap-4 md:gap-6">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0 bg-white -mt-12 md:-mt-16">
                    <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">{business.name}</h1>
                      <ShieldCheck size={20} className="text-primary-600" />
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <div className="flex items-center gap-1 text-secondary-600">
                        <Star size={16} fill="currentColor" />
                        <span>{business.rating}</span>
                        <span className="text-neutral-400">({business.review_count})</span>
                      </div>
                      <span className="text-neutral-300">•</span>
                      <div className="flex items-center gap-1 text-neutral-500">
                        <MapPin size={16} />
                        <span>{business.city}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-all">
                    <Heart size={18} />
                    Favorite
                  </button>
                  <button className="p-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-neutral-100 rounded-2xl mb-8">
                {(['services', 'promotions', 'info'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold capitalize transition-all ${
                      activeTab === tab ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {tab}
                    {tab === 'services' && services.length > 0 && <span className="ml-1.5 opacity-50 text-xs">({services.length})</span>}
                  </button>
                ))}
              </div>

              {activeTab === 'services' && (
                <div className="space-y-4">
                  {services.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400">No services listed yet.</div>
                  ) : (
                    services.map(svc => (
                      <div key={svc.id} className="group p-5 rounded-2xl border border-neutral-100 bg-neutral-50/30 hover:bg-white hover:border-primary-100 hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">{svc.name}</h3>
                          <p className="text-sm text-neutral-500 line-clamp-2">{svc.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><Clock size={14} /> {svc.duration} mins</span>
                            <span className="flex items-center gap-1.5 text-primary-600"><IndianRupee size={14} /> ₹{svc.price}</span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => onNavigate({ page: 'booking', businessId, serviceId: svc.id })}
                          className="sm:w-auto"
                        >
                          Book Now
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'promotions' && (
                <div className="space-y-4">
                  {promotions.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400">No active promotions.</div>
                  ) : (
                    promotions.map(promo => (
                      <div key={promo.id} className="p-6 rounded-3xl bg-gradient-to-br from-accent-50 to-white border border-accent-100">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="accent">{promo.discount_pct}% OFF</Badge>
                          <div className="text-xs font-bold text-accent-600 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={14} /> Limited Time
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 mb-2">{promo.title}</h3>
                        <p className="text-neutral-600 text-sm mb-6">{promo.description}</p>
                        <Button variant="accent" fullWidth onClick={() => window.open(`https://wa.me/${business.whatsapp}?text=Hi, I want to claim the ${promo.title} offer!`, '_blank')}>
                          Claim via WhatsApp
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'info' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">About the Business</h3>
                    <p className="text-neutral-600 leading-relaxed">{business.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100">
                      <h4 className="flex items-center gap-2 font-bold text-neutral-900 mb-3 text-sm uppercase tracking-wider">
                        <MapPin size={16} className="text-primary-600" /> Location
                      </h4>
                      <p className="text-neutral-600 text-sm">{business.address}, {business.city}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100">
                      <h4 className="flex items-center gap-2 font-bold text-neutral-900 mb-3 text-sm uppercase tracking-wider">
                        <Clock size={16} className="text-primary-600" /> Business Hours
                      </h4>
                      <p className="text-neutral-600 text-sm">Mon - Sat: 9:00 AM - 8:00 PM<br />Sun: Closed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-card p-6 border border-neutral-100 sticky top-24">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">Contact & Support</h3>
              <div className="space-y-4">
                <Button fullWidth onClick={() => window.open(`https://wa.me/${business.whatsapp}`, '_blank')} className="gap-2 bg-success-600 hover:bg-success-700">
                   <MessageSquare size={18} /> Chat on WhatsApp
                </Button>
                <a href={`tel:${business.phone}`} className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-all">
                  <Phone size={18} /> Call Us
                </a>
              </div>
              <div className="mt-8 pt-8 border-t border-neutral-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                    <Info size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">Verified Partner</h4>
                    <p className="text-neutral-500 text-xs">Trusted provider since 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
