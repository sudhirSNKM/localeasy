import { useState } from 'react';
import { User, Phone, Save, X, CheckCircle, Building2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { NavState } from '../lib/types';
import Button from '../components/ui/Button';

interface ProfilePageProps {
  onNavigate: (state: NavState) => void;
  onClose?: () => void;
}

const AVATAR_EMOJIS = [
  '😊','😎','🧑','👩','👨','🧔','👱','🧕','👩‍💼','👨‍💼',
  '🧑‍⚕️','👩‍⚕️','👨‍🍳','👩‍🍳','🧑‍🔧','👷','💂','🧑‍🎨','🦸','🦹',
  '🐱','🐶','🦊','🐼','🐨','🦁','🐯','🐸','🐧','🦋',
];

export default function ProfilePage({ onNavigate, onClose }: ProfilePageProps) {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [selectedEmoji, setSelectedEmoji] = useState(profile?.avatar_url || '😊');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#3A6FF8] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-[#6B7280] animate-pulse text-center">Synchronizing Profile...</p>
      </div>
    );
  }

  if (!user) {
    onNavigate({ page: 'auth' });
    return null;
  }

  if (!profile) return (
    <div className="min-h-screen pt-32 flex flex-col items-center p-8 text-center">
       <p className="text-sm font-bold text-[#6B7280]">Connecting to secure storage...</p>
    </div>
  );

  const isProfileComplete = fullName.trim().length >= 2 && phone.trim().length >= 10;

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Please enter your full name'); return; }
    if (phone.trim().length < 10) { setError('Please enter a valid phone number (10+ digits)'); return; }

    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        full_name: fullName.trim(),
        phone: phone.trim(),
        avatar_url: selectedEmoji,
        updated_at: serverTimestamp()
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        if (onClose) onClose();
        else onNavigate({ page: profile.role === 'admin' ? 'admin-dashboard' : 'user-dashboard' });
      }, 1200);
    } catch (err: any) {
      setError('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-28 pb-10">
      <div className="max-w-xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {profile.role === 'admin' ? 'Complete your profile to list a business' : 'Complete your profile to book services'}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Profile completion banner */}
        {!isProfileComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <span className="text-2xl mt-0.5">⚠️</span>
            <div>
              <div className="font-bold text-amber-800 text-sm">Profile incomplete</div>
              <div className="text-amber-700 text-xs mt-0.5">
                {profile.role === 'admin'
                  ? 'You need to complete your profile before you can list your business.'
                  : 'Please add your name and phone number before booking a service.'}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Avatar Section */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-8 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-5xl shadow-lg">
              {selectedEmoji}
            </div>
            <div className="text-white font-bold text-lg">{fullName || 'Your Name'}</div>
            <div className="text-blue-200 text-xs mt-1 capitalize">
              {profile.role === 'super_admin' ? '⚡ Super Admin' : profile.role === 'admin' ? '🏢 Business Owner' : '👤 Customer'}
            </div>
          </div>

          {/* Emoji Picker */}
          <div className="p-6 border-b border-[#E6EAF0]">
            <label className="block text-[10px] font-black text-[#9AA4B2] uppercase tracking-widest mb-4">Choose Avatar</label>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-3">
              {AVATAR_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-10 h-10 flex items-center justify-center text-2xl transition-all hover:scale-110 rounded-full ${
                    selectedEmoji === emoji 
                      ? 'bg-[#3A6FF8] text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50' 
                      : 'hover:bg-[#F2F4F7]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  type="tel"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 9876543210"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Required for booking confirmations</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Account Type</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {profile.role === 'admin' ? <Building2 size={16} className="text-blue-600" /> : <User size={16} className="text-green-600" />}
                <span className="text-sm font-semibold text-gray-700 capitalize">
                  {profile.role === 'admin' ? 'Business Owner' : profile.role === 'super_admin' ? 'Super Admin' : 'Customer'}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <Button onClick={handleSave} loading={saving} fullWidth size="lg">
              {saved ? (
                <><CheckCircle size={16} /> Saved!</>
              ) : (
                <><Save size={16} /> Save Profile</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
