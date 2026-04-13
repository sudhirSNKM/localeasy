import { useEffect, useState, useRef } from 'react';
import { Star, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { dataService } from '../lib/dataService';
import type { BusinessWithCategory, Category, Promotion, NavState } from '../lib/types';

interface HomeProps {
  onNavigate: (state: NavState) => void;
}

const iconMap: Record<string, string> = {
  scissors: '💇‍♂️',
  sparkles: '✨',
  smile: '🦷',
  dumbbell: '💪',
  utensils: '🍕',
  car: '🚗',
  home: '🏠',
  camera: '📸',
};

export default function Home({ onNavigate }: HomeProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<BusinessWithCategory[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, biz, promos] = await Promise.all([
          dataService.getCategories(),
          dataService.getFeaturedBusinesses(),
          dataService.getPromotions(),
        ]);
        setCategories(cats);
        setBusinesses(biz.slice(0, 4));
        setPromotions(promos.slice(0, 3));
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (loading || (businesses.length === 0 && promotions.length === 0)) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        if (scrollLeft >= maxScroll - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [loading, businesses, promotions]);

  return (
    <div className="pt-24 pb-20 md:pt-28">
      
      {/* 1. Header (Dynamic Grid Feel) */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-3 tracking-tighter">Discover. Book. <span className="text-[#3A6FF8]">Done.</span></h1>
        <p className="text-lg text-[#6B7280] font-medium">Find the best local services near you</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. Categories Grid */}
          <section>
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg text-[#0F172A] tracking-tight">Browse Categories</h3>
               <button onClick={() => onNavigate({ page: 'browse' })} className="text-xs font-bold text-[#3A6FF8] uppercase">View All</button>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {categories.length > 0 ? categories.map((cat) => (
                <button 
                  key={cat.id} 
                  onClick={() => onNavigate({ page: 'browse' })}
                  className="flex flex-col items-center justify-center text-center group transition-all"
                >
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-[#E6EAF0] shrink-0 group-hover:scale-110 group-hover:shadow-md transition-all"
                    style={{ backgroundColor: `${cat.color}15` }}
                  >
                    {iconMap[cat.icon] || '🎯'}
                  </div>
                  <span className="text-[8px] font-black mt-2 text-[#6B7280] uppercase tracking-tighter truncate w-full group-hover:text-[#0F172A] transition-colors">{cat.name}</span>
                </button>
              )) : (
                [1,2,3,4,5].map(i => <div key={i} className="h-16 card-soft animate-pulse" />)
              )}
            </div>
          </section>

          {/* 3. Horizontal Trending & Offers Loop */}
          <section className="space-y-4">
             <div className="flex justify-between items-end pr-4">
               <div>
                 <h3 className="font-bold text-lg text-[#0F172A] tracking-tight">Trending & Exclusive Offers</h3>
                 <p className="text-[10px] text-[#9AA4B2] font-bold uppercase tracking-widest mt-0.5">Handpicked for you today</p>
               </div>
               <span className="flex items-center gap-1.5 text-[10px] font-black text-[#0EA5E9] uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full animate-pulse border border-sky-100">
                 <div className="w-1.5 h-1.5 bg-[#0EA5E9] rounded-full" /> LIVE DEALS
               </span>
             </div>

            <div 
              ref={scrollRef}
              className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4 hide-scrollbar -mx-4 px-4 scroll-smooth"
            >
              {/* Combine trending businesses first, then offers */}
              {[
                ...businesses.slice(0, 3).map(b => ({ ...b, type: 'trending' })),
                ...promotions.slice(0, 3).map(p => ({ ...p, type: 'offer' }))
              ].map((item: any, idx) => {
                const isPromo = item.type === 'offer';
                return (
                  <div 
                    key={item.id}
                    onClick={() => onNavigate({ 
                      page: isPromo ? 'booking' : 'business-detail', 
                      businessId: isPromo ? item.business_id : item.id, 
                      serviceId: 'default' 
                    })}
                    className="min-w-[85%] md:min-w-[450px] snap-center relative overflow-hidden cursor-pointer group rounded-3xl"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-105 ${
                      isPromo 
                        ? 'from-[#3A6FF8] to-[#1E40AF]' 
                        : (idx % 2 === 0 ? 'from-[#0EA5E9] to-[#38BDF8]' : 'from-[#7C3AED] to-[#A855F7]')
                    }`} />
                    
                    {/* Decorative glass elements */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

                    <div className="relative p-6 text-white min-h-[160px] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                           <div className="flex items-center gap-2">
                             {isPromo ? <Sparkles size={12} className="text-yellow-300 fill-current" /> : <Star size={12} className="text-white/70 fill-current" />}
                             <span className={`text-[10px] font-black uppercase tracking-widest ${isPromo ? 'text-yellow-400' : 'text-white'}`}>
                               {isPromo ? `${item.discount_pct}% OFF DEAL` : 'POPULAR RECENTLY'}
                             </span>
                           </div>
                           <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all">
                              <ArrowRight size={16} className="text-white" />
                           </div>
                        </div>
                        <h2 className="text-2xl font-black leading-tight truncate text-white">{isPromo ? item.title : item.name}</h2>
                        <p className="text-xs text-white/90 font-medium line-clamp-1 mt-1 capitalize">
                          {isPromo ? item.description : `${item.city} • Rating ⭐ ${item.rating || 'New'}`}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <div className="px-4 py-1.5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full font-black text-[10px] uppercase tracking-wider">
                           Explore Offer
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. Recommended Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#0F172A] tracking-tight">Recommended Services</h3>
              <button onClick={() => onNavigate({ page: 'browse' })} className="text-xs font-bold text-[#3A6FF8] uppercase">Explore More</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                [1,2,3,4].map(i => <div key={i} className="h-28 card-soft animate-pulse" />)
              ) : businesses.map((biz) => (
                <div 
                  key={biz.id} 
                  onClick={() => onNavigate({ page: 'business-detail', businessId: biz.id })}
                  className="card-soft p-5 flex items-center gap-5 cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-[#E6EAF0] flex items-center justify-center bg-white">
                    <img 
                      src={biz.logo_url || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=100&h=100&fit=crop'} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                      alt="" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm text-[#0F172A] truncate leading-tight">{biz.name}</h4>
                      {biz.rating > 0 && (
                        <div className="flex items-center text-[10px] font-black text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded-lg">
                          <Star size={8} className="fill-current mr-0.5" />
                          {biz.rating}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-[#9AA4B2] flex items-center gap-1 mt-1.5 font-bold uppercase tracking-wider">
                      {(categories.find(c => c.id === biz.category_id))?.name || 'Local Service'} • <MapPin size={10} /> {biz.city}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN (Sidebar) */}
        <div className="hidden lg:block relative h-full">
          <div className="sticky top-6 space-y-6 h-fit">

            
            {promotions.map((promo) => (
              <div key={promo.id} className="gradient-card">
                <span className="pill bg-white/20">HOT OFFER</span>
                <h2 className="text-xl font-bold mt-3 leading-tight">{promo.title}</h2>
                <p className="text-sm opacity-80 mt-2 mb-6 line-clamp-3">{promo.description}</p>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center mb-6">
                   <div className="text-3xl font-black">{promo.discount_pct}% OFF</div>
                   <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Book Today & Save</div>
                </div>
                <button 
                  onClick={() => onNavigate({ page: 'business-detail', businessId: promo.business_id })}
                  className="btn-white w-full flex items-center justify-center gap-2"
                >
                  View Special Offer <ArrowRight size={16} />
                </button>
              </div>
            ))}

            <div className="bg-white rounded-[24px] p-8 border border-[#E6EAF0] shadow-sm text-center h-fit">
            <div className="w-16 h-16 bg-[#3A6FF8]/5 text-[#3A6FF8] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Star size={30} />
            </div>
            <h3 className="text-xl font-black text-[#0F172A] mb-3 tracking-tight">Grow Your Business</h3>
            <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">
              Join 500+ local businesses and start reaching thousands of customers today.
            </p>
            <button 
              onClick={() => onNavigate({ page: 'admin-dashboard' })}
              className="w-full py-4 bg-[#3A6FF8] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Get Started Now
            </button>
          </div>

          </div>
        </div>

      </div>


    </div>
  );
}
