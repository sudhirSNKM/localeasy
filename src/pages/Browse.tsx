import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BusinessWithCategory, Category, NavState } from '../lib/types';
import BusinessCard from '../components/business/BusinessCard';
import Input from '../components/ui/Input';

interface BrowseProps {
  onNavigate: (state: NavState) => void;
}

export default function Browse({ onNavigate }: BrowseProps) {
  const [businesses, setBusinesses] = useState<BusinessWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data || []);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from('businesses')
        .select('*, categories(*)')
        .eq('status', 'approved')
        .order('rating', { ascending: false });

      if (selectedCategory) query = query.eq('category_id', selectedCategory);
      if (search) query = query.ilike('name', `%${search}%`);
      if (cityFilter) query = query.ilike('city', `%${cityFilter}%`);

      const { data } = await query;
      setBusinesses((data as BusinessWithCategory[]) || []);
      setLoading(false);
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, selectedCategory, cityFilter]);

  const hasFilters = search || selectedCategory || cityFilter;

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <div className="bg-white border-b border-neutral-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search businesses..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <input
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              placeholder="City..."
              className="sm:w-36 px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory(''); setCityFilter(''); }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg transition-colors"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('')}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                !selectedCategory ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                  selectedCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-neutral-500">
            {loading ? 'Loading...' : `${businesses.length} business${businesses.length !== 1 ? 'es' : ''} found`}
          </p>
          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
            <SlidersHorizontal size={14} />
            Sorted by rating
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card overflow-hidden animate-pulse">
                <div className="h-48 bg-neutral-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  <div className="h-3 bg-neutral-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : businesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {businesses.map(b => (
              <BusinessCard key={b.id} business={b} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">No businesses found</h3>
            <p className="text-neutral-500 text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
