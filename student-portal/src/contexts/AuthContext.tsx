import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, StageStatus, ProfessionalProfile } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    curp?: string;
    licenciatura?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfessionalProfile: (profile: ProfessionalProfile) => Promise<void>;
  setLicenciatura: (licenciatura: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const tokenResult = await fbUser.getIdTokenResult();
          setIsAdmin(tokenResult.claims.admin === true);
          const existing = await loadProfile(fbUser.uid);
          setProfile(existing);
        } catch (e) {
          console.error('Error cargando perfil:', e);
          setProfile(null);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; name: string; curp?: string; licenciatura?: string }) => {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await fbUpdateProfile(cred.user, { displayName: data.name });
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        name: data.name,
        email: data.email,
        curp: data.curp ?? '',
        role: UserRole.ALUMNO,
        licenciatura: data.licenciatura ?? '',
        currentStage: 0,
        stageStatus: { '0': StageStatus.IN_PROGRESS },
      };
      await setDoc(doc(db, 'users', cred.user.uid), {
        ...newProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setProfile(newProfile);
    },
    [],
  );

  const logout = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  const updateProfessionalProfile = useCallback(
    async (professionalProfile: ProfessionalProfile) => {
      if (!firebaseUser) return;
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        professionalProfile,
        updatedAt: serverTimestamp(),
      });
      setProfile((prev) => (prev ? { ...prev, professionalProfile } : prev));
    },
    [firebaseUser],
  );

  const setLicenciatura = useCallback(
    async (licenciatura: string) => {
      if (!firebaseUser) return;
      // `licenciatura` se fija en la creación; aquí solo refleja en memoria.
      // (El cambio definitivo lo hace el servidor al inscribirse.)
      setProfile((prev) => (prev ? { ...prev, licenciatura } : prev));
    },
    [firebaseUser],
  );

  const value: AuthContextValue = {
    firebaseUser,
    profile,
    isAdmin,
    loading,
    login,
    register,
    logout,
    updateProfessionalProfile,
    setLicenciatura,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
