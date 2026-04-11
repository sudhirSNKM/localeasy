import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface NotificationCounts {
  pendingBookings: number;   // For admin: new bookings awaiting confirmation
  pendingBusinesses: number; // For super_admin: businesses awaiting approval
  total: number;
}

export function useNotifications(): NotificationCounts {
  const { user, profile } = useAuth();
  const [pendingBookings, setPendingBookings] = useState(0);
  const [pendingBusinesses, setPendingBusinesses] = useState(0);

  useEffect(() => {
    if (!user || !profile) return;

    const unsubs: (() => void)[] = [];

    // ── Super Admin: watch pending businesses ─────────────────────────────
    if (profile.role === 'super_admin') {
      const q = query(
        collection(db, 'businesses'),
        where('status', '==', 'pending')
      );
      const unsub = onSnapshot(q, (snap) => {
        setPendingBusinesses(snap.size);
      }, () => setPendingBusinesses(0));
      unsubs.push(unsub);
    }

    // ── Admin: find their business then watch pending bookings ────────────
    if (profile.role === 'admin') {
      const bizQ = query(
        collection(db, 'businesses'),
        where('owner_id', '==', user.uid)
      );

      getDocs(bizQ).then((bizSnap) => {
        if (bizSnap.empty) return;
        const bizId = bizSnap.docs[0].id;

        const bookingQ = query(
          collection(db, 'bookings'),
          where('business_id', '==', bizId),
          where('status', '==', 'pending')
        );

        const unsub = onSnapshot(bookingQ, (snap) => {
          setPendingBookings(snap.size);
        }, () => setPendingBookings(0));

        unsubs.push(unsub);
      }).catch(() => setPendingBookings(0));
    }

    return () => unsubs.forEach(fn => fn());
  }, [user, profile]);

  return {
    pendingBookings,
    pendingBusinesses,
    total: pendingBookings + pendingBusinesses,
  };
}
