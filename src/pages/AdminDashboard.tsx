import { useEffect, useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Star, Calendar, Briefcase, IndianRupee, Clock, Megaphone, MapPin, Phone } from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Business, Service, Promotion, Category, NavState } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

interface AdminDashboardProps {
  onNavigate: (state: NavState) => void;
}

type Tab = 'overview' | 'business' | 'services' | 'promotions' | 'bookings';

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showBizModal, setShowBizModal] = useState(false);
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [uploading, setUploading] = useState<{ logo: boolean; cover: boolean }>({ logo: false, cover: false });
  const [editSvc, setEditSvc] = useState<Service | null>(null);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);

  const [bizForm, setBizForm] = useState({ 
    name: '', 
    description: '', 
    category_id: '', 
    address: '', 
    city: '', 
    phone: '', 
    whatsapp: '', 
    logo_url: '', 
    cover_url: '',
    working_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true },
    }
  });
  const [svcForm, setSvcForm] = useState({ name: '', description: '', price: '', duration: '60' });
  const [promoForm, setPromoForm] = useState({ title: '', description: '', discount_pct: '10', start_date: '', end_date: '' });

  useEffect(() => {
    if (!user) { onNavigate({ page: 'auth' }); return; }
    // If profile loaded AND is a regular user (not admin/super_admin), redirect home
    if (profile && profile.role === 'user') {
      onNavigate({ page: 'home' });
      return;
    }
    // Super admin should go to their own console
    if (profile && profile.role === 'super_admin') {
      onNavigate({ page: 'super-admin' });
      return;
    }

    const qBiz = query(collection(db, 'businesses'), where('owner_id', '==', user.uid));
    let unsubSvcs: (() => void) | null = null;
    let unsubPromos: (() => void) | null = null;
    let unsubBkgs: (() => void) | null = null;

    const unsubBiz = onSnapshot(qBiz, (snapshot) => {
      if (!snapshot.empty) {
        const bizData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Business;
        setBusiness(bizData);
        setBizForm({
          name: bizData.name || '',
          description: bizData.description || '',
          category_id: bizData.category_id || '',
          address: bizData.address || '',
          city: bizData.city || '',
          phone: bizData.phone || '',
          whatsapp: bizData.whatsapp || '',
          logo_url: bizData.logo_url || '',
          cover_url: bizData.cover_url || ''
        });
        setLoading(false);

        unsubSvcs = onSnapshot(query(collection(db, 'services'), where('business_id', '==', bizData.id)), (s) => {
          setServices(s.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
        });
        unsubPromos = onSnapshot(query(collection(db, 'promotions'), where('business_id', '==', bizData.id)), (s) => {
          setPromotions(s.docs.map(d => ({ id: d.id, ...d.data() } as Promotion)));
        });
        unsubBkgs = onSnapshot(query(collection(db, 'bookings'), where('business_id', '==', bizData.id)), (s) => {
          setBookings(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      } else {
        setBusiness(null);
        setLoading(false);
      }
    }, (err) => {
      console.error('Business snapshot error:', err);
      setLoading(false);
    });

    // Load categories without orderBy (client-side sort)
    getDocs(collection(db, 'categories')).then(snapshot => {
      const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      cats.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(cats);
    });

    return () => {
      unsubBiz();
      if (unsubSvcs) unsubSvcs();
      if (unsubPromos) unsubPromos();
      if (unsubBkgs) unsubBkgs();
    };
  }, [user, profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Optional: Check size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.');
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      // Use a timestamp or unique ID if business doesn't exist yet, 
      // otherwise use business.id
      const folder = business?.id || `temp_${user.uid}`;
      const fileRef = ref(storage, `businesses/${folder}/${type}_${Date.now()}`);
      
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      setBizForm(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'cover_url']: url }));
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const saveBusiness = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (business) {
        await updateDoc(doc(db, 'businesses', business.id), bizForm);
      } else {
        await addDoc(collection(db, 'businesses'), {
          ...bizForm,
          owner_id: user.uid,
          status: 'pending',
          rating: 5.0,
          review_count: 0,
          created_at: new Date().toISOString()
        });
        // Upgrade to admin role
        await updateDoc(doc(db, 'profiles', user.uid), { role: 'admin' });
      }
      setShowBizModal(false);
    } catch (err: any) {
      alert('Error saving business: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveService = async () => {
    if (!business) return;
    setSaving(true);
    const data = {
      name: svcForm.name,
      description: svcForm.description,
      price: parseFloat(svcForm.price) || 0,
      duration: parseInt(svcForm.duration) || 60,
      business_id: business.id,
      is_active: true,
      created_at: new Date().toISOString()
    };
    try {
      if (editSvc) {
        await updateDoc(doc(db, 'services', editSvc.id), data);
      } else {
        await addDoc(collection(db, 'services'), data);
      }
      setShowSvcModal(false);
      setSvcForm({ name: '', description: '', price: '', duration: '60' });
      setEditSvc(null);
    } catch (err: any) {
      alert('Error saving service: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePromotion = async () => {
    if (!business) return;
    setSaving(true);
    const data = {
      title: promoForm.title,
      description: promoForm.description,
      discount_pct: parseInt(promoForm.discount_pct) || 10,
      start_date: promoForm.start_date || new Date().toISOString(),
      end_date: promoForm.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      business_id: business.id,
      status: 'active',
      image_url: business.cover_url || '',
      created_at: new Date().toISOString()
    };
    try {
      if (editPromo) {
        await updateDoc(doc(db, 'promotions', editPromo.id), data);
      } else {
        await addDoc(collection(db, 'promotions'), data);
      }
      setShowPromoModal(false);
      setPromoForm({ title: '', description: '', discount_pct: '10', start_date: '', end_date: '' });
      setEditPromo(null);
    } catch (err: any) {
      alert('Error saving promotion: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (id: string) => {
    if (!window.confirm('Delete this service?')) return;
    try { await deleteDoc(doc(db, 'services', id)); }
    catch (err: any) { alert('Error: ' + err.message); }
  };

  const deletePromotion = async (id: string) => {
    if (!window.confirm('Delete this promotion?')) return;
    try { await deleteDoc(doc(db, 'promotions', id)); }
    catch (err: any) { alert('Error: ' + err.message); }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try { await updateDoc(doc(db, 'bookings', id), { status }); }
    catch (err: any) { alert('Error: ' + err.message); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  const tabs: Tab[] = ['overview', 'business', 'services', 'promotions', 'bookings'];

  return (
    <div className="pt-28 pb-10">
      <div className="w-full">

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-[32px] border border-[#E6EAF0] shadow-sm gap-6">
          <div>
            <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Business Console</h1>
            <p className="text-[#6B7280] text-sm font-medium mt-1">{business?.name || 'Set up your professional local presence'}</p>
          </div>
          {business && (
            <div className={`flex items-center self-start md:self-center px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
              business.status === 'approved' ? 'bg-[#3A6FF8]/5 text-[#3A6FF8] border-[#3A6FF8]/20' : 
              business.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 
              'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                business.status === 'approved' ? 'bg-[#3A6FF8] animate-pulse' : 
                business.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
              }`} />
              {business.status === 'approved' ? 'Business Live' : business.status === 'rejected' ? 'Listing Rejected' : 'Review In Progress'}
            </div>
          )}
        </div>

        {/* Navigation Tabs (3-Column Grid) */}
        <div className="grid grid-cols-3 gap-2 mb-10 bg-white p-2 rounded-[24px] border border-[#E6EAF0] w-full shadow-sm">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`py-3.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all text-center border ${
                activeTab === t 
                  ? 'bg-[#3A6FF8] text-white shadow-lg shadow-blue-200 border-[#3A6FF8]' 
                  : 'text-[#6B7280] hover:text-[#0F172A] border-transparent hover:border-[#E6EAF0]'
              }`}
            >
              {t === 'bookings' ? `Bookings` : t === 'services' ? `Services` : t === 'promotions' ? `Offers` : t}
            </button>
          ))}
        </div>


        {/* No Business CTA */}
        {!business ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 size={40} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Grow your business with LocalEase</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">
              List your services, manage bookings, and reach thousands of local customers. Your listing will be reviewed before going live.
            </p>
            {/* Gate: profile must be complete before listing */}
            {profile && (!profile.phone || profile.phone.length < 10) ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
                <div className="font-bold text-amber-800 text-sm mb-1">⚠️ Complete your profile first</div>
                <p className="text-amber-700 text-xs mb-3">Your phone number is required before you can list a business.</p>
                <Button size="sm" onClick={() => onNavigate({ page: 'profile' })}>Complete Profile →</Button>
              </div>
            ) : (
              <Button size="lg" onClick={() => setShowBizModal(true)}>List My Business</Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Services', value: services.length, icon: <Briefcase size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Bookings', value: bookings.length, icon: <Calendar size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Rating', value: business.rating?.toFixed(1) || '—', icon: <Star size={16} />, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Promotions', value: promotions.length, icon: <Megaphone size={16} />, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Live Status', value: business.status === 'approved' ? 'Live' : 'Hidden', icon: <Clock size={16} />, color: 'text-sky-600', bg: 'bg-sky-50' }
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                    <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>{stat.icon}</div>
                    <div className="text-xl font-black text-[#0F172A] leading-none">{stat.value}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{stat.label}</div>
                  </div>
                ))}

                {bookings.length > 0 && (
                  <div className="col-span-2 lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Recent Bookings</h3>
                    <div className="space-y-3">
                      {bookings.slice(0, 3).map(b => (
                        <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{b.user_name || 'Customer'} — {b.service_name}</div>
                            <div className="text-xs text-gray-400">{b.date} at {b.time || b.time_slot}</div>
                          </div>
                          <Badge variant={b.status === 'confirmed' || b.status === 'completed' ? 'success' : 'warning'}>{b.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BUSINESS TAB */}
            {activeTab === 'business' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Profile Information</h3>
                    <button onClick={() => setShowBizModal(true)} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">Edit</button>
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <Building2 size={18} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Business Name</div>
                        <div className="font-bold text-gray-900">{business.name}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">City</div>
                        <div className="font-semibold text-gray-900">{business.city || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone size={18} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">WhatsApp</div>
                        <div className="font-semibold text-gray-900">{business.whatsapp || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">About</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{business.description || 'No description provided.'}</p>
                  <div className="mt-6 pt-6 border-t border-gray-50">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</div>
                    <Badge variant={business.status === 'approved' ? 'success' : business.status === 'rejected' ? 'error' : 'warning'}>
                      {business.status === 'approved' ? 'Live & Visible' : business.status === 'rejected' ? 'Rejected by admin' : 'Waiting for approval'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* SERVICES TAB */}
            {activeTab === 'services' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Your Services</h3>
                  <Button size="sm" onClick={() => { setEditSvc(null); setSvcForm({ name: '', description: '', price: '', duration: '60' }); setShowSvcModal(true); }}>
                    <Plus size={14} /> Add Service
                  </Button>
                </div>
                <div className="divide-y divide-gray-50">
                  {services.length === 0 ? (
                    <div className="p-16 text-center">
                      <Briefcase size={32} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No services added yet.</p>
                    </div>
                  ) : (
                    services.map(svc => (
                      <div key={svc.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div>
                          <h4 className="font-bold text-gray-900">{svc.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-gray-400">
                            <span className="flex items-center gap-1 text-blue-600"><IndianRupee size={12} />{svc.price}</span>
                            <span className="flex items-center gap-1"><Clock size={12} />{svc.duration} mins</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditSvc(svc); setSvcForm({ name: svc.name, description: svc.description || '', price: svc.price.toString(), duration: svc.duration.toString() }); setShowSvcModal(true); }} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"><Edit2 size={15} /></button>
                          <button onClick={() => deleteService(svc.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PROMOTIONS TAB */}
            {activeTab === 'promotions' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Promotions & Offers</h3>
                  <Button size="sm" variant="accent" onClick={() => { setEditPromo(null); setPromoForm({ title: '', description: '', discount_pct: '10', start_date: '', end_date: '' }); setShowPromoModal(true); }}>
                    <Plus size={14} /> Add Offer
                  </Button>
                </div>
                <div className="divide-y divide-gray-50">
                  {promotions.length === 0 ? (
                    <div className="p-16 text-center">
                      <Megaphone size={32} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No promotional offers yet.</p>
                    </div>
                  ) : (
                    promotions.map(promo => (
                      <div key={promo.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">{promo.title}</h4>
                            <Badge variant="accent">{promo.discount_pct}% OFF</Badge>
                          </div>
                          <p className="text-sm text-gray-400">{promo.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditPromo(promo); setPromoForm({ title: promo.title, description: promo.description, discount_pct: promo.discount_pct.toString(), start_date: promo.start_date || '', end_date: promo.end_date || '' }); setShowPromoModal(true); }} className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"><Edit2 size={15} /></button>
                          <button onClick={() => deletePromotion(promo.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Appointment Bookings</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {bookings.length === 0 ? (
                    <div className="p-16 text-center">
                      <Calendar size={32} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No bookings yet. Share your business to get started!</p>
                    </div>
                  ) : (
                    bookings.map(b => (
                      <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                        {/* Customer info */}
                        <div className="flex gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                            {b.user_avatar || '😊'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 text-sm">{b.user_name || 'Customer'}</div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                              {b.user_phone && (
                                <a
                                  href={`tel:${b.user_phone}`}
                                  className="text-[11px] text-blue-600 font-bold flex items-center gap-1 hover:underline bg-blue-50 px-1.5 py-0.5 rounded"
                                >
                                  📞 {b.user_phone}
                                </a>
                              )}
                              {b.user_email && (
                                <a
                                  href={`mailto:${b.user_email}`}
                                  className="text-[11px] text-purple-600 font-bold flex items-center gap-1 hover:underline bg-purple-50 px-1.5 py-0.5 rounded"
                                >
                                  ✉️ {b.user_email}
                                </a>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-purple-600 mt-1">{b.service_name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              📅 {b.date} · ⏰ {b.time || b.time_slot}
                            </div>
                            {b.notes && (
                              <div className="text-xs text-gray-400 mt-1 italic">"{b.notes}"</div>
                            )}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {b.user_phone && (
                            <a
                              href={`https://wa.me/${b.user_phone.replace(/\D/g, '')}?text=Hi ${b.user_name}, your booking for ${b.service_name} on ${b.date} at ${b.time || b.time_slot} is confirmed!`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                            >
                              WhatsApp
                            </a>
                          )}
                          {b.status === 'pending' && (
                            <Button size="sm" onClick={() => updateBookingStatus(b.id, 'confirmed')}>Confirm</Button>
                          )}
                          {b.status === 'confirmed' && (
                            <Button size="sm" variant="success" onClick={() => updateBookingStatus(b.id, 'completed')}>Done</Button>
                          )}
                          <Badge variant={b.status === 'confirmed' || b.status === 'completed' ? 'success' : b.status === 'cancelled' ? 'error' : 'warning'}>{b.status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BUSINESS MODAL */}
        {showBizModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">{business ? 'Update Business' : 'List Your Business'}</h3>
                <p className="text-gray-500 text-sm mt-1">Fill in your details. Your listing will be reviewed before going live.</p>
              </div>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <input value={bizForm.name} onChange={e => setBizForm({ ...bizForm, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Business Name *" />
                <select value={bizForm.category_id} onChange={e => setBizForm({ ...bizForm, category_id: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <textarea value={bizForm.description} onChange={e => setBizForm({ ...bizForm, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Business description..." rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <input value={bizForm.city} onChange={e => setBizForm({ ...bizForm, city: e.target.value })} className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="City *" />
                  <input value={bizForm.phone} onChange={e => setBizForm({ ...bizForm, phone: e.target.value })} className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone Number" />
                </div>
                <input value={bizForm.whatsapp} onChange={e => setBizForm({ ...bizForm, whatsapp: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="WhatsApp Number (e.g. 919999988888)" />
                <input value={bizForm.address} onChange={e => setBizForm({ ...bizForm, address: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full Address" />
                
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={14} className="text-[#3A6FF8]" /> Weekly Operating Hours
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(bizForm.working_hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                        <div className="w-24 text-[10px] font-black uppercase text-[#6B7280] tracking-tighter">{day}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="time" 
                            value={hours.open} 
                            disabled={hours.closed}
                            onChange={(e) => setBizForm({
                              ...bizForm,
                              working_hours: { ...bizForm.working_hours, [day]: { ...hours, open: e.target.value } }
                            })}
                            className="bg-white px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 disabled:opacity-30"
                          />
                          <span className="text-gray-300 text-xs">to</span>
                          <input 
                            type="time" 
                            value={hours.close} 
                            disabled={hours.closed}
                            onChange={(e) => setBizForm({
                              ...bizForm,
                              working_hours: { ...bizForm.working_hours, [day]: { ...hours, close: e.target.value } }
                            })}
                            className="bg-white px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 disabled:opacity-30"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer group">
                           <input 
                             type="checkbox" 
                             checked={hours.closed}
                             onChange={(e) => setBizForm({
                              ...bizForm,
                              working_hours: { ...bizForm.working_hours, [day]: { ...hours, closed: e.target.checked } }
                             })}
                             className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                           />
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-red-500 transition-colors">Closed</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Business Logo</label>
                    <div className="relative group">
                      <div className="w-full h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center transition-colors group-hover:border-blue-400 overflow-hidden">
                        {bizForm.logo_url ? (
                          <img src={bizForm.logo_url} className="w-full h-full object-cover" alt="Logo" />
                        ) : (
                          <div className="text-center p-4">
                            <Plus size={20} className="text-gray-400 mx-auto mb-1" />
                            <span className="text-[10px] font-bold text-gray-400">UPLOAD LOGO</span>
                          </div>
                        )}
                        {uploading.logo && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => handleImageUpload(e, 'logo')}
                          disabled={uploading.logo}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Cover Banner</label>
                    <div className="relative group">
                      <div className="w-full h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center transition-colors group-hover:border-blue-400 overflow-hidden">
                        {bizForm.cover_url ? (
                          <img src={bizForm.cover_url} className="w-full h-full object-cover" alt="Banner" />
                        ) : (
                          <div className="text-center p-4">
                            <Plus size={20} className="text-gray-400 mx-auto mb-1" />
                            <span className="text-[10px] font-bold text-gray-400">UPLOAD BANNER</span>
                          </div>
                        )}
                        {uploading.cover && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => handleImageUpload(e, 'cover')}
                          disabled={uploading.cover}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50/50 flex gap-3">
                <Button onClick={saveBusiness} loading={saving} fullWidth>Save Business</Button>
                <Button variant="outline" onClick={() => setShowBizModal(false)} fullWidth>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* SERVICE MODAL */}
        {showSvcModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-5">{editSvc ? 'Edit Service' : 'Add New Service'}</h3>
              <div className="space-y-4">
                <input value={svcForm.name} onChange={e => setSvcForm({ ...svcForm, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Service name (e.g. Haircut)" />
                <textarea value={svcForm.description} onChange={e => setSvcForm({ ...svcForm, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Service description (optional)" rows={2} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Price (₹)</label>
                    <input value={svcForm.price} onChange={e => setSvcForm({ ...svcForm, price: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" type="number" min="0" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Duration (mins)</label>
                    <input value={svcForm.duration} onChange={e => setSvcForm({ ...svcForm, duration: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" type="number" min="15" placeholder="60" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={saveService} loading={saving} fullWidth>{editSvc ? 'Update Service' : 'Add Service'}</Button>
                <Button variant="outline" onClick={() => setShowSvcModal(false)} fullWidth>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* PROMOTION MODAL */}
        {showPromoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-5">{editPromo ? 'Edit Promotion' : 'Add Promotion'}</h3>
              <div className="space-y-4">
                <input value={promoForm.title} onChange={e => setPromoForm({ ...promoForm, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Offer Title (e.g. Summer Special)" />
                <input value={promoForm.discount_pct} onChange={e => setPromoForm({ ...promoForm, discount_pct: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" min="1" max="100" placeholder="Discount % (e.g. 20)" />
                <textarea value={promoForm.description} onChange={e => setPromoForm({ ...promoForm, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" placeholder="Tell customers about the deal..." rows={2} />
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={savePromotion} loading={saving} variant="accent" fullWidth>{editPromo ? 'Update' : 'Post Promotion'}</Button>
                <Button variant="outline" onClick={() => setShowPromoModal(false)} fullWidth>Cancel</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
