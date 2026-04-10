import { MapPin, Mail, Phone } from 'lucide-react';
import type { NavState } from '../../lib/types';

interface FooterProps {
  onNavigate: (state: NavState) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <button
              onClick={() => onNavigate({ page: 'home' })}
              className="flex items-center gap-2 mb-4"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <MapPin size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Local<span className="text-primary-400">Ease</span></span>
            </button>
            <p className="text-sm leading-relaxed text-neutral-400 max-w-xs">
              Discover and book trusted local businesses. From beauty to wellness, find the best services near you.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-sm">
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
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={14} />
                <span>hello@localease.app</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} />
                <span>+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <span>&copy; {new Date().getFullYear()} LocalEase. All rights reserved.</span>
          <span>Built for local communities.</span>
        </div>
      </div>
    </footer>
  );
}
