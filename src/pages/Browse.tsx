import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { BusinessWithCategory, Category, NavState } from '../lib/types';
import BusinessCard from '../components/business/BusinessCard';

interface BrowseProps {
  onNavigate: (state: NavState) => void;
}

export default function Browse({ onNavigate }: BrowseProps) {
  const [allBusinesses, setAllBusinesses] = useState<BusinessWithCategory[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    // Load categories without orderBy to avoid index requirements
    const loadCategories = async () => {
      const snapshot = await getDocs(collection(db, 'categories'));
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      // Client-side sort
      cats.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(cats);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);
      try {
        // Only filter by status - no orderBy to avoid requiring a composite index
        const q = query(collection(db, 'businesses'), where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessWithCategory));
        // Client-side sort by rating
        data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setAllBusinesses(data);
        setFilteredBusinesses(data);
      } catch (err) {
        console.error('Error loading businesses:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBusinesses();
  }, []);

  useEffect(() => {
    let filtered = [...allBusinesses];
    if (selectedCategory) filtered = filtered.filter(b => b.category_id === selectedCategory);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(s) ||
        (b.description || '').toLowerCase().includes(s) ||
        b.city.toLowerCase().includes(s)
      );
    }
    if (cityFilter) {
      const c = cityFilter.toLowerCase();
      filtered = filtered.filter(b => b.city.toLowerCase().includes(c));
    }
    setFilteredBusinesses(filtered);
  }, [search, selectedCategory, cityFilter, allBusinesses]);

  const hasFilters = search || selectedCategory || cityFilter;

  return (
    <div className="min-h-screen pt-4">
      {/* Sticky Filter Bar */}
      <div className="bg-[#F2F4F7] sticky top-0 md:top-4 z-30 pb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A6FF8]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services or locations..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E6EAF0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3A6FF8] shadow-sm bg-white"
            />
          </div>
          <div className="relative">
            <input
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              placeholder="City..."
              className="w-full sm:w-48 px-4 py-3.5 rounded-2xl border border-[#E6EAF0] text-sm focus:outline-none focus:ring-2 focus:ring-[#3A6FF8] shadow-sm bg-white"
            />
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setSelectedCategory(''); setCityFilter(''); }}
              className="btn-white px-6 flex items-center gap-2 border border-[#E6EAF0] hover:border-[#3A6FF8]"
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm ${
              !selectedCategory ? 'bg-[#3A6FF8] text-white' : 'bg-white text-[#6B7280] hover:text-[#3A6FF8]'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm ${
                selectedCategory === cat.id ? 'bg-[#3A6FF8] text-white' : 'bg-white text-[#6B7280] hover:text-[#3A6FF8]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="py-2">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm font-bold text-[#0F172A] uppercase tracking-widest opacity-40">
            {loading ? 'Finding services...' : `${filteredBusinesses.length} Results`}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#9AA4B2] uppercase tracking-widest">
            <SlidersHorizontal size={14} /> Sorted by rating
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="card-soft h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-12">
            {filteredBusinesses.map(b => (
              <BusinessCard key={b.id} business={b} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-[#E6EAF0]">
            <div className="w-20 h-20 bg-[#F2F4F7] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-[#9AA4B2]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2 leading-tight">No businesses found</h3>
            <p className="text-[#6B7280] text-sm max-w-xs mx-auto">
              {hasFilters ? 'Try adjusting your search criteria or explore other categories.' : 'We haven\'t added any businesses here yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
