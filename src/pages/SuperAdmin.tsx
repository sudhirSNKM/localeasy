import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Building2, Users, AlertCircle, Search, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Business, Profile, NavState } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

interface SuperAdminProps {
  onNavigate: (state: NavState) => void;
}

type Tab = 'businesses' | 'users';

export default function SuperAdmin({ onNavigate }: SuperAdminProps) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('businesses');
  const [businesses, setBusinesses] = useState<(Business & { profiles: Pick<Profile, 'full_name' | 'phone'> | null })[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user || profile?.role !== 'super_admin') { onNavigate({ page: 'home' }); return; }
    load();
  }, [user, profile]);

  const load = async () => {
    setLoading(true);
    const [bizs, usrs] = await Promise.all([
      supabase.from('businesses').select('*, profiles(full_name, phone)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ]);
    setBusinesses((bizs.data as any) || []);
    setUsers(usrs.data || []);
    setLoading(false);
  };

  const updateBizStatus = async (id: string, status: 'approved' | 'rejected') => {
    setUpdating(id);
    await supabase.from('businesses').update({ status }).eq('id', id);
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setUpdating(null);
  };

  const filteredBiz = businesses.filter(b => {
    const matchStatus = statusFilter ? b.status === statusFilter : true;
    const matchSearch = search ? b.name.toLowerCase().includes(search.toLowerCase()) || b.city.toLowerCase().includes(search.toLowerCase()) : true;
    return matchStatus && matchSearch;
  });

  const filteredUsers = users.filter(u =>
    search ? u.full_name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const stats = {
    pending: businesses.filter(b => b.status === 'pending').length,
    approved: businesses.filter(b => b.status === 'approved').length,
    rejected: businesses.filter(b => b.status === 'rejected').length,
    totalUsers: users.length,
  };

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <AlertCircle size={20} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Super Admin</h1>
              <p className="text-neutral-500 text-sm">Manage businesses and users platform-wide</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending Review', value: stats.pending, color: 'text-secondary-600', bg: 'bg-secondary-50' },
            { label: 'Approved', value: stats.approved, color: 'text-accent-600', bg: 'bg-accent-50' },
            { label: 'Rejected', value: stats.rejected, color: 'text-error-500', bg: 'bg-error-50' },
            { label: 'Total Users', value: stats.totalUsers, color: 'text-primary-600', bg: 'bg-primary-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-5`}>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-neutral-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-0.5 bg-neutral-100 rounded-xl p-1">
            {(['businesses', 'users'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  tab === t ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {t === 'businesses' ? <><Building2 size={14} className="inline mr-1.5" />Businesses</> : <><Users size={14} className="inline mr-1.5" />Users</>}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${tab}...`}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {tab === 'businesses' && (
            <div className="flex gap-1">
              {[['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === val ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-card p-5 animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : tab === 'businesses' ? (
          <div className="space-y-3">
            {filteredBiz.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-card">
                <Building2 size={24} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">No businesses found.</p>
              </div>
            ) : filteredBiz.map(biz => (
              <div key={biz.id} className="bg-white rounded-xl shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={biz.status === 'approved' ? 'success' : biz.status === 'pending' ? 'warning' : 'error'}>
                      {biz.status}
                    </Badge>
                    {biz.categories_id && <span className="text-xs text-neutral-400">#{biz.id.slice(0, 8)}</span>}
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-0.5">{biz.name}</h3>
                  <p className="text-neutral-500 text-sm">{biz.address}, {biz.city}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Owner: {(biz as any).profiles?.full_name || 'Unknown'} · Submitted {new Date(biz.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate({ page: 'business-detail', businessId: biz.id })}
                    className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye size={16} />
                  </button>
                  {biz.status !== 'approved' && (
                    <Button
                      size="sm"
                      variant="success"
                      loading={updating === biz.id}
                      onClick={() => updateBizStatus(biz.id, 'approved')}
                    >
                      <CheckCircle size={14} /> Approve
                    </Button>
                  )}
                  {biz.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={updating === biz.id}
                      onClick={() => updateBizStatus(biz.id, 'rejected')}
                    >
                      <XCircle size={14} /> Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(u => (
              <div key={u.id} className="bg-white rounded-xl shadow-card p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                  {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-neutral-900">{u.full_name || 'Unnamed User'}</h3>
                  <p className="text-neutral-500 text-sm">{u.phone}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={u.role === 'super_admin' ? 'secondary' : u.role === 'admin' ? 'info' : 'default'}>
                  {u.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
