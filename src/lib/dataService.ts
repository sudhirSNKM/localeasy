import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { BusinessWithCategory, Category, Promotion } from './types';

export const dataService = {
  async getCategories(): Promise<Category[]> {
    const snapshot = await getDocs(collection(db, 'categories'));
    const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    // Client-side sort to avoid needing a Firestore index
    cats.sort((a, b) => a.name.localeCompare(b.name));
    return cats;
  },

  async getFeaturedBusinesses(): Promise<BusinessWithCategory[]> {
    try {
      // Only filter by status — no orderBy so no composite index needed
      const q = query(collection(db, 'businesses'), where('status', '==', 'approved'));
      const snapshot = await getDocs(q);
      const businesses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessWithCategory));
      // Client-side sort by rating descending, take top 8
      businesses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      return businesses.slice(0, 8);
    } catch (err) {
      console.error('Error fetching featured businesses:', err);
      return [];
    }
  },

  async getPromotions(): Promise<Promotion[]> {
    try {
      // Only filter by status — no orderBy
      const q = query(collection(db, 'promotions'), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion)).slice(0, 6);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      return [];
    }
  },

  async getBusinessById(id: string): Promise<BusinessWithCategory | null> {
    try {
      const docRef = doc(db, 'businesses', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as BusinessWithCategory) : null;
    } catch (err) {
      console.error('Error fetching business:', err);
      return null;
    }
  }
};
