import { useState, useEffect } from 'react';
import { MapPin, Phone, MessageSquare, Star, Clock, ShieldCheck, Heart, Share2, ArrowLeft, Calendar } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dataService } from '../lib/dataService';
import type { BusinessWithCategory, Service, Promotion, NavState } from '../lib/types';
import Button from '../components/ui/Button';
// import Badge from '../components/ui/Badge';

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
        
        // Save to Recently Viewed
        if (biz) {
          const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
          const bizSnippet = { 
            id: biz.id, 
            name: biz.name, 
            logo_url: biz.logo_url, 
            rating: biz.rating, 
            city: biz.city 
          };
          const filtered = recent.filter((r: any) => r.id !== biz.id).slice(0, 5);
          localStorage.setItem('recentlyViewed', JSON.stringify([bizSnippet, ...filtered]));
        }
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
    <div className="min-h-screen bg-[#F2F4F7] py-6">
      {/* Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => onNavigate({ page: 'home' })}
          className="flex items-center gap-2 text-sm font-bold text-[#6B7280] hover:text-[#3A6FF8] transition-colors"
        >
          <ArrowLeft size={18} /> Back to Discover
        </button>
        <div className="flex gap-2">
           <button className="w-10 h-10 bg-white rounded-xl border border-[#E6EAF0] flex items-center justify-center text-[#6B7280] hover:text-red-500 transition-colors shadow-sm">
             <Heart size={18} />
           </button>
           <button className="w-10 h-10 bg-white rounded-xl border border-[#E6EAF0] flex items-center justify-center text-[#6B7280] hover:text-[#3A6FF8] transition-colors shadow-sm">
             <Share2 size={18} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Services */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-[24px] border border-[#E6EAF0] shadow-sm overflow-hidden">
            {/* Cover and Profile Header */}
            <div className="relative h-48 md:h-64">
              <img src={business.cover_url} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-white shadow-lg overflow-hidden shrink-0 -mt-16 md:-mt-20 bg-white z-10">
                <img src={business.logo_url} className="w-full h-full object-cover" alt="" />
              </div>
              
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] tracking-tight">{business.name}</h1>
                    <ShieldCheck size={20} className="text-[#3A6FF8]" />
                 </div>
                 <div className="flex items-center gap-4 text-xs font-bold text-[#9AA4B2] uppercase tracking-widest">
                    <div className="flex items-center gap-1 text-[#F59E0B]">
                      <Star size={14} fill="currentColor" /> {business.rating} <span className="opacity-50">({business.review_count})</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1"><MapPin size={14} /> {business.city}</div>
                 </div>
              </div>
            </div>

            {/* In-page Tabs */}
            <div className="flex px-6 md:px-8 border-t border-[#E6EAF0]">
               {(['services', 'promotions', 'info'] as const).map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${
                      activeTab === tab ? 'text-[#3A6FF8]' : 'text-[#6B7280] hover:text-[#0F172A]'
                    }`}
                 >
                   {tab}
                   {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3A6FF8] rounded-full" />}
                 </button>
               ))}
            </div>
          </div>

          <div className="space-y-4">
             {activeTab === 'services' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {services.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-[#9AA4B2] bg-white rounded-3xl border border-dashed border-[#E6EAF0]">No services listed yet.</div>
                 ) : (
                    services.map(svc => (
                      <div key={svc.id} className="bg-white p-6 rounded-3xl border border-[#E6EAF0] shadow-sm hover:border-[#3A6FF8] transition-all group">
                         <h3 className="font-bold text-[#0F172A] mb-2">{svc.name}</h3>
                         <p className="text-xs text-[#6B7280] line-clamp-2 mb-6">{svc.description}</p>
                         <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-[#3A6FF8] bg-[#3A6FF8]/5 px-3 py-1.5 rounded-full">₹{svc.price} • {svc.duration}m</div>
                            <button 
                              onClick={() => onNavigate({ page: 'booking', businessId, serviceId: svc.id })}
                              className="w-10 h-10 bg-[#3A6FF8] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 active:scale-90 transition-all"
                            >
                              <Calendar size={18} />
                            </button>
                         </div>
                      </div>
                    ))
                 )}
               </div>
             )}

             {activeTab === 'promotions' && (
               <div className="space-y-4">
                 {promotions.length === 0 ? (
                    <div className="py-12 text-center text-[#9AA4B2] bg-white rounded-3xl border border-dashed border-[#E6EAF0]">No active promotions.</div>
                 ) : (
                    promotions.map(promo => (
                      <div key={promo.id} className="gradient-card">
                         <div className="flex justify-between items-start mb-4">
                            <span className="pill bg-white/20">{promo.discount_pct}% OFF DEAL</span>
                            <Clock size={16} />
                         </div>
                         <h3 className="text-xl font-bold text-white mb-2">{promo.title}</h3>
                         <p className="text-white/80 text-sm mb-6">{promo.description}</p>
                         <button 
                            onClick={() => window.open(`https://wa.me/${business.whatsapp}`, '_blank')}
                            className="btn-white w-full"
                         >
                            Claim on WhatsApp
                         </button>
                      </div>
                    ))
                 )}
               </div>
             )}

             {activeTab === 'info' && (
               <div className="bg-white p-8 rounded-3xl border border-[#E6EAF0] shadow-sm space-y-8">
                  <div>
                    <h3 className="font-bold text-[#0F172A] mb-4 text-lg">About</h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{business.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#E6EAF0]">
                    <div>
                      <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-[#3A6FF8] mb-3">📍 Location</h4>
                      <p className="text-sm text-[#6B7280]">{business.address}, {business.city}</p>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-[#3A6FF8] mb-3">🕒 Hours</h4>
                      <p className="text-sm text-[#6B7280]">Mon - Sat: 9:00 AM - 8:00 PM</p>
                    </div>
                  </div>
               </div>
             )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-[#E6EAF0] shadow-sm sticky top-10">
            <h3 className="font-bold text-[#0F172A] mb-6 text-lg">Book Service</h3>
            <div className="space-y-4">
               <button onClick={() => window.open(`https://wa.me/${business.whatsapp}`, '_blank')} className="btn-primary w-full shadow-lg shadow-blue-200 flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 border-none">
                  <MessageSquare size={18} /> WhatsApp Contact
               </button>
               <a href={`tel:${business.phone}`} className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-[#E6EAF0] text-sm font-bold text-[#6B7280] hover:bg-[#F2F4F7] transition-all">
                 <Phone size={18} /> Call Business
               </a>
            </div>
            
            <div className="mt-8 pt-8 border-t border-[#E6EAF0] text-center">
               <div className="w-12 h-12 bg-blue-50 text-[#3A6FF8] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={24} />
               </div>
               <h4 className="font-bold text-[#0F172A] text-sm mb-1">Verified Provider</h4>
               <p className="text-[#9AA4B2] text-xs">Trusted partner since 2024</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
