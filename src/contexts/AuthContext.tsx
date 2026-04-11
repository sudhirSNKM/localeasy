import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { Profile } from '../lib/types';

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: 'user' | 'admin') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SUPER_ADMIN_EMAIL = 'superadmin@localeasy.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, firebaseUser: FirebaseUser) => {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Profile;
        
        // Fix: if the super admin email matches, ensure their role is correct
        if (firebaseUser.email === SUPER_ADMIN_EMAIL && data.role !== 'super_admin') {
          await updateDoc(docRef, { role: 'super_admin' });
          setProfile({ ...data, role: 'super_admin' });
        } else {
          setProfile(data);
        }
      } else {
        // No profile exists — create one with correct default role
        // Only the specific super admin email gets super_admin role
        const correctRole = firebaseUser.email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user';
        
        const defaultProfile: Profile = {
          id: userId,
          full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: correctRole,
          phone: '',
          avatar_url: '',
          created_at: new Date().toISOString()
        };
        await setDoc(docRef, { ...defaultProfile, created_at: serverTimestamp() });
        setProfile(defaultProfile);
      }
    } catch (err) {
      console.error('Error fetching/creating profile:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid, user);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid, firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (err: any) {
      let message = 'Failed to sign in';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      }
      return { error: message };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'user' | 'admin') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Ensure super admin email always gets super_admin role
      const finalRole = email === SUPER_ADMIN_EMAIL ? 'super_admin' : role;

      const profileData: Profile = {
        id: newUser.uid,
        full_name: fullName,
        phone: '',
        role: finalRole as any,
        avatar_url: '',
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'profiles', newUser.uid), {
        ...profileData,
        created_at: serverTimestamp()
      });

      setProfile(profileData);
      return { error: null };
    } catch (err: any) {
      let message = 'Failed to sign up';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      }
      return { error: message };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
