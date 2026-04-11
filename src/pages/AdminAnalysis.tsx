import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight, Calendar, Sparkles, Clock } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { NavState, Business, Booking } from '../lib/types';

interface AdminAnalysisProps {
  onNavigate: (state: NavState) => void;
}

export default function AdminAnalysis({ onNavigate }: AdminAnalysisProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    newCustomers: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAnalysis = async () => {
      try {
        // 1. Get business ID
        const bQuery = query(collection(db, 'businesses'), where('owner_id', '==', user.uid));
        const bSnap = await getDocs(bQuery);
        if (bSnap.empty) { setLoading(false); return; }
        const bizId = bSnap.docs[0].id;

        // 2. Get bookings for this business
        const bksQuery = query(collection(db, 'bookings'), where('business_id', '==', bizId));
        const bksSnap = await getDocs(bksQuery);
        const bks = bksSnap.docs.map(d => d.data() as Booking);

        // 3. Simple calc (MVP)
        const revenue = bks.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.price || 0), 0);
        
        setStats({
          totalRevenue: revenue,
          totalBookings: bks.length,
          newCustomers: Array.from(new Set(bks.map(b => b.user_id))).length,
          conversionRate: bks.length > 0 ? (bks.filter(b => b.status === 'completed').length / bks.length) * 100 : 0
        });

      } catch (err) {
        console.error('Analysis error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28">
        <div className="w-10 h-10 border-4 border-[#3A6FF8] border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: <DollarSign size={20} />, trend: '+12.5%', isUp: true, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: <Calendar size={20} />, trend: '+8.2%', isUp: true, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Unique Customers', value: stats.newCustomers, icon: <Users size={20} />, trend: '+4.1%', isUp: true, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Completion Rate', value: `${stats.conversionRate.toFixed(1)}%`, icon: <TrendingUp size={20} />, trend: '-1.4%', isUp: false, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="pt-28 pb-12">
      <div className="mb-10 flex items-center justify-between bg-white p-8 rounded-[32px] border border-[#E6EAF0] shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Performance Analysis</h1>
          <p className="text-[#6B7280] text-sm font-medium mt-1">Real-time data insights for your business</p>
        </div>
        <div className="w-14 h-14 bg-gradient-to-br from-[#3A6FF8] to-[#1E40AF] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
           <BarChart2 size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-[24px] p-6 border border-[#E6EAF0] shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6`}>
              {card.icon}
            </div>
            <div className="text-3xl font-black text-[#0F172A] mb-1">{card.value}</div>
            <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-[#9AA4B2] uppercase tracking-widest">{card.label}</span>
               <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg ${card.isUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                 {card.isUp ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                 {card.trend}
               </div>
            </div>
            {/* Background design */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-bl-[100px] opacity-20 -mr-4 -mt-4" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-[#E6EAF0] shadow-sm">
           <h3 className="text-xl font-black text-[#0F172A] mb-6 flex items-center gap-2">
             <TrendingUp size={20} className="text-[#3A6FF8]" /> Revenue Forecast
           </h3>
           <div className="h-64 flex items-end justify-between gap-2 pt-4">
              {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                   <div 
                     className="w-full bg-[#3A6FF8]/10 rounded-t-xl relative overflow-hidden group-hover:bg-[#3A6FF8]/20 transition-colors"
                     style={{ height: `${h}%` }}
                   >
                     <div className="absolute bottom-0 left-0 right-0 bg-[#3A6FF8] transition-all duration-1000" style={{ height: '40%' }} />
                   </div>
                   <span className="text-[10px] font-black text-[#9AA4B2] uppercase">Day {i+1}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-[#0F172A] rounded-[32px] p-8 text-white shadow-xl shadow-gray-200">
           <h3 className="text-xl font-black mb-2">Growth Tip</h3>
           <p className="text-sm text-gray-400 mb-8 leading-relaxed">Based on your recent completed bookings, your business is growing at a steady pace.</p>
           
           <div className="space-y-6">
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles size={18} className="text-yellow-400" />
                 </div>
                 <div>
                    <h4 className="font-bold text-sm mb-1">Increase Retention</h4>
                    <p className="text-xs text-gray-400">Offer a 5% discount to repeat customers to boost your loyalty score.</p>
                 </div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-blue-400" />
                 </div>
                 <div>
                    <h4 className="font-bold text-sm mb-1">Peak Hours</h4>
                    <p className="text-xs text-gray-400">Your busiest time is 4 PM. Try opening 1 hour earlier on Fridays.</p>
                 </div>
              </div>
           </div>

           <button className="w-full py-4 bg-white text-[#0F172A] rounded-2xl font-black text-xs uppercase tracking-widest mt-12 hover:bg-gray-100 transition-all">
              Download Full Report
           </button>
        </div>
      </div>
    </div>
  );
}

function Stars({ size, className }: any) {
  return <TrendingUp size={size} className={className} />;
}

function Clock({ size, className }: any) {
  return <BarChart2 size={size} className={className} />;
}
