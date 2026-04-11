import { useState, useEffect, useRef } from 'react';
import { MessageCircle, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import type { Promotion } from '../../lib/types';
import Button from '../ui/Button';

interface PromotionCarouselProps {
  promotions: Promotion[];
}

export default function PromotionCarousel({ promotions }: PromotionCarouselProps) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promotions.length]);

  const handleNext = () => setActive(prev => (prev + 1) % promotions.length);
  const handlePrev = () => setActive(prev => (prev - 1 + promotions.length) % promotions.length);

  if (promotions.length === 0) return null;

  return (
    <div 
      className="relative group overflow-hidden rounded-3xl bg-neutral-900 aspect-[16/9] sm:aspect-[21/9]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0 flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${active * 100}%)` }}>
        {promotions.map((promo, i) => (
          <div key={promo.id} className="min-w-full h-full relative">
            <img 
              src={`https://images.unsplash.com/photo-1600880212319-467306?auto=format&fit=crop&w=1200&q=80&sig=${i}`} 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              alt={promo.title}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-center max-w-xl">
              <div className="flex items-center gap-2 text-secondary-400 font-bold text-sm mb-4 uppercase tracking-[0.2em]">
                <Tag size={16} />
                Special Offer
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                {promo.title}
              </h2>
              <p className="text-neutral-300 text-base sm:text-lg mb-8 line-clamp-2">
                {promo.description}
              </p>
              <div className="flex items-center gap-4">
                <div className="px-6 py-3 bg-secondary-500 text-white rounded-2xl font-bold text-xl sm:text-2xl shadow-lg -rotate-2">
                  {promo.discount_pct}% OFF
                </div>
                <Button 
                  size="lg" 
                  variant="success" 
                  className="rounded-2xl gap-2 font-bold"
                  onClick={() => window.open('https://wa.me/919999988888', '_blank')}
                >
                  <MessageCircle size={20} />
                  Claim via WhatsApp
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {promotions.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${active === i ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} 
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={20} />
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
