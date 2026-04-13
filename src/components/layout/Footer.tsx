import { MapPin, Mail, Phone } from 'lucide-react';
import type { NavState } from '../../lib/types';

interface FooterProps {
  onNavigate: (state: NavState) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-12 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <button
              onClick={() => onNavigate({ page: 'home' })}
              className="flex items-center gap-2 mb-2"
            >
              <div className="w-8 h-8 bg-[#3A6FF8] rounded-lg flex items-center justify-center">
                <MapPin size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Local<span className="text-blue-400">Ease</span></span>
            </button>
            <p className="text-xs leading-relaxed text-neutral-400 max-w-xs">
              Discover and book trusted local businesses. From beauty to wellness, find the best services near you.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Explore</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate({ page: 'browse' })} className="hover:text-white transition-colors">
                  Browse Businesses
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate({ page: 'auth' })} className="hover:text-white transition-colors">
                  List Your Business
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Contact</h4>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2">
                <Mail size={12} />
                <span>hello@localease.app</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={12} />
                <span>+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-neutral-500">
          <span>&copy; {new Date().getFullYear()} LocalEase. All rights reserved.</span>
          <span>Built for local communities.</span>
        </div>
      </div>
    </footer>
  );
}
