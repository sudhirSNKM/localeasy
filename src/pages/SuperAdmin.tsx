import { useEffect, useState } from 'react';
import { Building2, Users, Database, Search, CheckCircle, XCircle, AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import type { Business, Profile, NavState } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

interface SuperAdminProps {
  onNavigate: (state: NavState) => void;
}

type Tab = 'businesses' | 'users' | 'database';

export default function SuperAdmin({ onNavigate }: SuperAdminProps) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('businesses');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    if (profile && profile.role !== 'super_admin') {
      onNavigate({ page: 'home' });
      return;
    }
    if (!user) return;

    setLoading(true);

    // No orderBy to avoid index requirements — sort client-side
    const unsubBiz = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Business));
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBusinesses(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching businesses:', err);
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Profile));
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setUsers(data);
    });

    return () => { unsubBiz(); unsubUsers(); };
  }, [user, profile]);



  const updateBizStatus = async (id: string, status: 'approved' | 'rejected') => {
    setUpdating(id);
    try {
      await updateDoc(doc(db, 'businesses', id), { status });
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const stats = {
    pending: businesses.filter(b => b.status === 'pending').length,
    approved: businesses.filter(b => b.status === 'approved').length,
    rejected: businesses.filter(b => b.status === 'rejected').length,
    totalUsers: users.length,
  };

  const filteredBiz = businesses.filter(b => {
    const matchStatus = statusFilter === 'all' ? true : b.status === statusFilter;
    const matchSearch = search
      ? b.name.toLowerCase().includes(search.toLowerCase()) || b.city.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mt-4 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Console</h1>
            <p className="text-gray-500 text-sm">Real-time management · Logged in as {profile?.full_name}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock size={18} /> },
            { label: 'Live', value: stats.approved, color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle size={18} /> },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-500', bg: 'bg-red-50', icon: <XCircle size={18} /> },
            { label: 'Users', value: stats.totalUsers, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Users size={18} /> },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <div className={`flex items-center gap-2 text-xs font-bold mb-2 uppercase tracking-wider ${stat.color}`}>
                {stat.icon} {stat.label}
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Tab Bar + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 bg-gray-200/50 rounded-xl p-1">
            {(['businesses', 'users'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all flex items-center gap-2 ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t}
                {t === 'businesses' && stats.pending > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${tab}...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
        </div>

        {/* BUSINESSES TAB */}
        {tab === 'businesses' && (
          <div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {['pending', 'approved', 'rejected', 'all'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    statusFilter === s
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s} ({s === 'all' ? businesses.length : businesses.filter(b => b.status === s).length})
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent animate-spin rounded-full mb-4" />
                <p className="text-gray-500 text-sm animate-pulse">Loading real-time data...</p>
              </div>
            ) : filteredBiz.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Building2 size={32} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-1">No businesses</h3>
                <p className="text-gray-400 text-sm">
                  {statusFilter === 'pending' ? 'No pending businesses to review.' : 'Try changing the status filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBiz.map(biz => (
                  <div key={biz.id} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-5 border border-gray-100 hover:border-blue-100 transition-colors">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        src={biz.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(biz.name)}&background=3b82f6&color=fff`}
                        className="w-full h-full object-cover"
                        alt={biz.name}
                        onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(biz.name)}&background=3b82f6&color=fff`; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900">{biz.name}</h3>
                        <Badge variant={biz.status === 'approved' ? 'success' : biz.status === 'rejected' ? 'error' : 'warning'}>
                          {biz.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>📍 {biz.city}</span>
                        <span>👤 Owner: {biz.owner_id.substring(0, 10)}...</span>
                        <span>⭐ {biz.rating}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-lg">{biz.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {biz.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => updateBizStatus(biz.id, 'approved')} loading={updating === biz.id}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => updateBizStatus(biz.id, 'rejected')} loading={updating === biz.id}>Reject</Button>
                        </>
                      )}
                      {biz.status === 'approved' && (
                        <Button size="sm" variant="danger" onClick={() => updateBizStatus(biz.id, 'rejected')} loading={updating === biz.id}>Revoke</Button>
                      )}
                      {biz.status === 'rejected' && (
                        <Button size="sm" onClick={() => updateBizStatus(biz.id, 'approved')} loading={updating === biz.id}>Re-approve</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="space-y-3">
            {users.filter(u => search ? u.full_name.toLowerCase().includes(search.toLowerCase()) : true).map(u => (
              <div key={u.id} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 border border-gray-100">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                  {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{u.full_name}</div>
                  <div className="text-xs text-gray-400">ID: {u.id.substring(0, 16)}...</div>
                </div>
                <Badge variant={u.role === 'super_admin' ? 'accent' : u.role === 'admin' ? 'info' : 'default'}>
                  {u.role}
                </Badge>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Users size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No registered users yet.</p>
              </div>
            )}
          </div>
        )}



      </div>
    </div>
  );
}
