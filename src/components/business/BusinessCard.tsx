import { MapPin, Star, Clock } from 'lucide-react';
import type { BusinessWithCategory } from '../../lib/types';
import Badge from '../ui/Badge';
import type { NavState } from '../../lib/types';

interface BusinessCardProps {
  business: BusinessWithCategory;
  onNavigate: (state: NavState) => void;
}

const COVER_FALLBACKS = [
  'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1813504/pexels-photo-1813504.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3997381/pexels-photo-3997381.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3985338/pexels-photo-3985338.jpeg?auto=compress&cs=tinysrgb&w=800',
];

export default function BusinessCard({ business, onNavigate }: BusinessCardProps) {
  const coverImg = business.cover_url || COVER_FALLBACKS[Math.abs(business.name.charCodeAt(0)) % COVER_FALLBACKS.length];

  return (
    <button
      onClick={() => onNavigate({ page: 'business-detail', businessId: business.id })}
      className="group text-left w-full bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={coverImg}
          alt={business.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {business.categories && (
          <div className="absolute top-3 left-3">
            <Badge variant="info">{business.categories.name}</Badge>
          </div>
        )}
        {business.rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 rounded-full px-2.5 py-1 text-xs font-semibold text-neutral-800">
            <Star size={12} className="text-secondary-500 fill-secondary-500" />
            {business.rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 text-base mb-1 group-hover:text-primary-600 transition-colors leading-snug">
          {business.name}
        </h3>
        <p className="text-neutral-500 text-sm line-clamp-2 mb-3 leading-relaxed">
          {business.description || 'Premium local service provider'}
        </p>
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-primary-500" />
            {business.city || 'Local'}
          </span>
          {business.review_count > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {business.review_count} reviews
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
