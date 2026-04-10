import { useEffect, useState } from 'react';
import { Building2, Plus, CreditCard as Edit2, Trash2, Tag, Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Business, Service, Promotion, Booking, Category, NavState } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

interface AdminDashboardProps {
  onNavigate: (state: NavState) => void;
}

type Tab = 'overview' | 'business' | 'services' | 'promotions' | 'bookings';

const statusConfig = {
  pending: { variant: 'warning' as const, icon: <AlertCircle size={12} />, label: 'Pending' },
  confirmed: { variant: 'info' as const, icon: <CheckCircle size={12} />, label: 'Confirmed' },
  completed: { variant: 'success' as const, icon: <CheckCircle size={12} />, label: 'Completed' },
  cancelled: { variant: 'error' as const, icon: <XCircle size={12} />, label: 'Cancelled' },
};

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [bookings, setBookings] = useState<(Booking & { services: Pick<Service, 'name' | 'price'>; profiles: { full_name: string } | null })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBizModal, setShowBizModal] = useState(false);
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editSvc, setEditSvc] = useState<Service | null>(null);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);

  const [bizForm, setBizForm] = useState({ name: '', description: '', category_id: '', address: '', city: '', phone: '', whatsapp: '', cover_url: '' });
  const [svcForm, setSvcForm] = useState({ name: '', description: '', price: '', duration: '60' });
  const [promoForm, setPromoForm] = useState({ title: '', description: '', discount_pct: '10', start_date: '', end_date: '' });

  useEffect(() => {
    if (!user || profile?.role === 'user') { onNavigate({ page: 'home' }); return; }
    load();
  }, [user, profile]);

  const load = async () => {
    setLoading(true);
    const [cats, biz] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('businesses').select('*').eq('owner_id', user!.id).maybeSingle(),
    ]);
    setCategories(cats.data || []);
    const bizData = biz.data;
    setBusiness(bizData);

    if (bizData) {
      setBizForm({ name: bizData.name, description: bizData.description, category_id: bizData.category_id || '', address: bizData.address, city: bizData.city, phone: bizData.phone, whatsapp: bizData.whatsapp, cover_url: bizData.cover_url });
      const [svcs, promos, bkgs] = await Promise.all([
        supabase.from('services').select('*').eq('business_id', bizData.id),
        supabase.from('promotions').select('*').eq('business_id', bizData.id),
        supabase.from('bookings').select('*, services(name, price), profiles(full_name)').eq('business_id', bizData.id).order('created_at', { ascending: false }),
      ]);
      setServices(svcs.data || []);
      setPromotions(promos.data || []);
      setBookings((bkgs.data as any) || []);
    }
    setLoading(false);
  };

  const saveBusiness = async () => {
    setSaving(true);
    if (business) {
      await supabase.from('businesses').update(bizForm).eq('id', business.id);
    } else {
      await supabase.from('businesses').insert({ ...bizForm, owner_id: user!.id });
    }
    await load();
    setShowBizModal(false);
    setSaving(false);
  };

  const saveService = async () => {
    if (!business) return;
    setSaving(true);
    const data = { ...svcForm, price: parseFloat(svcForm.price) || 0, duration: parseInt(svcForm.duration) || 60, business_id: business.id };
    if (editSvc) {
      await supabase.from('services').update(data).eq('id', editSvc.id);
    } else {
      await supabase.from('services').insert(data);
    }
    const { data: svcs } = await supabase.from('services').select('*').eq('business_id', business.id);
    setServices(svcs || []);
    setShowSvcModal(false);
    setSvcForm({ name: '', description: '', price: '', duration: '60' });
    setEditSvc(null);
    setSaving(false);
  };

  const deleteService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const savePromo = async () => {
    if (!business) return;
    setSaving(true);
    const data = { ...promoForm, discount_pct: parseInt(promoForm.discount_pct) || 0, business_id: business.id };
    if (editPromo) {
      await supabase.from('promotions').update(data).eq('id', editPromo.id);
    } else {
      await supabase.from('promotions').insert(data);
    }
    const { data: promos } = await supabase.from('promotions').select('*').eq('business_id', business.id);
    setPromotions(promos || []);
    setShowPromoModal(false);
    setPromoForm({ title: '', description: '', discount_pct: '10', start_date: '', end_date: '' });
    setEditPromo(null);
    setSaving(false);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as any } : b));
  };

  const openEditSvc = (svc: Service) => {
    setEditSvc(svc);
    setSvcForm({ name: svc.name, description: svc.description, price: svc.price.toString(), duration: svc.duration.toString() });
    setShowSvcModal(true);
  };

  const openEditPromo = (promo: Promotion) => {
    setEditPromo(promo);
    setPromoForm({ title: promo.title, description: promo.description, discount_pct: promo.discount_pct.toString(), start_date: promo.start_date, end_date: promo.end_date });
    setShowPromoModal(true);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'business', label: 'Business' },
    { key: 'services', label: `Services (${services.length})` },
    { key: 'promotions', label: `Promotions (${promotions.length})` },
    { key: 'bookings', label: `Bookings (${bookings.length})` },
  ];

  if (loading) {
    return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" /></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mt-6 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Business Dashboard</h1>
            <p className="text-neutral-500 mt-1">{business?.name || 'Set up your business to get started'}</p>
          </div>
          {business && (
            <Badge variant={business.status === 'approved' ? 'success' : business.status === 'pending' ? 'warning' : 'error'}>
              {business.status === 'approved' ? 'Live' : business.status === 'pending' ? 'Under Review' : 'Rejected'}
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto mb-6">
          <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit min-w-full sm:min-w-0">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Services', value: services.length, icon: <Building2 size={18} className="text-primary-500" /> },
                { label: 'Active Promos', value: promotions.filter(p => p.status === 'active').length, icon: <Tag size={18} className="text-secondary-500" /> },
                { label: 'Total Bookings', value: bookings.length, icon: <Calendar size={18} className="text-accent-500" /> },
                { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: <Clock size={18} className="text-warning-500" /> },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl shadow-card p-5">
                  <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-xs text-neutral-500">{stat.label}</span></div>
                  <div className="text-3xl font-bold text-neutral-900">{stat.value}</div>
                </div>
              ))}
            </div>

            {!business && (
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-8 text-center">
                <Building2 size={36} className="text-primary-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Create Your Business Profile</h3>
                <p className="text-neutral-500 text-sm mb-4">Set up your business to start accepting bookings from customers.</p>
                <Button onClick={() => { setTab('business'); setShowBizModal(true); }}>Create Business Profile</Button>
              </div>
            )}

            {business?.status === 'pending' && (
              <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-secondary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-secondary-800">Your business is under review</p>
                  <p className="text-xs text-secondary-600 mt-0.5">An admin will review and approve your business shortly. You'll receive a confirmation once it's live.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'business' && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Business Profile</h2>
              <Button size="sm" onClick={() => setShowBizModal(true)}>
                <Edit2 size={14} /> {business ? 'Edit' : 'Create'}
              </Button>
            </div>
            {business ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Business Name', business.name], ['City', business.city], ['Address', business.address],
                  ['Phone', business.phone], ['WhatsApp', business.whatsapp], ['Status', business.status],
                ].map(([label, val]) => (
                  <div key={label} className="p-4 bg-neutral-50 rounded-xl">
                    <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{label}</div>
                    <div className="text-sm font-medium text-neutral-900 capitalize">{val || '—'}</div>
                  </div>
                ))}
                {business.description && (
                  <div className="sm:col-span-2 p-4 bg-neutral-50 rounded-xl">
                    <div className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Description</div>
                    <div className="text-sm text-neutral-900">{business.description}</div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">No business profile yet. Click "Create" to get started.</p>
            )}
          </div>
        )}

        {tab === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Services</h2>
              {business && <Button size="sm" onClick={() => { setEditSvc(null); setSvcForm({ name: '', description: '', price: '', duration: '60' }); setShowSvcModal(true); }}><Plus size={14} /> Add Service</Button>}
            </div>
            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-card">
                  <p className="text-neutral-500 text-sm">{business ? 'No services yet. Add your first service.' : 'Create a business first.'}</p>
                </div>
              ) : services.map(svc => (
                <div key={svc.id} className="bg-white rounded-xl shadow-card p-5 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-neutral-900">{svc.name}</h3>
                      {!svc.is_active && <Badge variant="default">Inactive</Badge>}
                    </div>
                    <p className="text-neutral-500 text-sm">{svc.description}</p>
                    <div className="flex gap-3 text-xs text-neutral-400 mt-1">
                      <span><Clock size={11} className="inline mr-0.5" />{svc.duration} min</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-neutral-900 mb-2">${svc.price.toFixed(2)}</div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditSvc(svc)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => deleteService(svc.id)} className="p-1.5 text-neutral-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'promotions' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Promotions</h2>
              {business && <Button size="sm" onClick={() => { setEditPromo(null); setPromoForm({ title: '', description: '', discount_pct: '10', start_date: '', end_date: '' }); setShowPromoModal(true); }}><Plus size={14} /> Add Promo</Button>}
            </div>
            <div className="space-y-3">
              {promotions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-card">
                  <p className="text-neutral-500 text-sm">{business ? 'No promotions yet.' : 'Create a business first.'}</p>
                </div>
              ) : promotions.map(promo => (
                <div key={promo.id} className="bg-white rounded-xl shadow-card p-5 flex items-center gap-4">
                  <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center text-secondary-700 font-bold text-lg flex-shrink-0">
                    {promo.discount_pct}%
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-0.5">{promo.title}</h3>
                    <p className="text-neutral-500 text-sm">{promo.description}</p>
                    <p className="text-xs text-neutral-400 mt-1">{promo.start_date} → {promo.end_date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={promo.status === 'active' ? 'success' : 'default'}>{promo.status}</Badge>
                    <div className="flex gap-2">
                      <button onClick={() => openEditPromo(promo)} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-card">
                <p className="text-neutral-500 text-sm">No bookings yet.</p>
              </div>
            ) : bookings.map((booking: any) => {
              const sc = statusConfig[booking.status as keyof typeof statusConfig];
              return (
                <div key={booking.id} className="bg-white rounded-xl shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={sc.variant}><span className="flex items-center gap-1">{sc.icon}{sc.label}</span></Badge>
                    </div>
                    <h3 className="font-semibold text-neutral-900">{booking.services.name}</h3>
                    <p className="text-neutral-500 text-sm">{booking.profiles?.full_name || 'Customer'}</p>
                    <div className="flex gap-3 text-xs text-neutral-400 mt-1">
                      <span><Calendar size={11} className="inline mr-0.5" />{booking.date}</span>
                      <span><Clock size={11} className="inline mr-0.5" />{booking.time_slot}</span>
                    </div>
                    {booking.notes && <p className="text-xs text-neutral-400 italic mt-1">"{booking.notes}"</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-neutral-900">${booking.services.price.toFixed(2)}</span>
                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => updateBookingStatus(booking.id, 'confirmed')}>Confirm</Button>
                        <Button size="sm" variant="danger" onClick={() => updateBookingStatus(booking.id, 'cancelled')}>Decline</Button>
                      </div>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button size="sm" onClick={() => updateBookingStatus(booking.id, 'completed')}>Mark Done</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showBizModal} onClose={() => setShowBizModal(false)} title={business ? 'Edit Business' : 'Create Business'} size="lg">
        <div className="space-y-4">
          <Input label="Business Name" value={bizForm.name} onChange={e => setBizForm(f => ({ ...f, name: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
            <textarea
              value={bizForm.description}
              onChange={e => setBizForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Category</label>
            <select
              value={bizForm.category_id}
              onChange={e => setBizForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Address" value={bizForm.address} onChange={e => setBizForm(f => ({ ...f, address: e.target.value }))} />
            <Input label="City" value={bizForm.city} onChange={e => setBizForm(f => ({ ...f, city: e.target.value }))} />
            <Input label="Phone" value={bizForm.phone} onChange={e => setBizForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="WhatsApp" value={bizForm.whatsapp} onChange={e => setBizForm(f => ({ ...f, whatsapp: e.target.value }))} hint="e.g. +1234567890" />
          </div>
          <Input label="Cover Image URL" value={bizForm.cover_url} onChange={e => setBizForm(f => ({ ...f, cover_url: e.target.value }))} hint="Paste a Pexels image URL" />
          <Button onClick={saveBusiness} loading={saving} fullWidth>{business ? 'Save Changes' : 'Create Business'}</Button>
        </div>
      </Modal>

      <Modal open={showSvcModal} onClose={() => setShowSvcModal(false)} title={editSvc ? 'Edit Service' : 'Add Service'}>
        <div className="space-y-4">
          <Input label="Service Name" value={svcForm.name} onChange={e => setSvcForm(f => ({ ...f, name: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
            <textarea value={svcForm.description} onChange={e => setSvcForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price ($)" type="number" min="0" step="0.01" value={svcForm.price} onChange={e => setSvcForm(f => ({ ...f, price: e.target.value }))} required />
            <Input label="Duration (min)" type="number" min="15" step="15" value={svcForm.duration} onChange={e => setSvcForm(f => ({ ...f, duration: e.target.value }))} required />
          </div>
          <Button onClick={saveService} loading={saving} fullWidth>{editSvc ? 'Save Changes' : 'Add Service'}</Button>
        </div>
      </Modal>

      <Modal open={showPromoModal} onClose={() => setShowPromoModal(false)} title={editPromo ? 'Edit Promotion' : 'Add Promotion'}>
        <div className="space-y-4">
          <Input label="Title" value={promoForm.title} onChange={e => setPromoForm(f => ({ ...f, title: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
            <textarea value={promoForm.description} onChange={e => setPromoForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <Input label="Discount (%)" type="number" min="1" max="100" value={promoForm.discount_pct} onChange={e => setPromoForm(f => ({ ...f, discount_pct: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={promoForm.start_date} onChange={e => setPromoForm(f => ({ ...f, start_date: e.target.value }))} required />
            <Input label="End Date" type="date" value={promoForm.end_date} onChange={e => setPromoForm(f => ({ ...f, end_date: e.target.value }))} required />
          </div>
          <Button onClick={savePromo} loading={saving} fullWidth>{editPromo ? 'Save Changes' : 'Add Promotion'}</Button>
        </div>
      </Modal>
    </div>
  );
}
