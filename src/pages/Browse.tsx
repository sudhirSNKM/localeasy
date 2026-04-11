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
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Sticky Filter Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search businesses or services..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              placeholder="Filter by city..."
              className="sm:w-40 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory(''); setCityFilter(''); }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl transition-colors"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0 ${
                !selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0 ${
                  selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${filteredBusinesses.length} business${filteredBusinesses.length !== 1 ? 'es' : ''} found`}
          </p>
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <SlidersHorizontal size={14} /> Sorted by rating
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredBusinesses.map(b => (
              <BusinessCard key={b.id} business={b} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No businesses found</h3>
            <p className="text-gray-500 text-sm">
              {hasFilters ? 'Try adjusting your search or filters.' : 'No approved businesses yet. Check back soon!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
