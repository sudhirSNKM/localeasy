import { useEffect, useState } from 'react';
import { Search, ArrowRight, Star, CheckCircle, Scissors, Sparkles, Smile, Dumbbell, Utensils, Car, Home as HomeIcon, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BusinessWithCategory, Category, Promotion, NavState } from '../lib/types';
import BusinessCard from '../components/business/BusinessCard';
import Badge from '../components/ui/Badge';

interface HomeProps {
  onNavigate: (state: NavState) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  scissors: <Scissors size={22} />,
  sparkles: <Sparkles size={22} />,
  smile: <Smile size={22} />,
  dumbbell: <Dumbbell size={22} />,
  utensils: <Utensils size={22} />,
  car: <Car size={22} />,
  home: <HomeIcon size={22} />,
  camera: <Camera size={22} />,
};

export default function Home({ onNavigate }: HomeProps) {
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<BusinessWithCategory[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [cats, bizs, promos] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('businesses').select('*, categories(*)').eq('status', 'approved').order('rating', { ascending: false }).limit(8),
        supabase.from('promotions').select('*, businesses(name, city)').eq('status', 'active').limit(4),
      ]);
      setCategories(cats.data || []);
      setBusinesses((bizs.data as BusinessWithCategory[]) || []);
      setPromotions(promos.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate({ page: 'browse' });
  };

  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-400 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 md:pt-36 md:pb-28">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4">Trusted by 10,000+ locals</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Discover the Best<br />
              <span className="text-secondary-300">Local Services</span><br />
              Near You
            </h1>
            <p className="text-primary-100 text-lg mb-8 leading-relaxed">
              Book appointments with top-rated local businesses instantly. Hair, wellness, dental, fitness and more.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search services or businesses..."
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-neutral-900"
                />
              </div>
              <button
                type="submit"
                className="bg-secondary-500 hover:bg-secondary-600 text-white px-5 py-3.5 rounded-xl text-sm font-semibold shadow-lg transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              {[['10K+', 'Happy Customers'], ['500+', 'Local Businesses'], ['4.8', 'Average Rating']].map(([num, label]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-white font-bold text-lg">{num}</span>
                  <span className="text-primary-200 text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Browse Categories</h2>
            <p className="text-neutral-500 text-sm mt-1">Find services by category</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onNavigate({ page: 'browse' })}
              className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-neutral-100 hover:border-primary-200 transition-all duration-200"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110"
                style={{ backgroundColor: cat.color }}
              >
                {iconMap[cat.icon] || <HomeIcon size={22} />}
              </div>
              <span className="text-xs font-medium text-neutral-700 text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-neutral-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Featured Businesses</h2>
              <p className="text-neutral-500 text-sm mt-1">Top-rated services in your area</p>
            </div>
            <button
              onClick={() => onNavigate({ page: 'browse' })}
              className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-card overflow-hidden animate-pulse">
                  <div className="h-48 bg-neutral-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : businesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {businesses.map(b => (
                <BusinessCard key={b.id} business={b} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500">No businesses available yet. Be the first to list yours!</p>
              <button
                onClick={() => onNavigate({ page: 'auth' })}
                className="mt-4 bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                List Your Business
              </button>
            </div>
          )}
        </div>
      </section>

      {promotions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Current Promotions</h2>
              <p className="text-neutral-500 text-sm mt-1">Limited-time deals from local businesses</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {promotions.map(promo => (
              <div key={promo.id} className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl p-5 text-white shadow-card">
                <div className="text-4xl font-bold mb-1">{promo.discount_pct}%</div>
                <div className="text-secondary-100 text-xs mb-3">OFF</div>
                <h4 className="font-semibold text-base mb-1 leading-snug">{promo.title}</h4>
                <p className="text-secondary-100 text-xs line-clamp-2 mb-3">{promo.description}</p>
                <div className="text-xs text-secondary-200">Valid until {new Date(promo.end_date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">Why Choose LocalEase?</h2>
            <p className="text-neutral-500 max-w-lg mx-auto">We connect you with the best local businesses so you can book with confidence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <CheckCircle size={28} className="text-accent-500" />, title: 'Verified Businesses', desc: 'Every business is reviewed and approved before listing.' },
              { icon: <Star size={28} className="text-secondary-500" />, title: 'Honest Reviews', desc: 'Real reviews from real customers in your community.' },
              { icon: <Search size={28} className="text-primary-500" />, title: 'Easy Booking', desc: 'Book appointments online or via WhatsApp in seconds.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="font-semibold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
