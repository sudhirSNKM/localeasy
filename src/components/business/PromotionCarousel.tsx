import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Tag, ArrowRight } from 'lucide-react';
import type { Promotion } from '../../lib/types';
import Button from '../ui/Button';

interface PromotionCarouselProps {
  promotions: Promotion[];
}

export default function PromotionCarousel({ promotions }: PromotionCarouselProps) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const SLIDE_DURATION = 5000; // 5 seconds per slide

  useEffect(() => {
    if (isPaused) return;

    const interval = 50; // Update progress bar every 50ms
    const step = (interval / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setActive(current => (current + 1) % promotions.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [active, promotions.length, isPaused]);

  const handleManualNav = (index: number) => {
    setActive(index);
    setProgress(0);
  };

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsPaused(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchStart(clientX);
  };

  const onTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    setIsPaused(false);
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    if (touchStart !== null) {
      const diff = touchStart - clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) handleManualNav((active + 1) % promotions.length);
        else handleManualNav((active - 1 + promotions.length) % promotions.length);
      }
    }
    setTouchStart(null);
  };

  if (promotions.length === 0) return null;

  const currentPromo = promotions[active];

  return (
    <div 
      className="relative group overflow-hidden rounded-[2rem] bg-neutral-900 aspect-[16/10] sm:aspect-[21/9] shadow-2xl border border-white/10"
      onMouseDown={onTouchStart}
      onMouseUp={onTouchEnd}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Images Layer */}
      <div className="absolute inset-0 flex transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)" style={{ transform: `translateX(-${active * 100}%)` }}>
        {promotions.map((promo, i) => (
          <div key={promo.id} className="min-w-full h-full relative overflow-hidden">
            <img 
              src={promo.image_url || `https://images.unsplash.com/photo-1621905235277-3e414c143924?auto=format&fit=crop&w=1200&q=80&sig=${i}`} 
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[5000ms] ease-linear ${active === i ? 'scale-110' : 'scale-100'}`}
              alt={promo.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          </div>
        ))}
      </div>

      {/* WhatsApp Style Progress Indicators (Top) */}
      <div className="absolute top-5 left-6 right-6 flex gap-1.5 z-20">
        {promotions.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-75"
              style={{ 
                width: i < active ? '100%' : i === active ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Content Layer */}
      <div className="absolute inset-0 p-8 sm:p-14 flex flex-col justify-end sm:justify-center z-10 pointer-events-none">
        <div className="max-w-xl transition-all duration-500 transform pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-white font-bold text-[10px] uppercase tracking-widest mb-4 border border-white/20">
            <Tag size={12} className="text-secondary-400" />
            {currentPromo.business_name || 'Limited Offer'}
          </div>
          
          <h2 className="text-3xl sm:text-6xl font-black text-white mb-4 leading-[1.1] tracking-tight drop-shadow-lg">
            {currentPromo.title}
          </h2>
          
          <p className="text-white/80 text-base sm:text-lg mb-8 line-clamp-2 max-w-md font-medium leading-relaxed">
            {currentPromo.description}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="px-6 py-2.5 bg-secondary-500 text-white rounded-2xl font-black text-2xl sm:text-3xl shadow-[0_8px_0_0_rgb(180,83,9)] active:translate-y-1 active:shadow-none transition-all -rotate-3">
               {currentPromo.discount_pct}% OFF
            </div>
            
            <a 
              href={`https://wa.me/${currentPromo.business_whatsapp?.replace(/\D/g, '') || '919999988888'}?text=Hi, I'm interested in the ${currentPromo.title} offer!`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 bg-white text-neutral-900 px-7 py-4 rounded-2xl font-bold hover:bg-neutral-100 transition-all shadow-xl group/btn"
            >
              <MessageCircle size={22} className="text-green-500 fill-green-500/20" />
              Claim on WhatsApp
              <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation (Visible on Hover) */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20" onClick={() => handleManualNav((active - 1 + promotions.length) % promotions.length)} />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20" onClick={() => handleManualNav((active + 1) % promotions.length)} />
    </div>
  );
}
