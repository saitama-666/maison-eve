'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { firebaseReady, getDb, getFirebaseAuth, requireAuth, requireDb } from '@/lib/firebase/client';

// =====================================================================
//  Session cliente.
//
//  Un seul contexte pour : qui est connecté, son profil Firestore, et
//  s'il est administrateur.
//
//  ⚠️  PIÈGE DÉJÀ RENCONTRÉ SUR L'AUTRE PROJET, à ne pas réintroduire :
//      `chargementDroits` ne repasse à `true` qu'à la PREMIÈRE
//      vérification. Si on le remettait à `true` à chaque changement
//      d'identité de `user`, chaque rotation de jeton (toutes les heures,
//      et à chaque appel de `getIdToken()`) reviderait l'écran derrière un
//      voile de chargement. C'est le bug qui faisait clignoter le
//      back-office.
// =====================================================================

export type Profil = {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  birthday?: string;
  marketingOptIn?: boolean;
};

type Contexte = {
  /** `null` = déconnecté. `undefined` n'existe pas ici : voir `chargement`. */
  user: User | null;
  profil: Profil | null;
  isAdmin: boolean;
  /** Vrai tant que Firebase n'a pas dit qui est connecté. */
  chargement: boolean;
  /** Vrai tant que le rôle admin n'a pas été vérifié, la PREMIÈRE fois. */
  chargementDroits: boolean;
  /** Firebase est-il configuré ? Faux = mode vitrine seule. */
  disponible: boolean;

  inscription: (email: string, motDePasse: string, prenom: string, nom: string) => Promise<User>;
  connexion: (email: string, motDePasse: string) => Promise<User>;
  connexionGoogle: () => Promise<User>;
  deconnexion: () => Promise<void>;
  reinitialiser: (email: string) => Promise<void>;
  majProfil: (donnees: Partial<Profil>) => Promise<void>;
  majMotDePasse: (nouveau: string) => Promise<void>;
  renvoyerVerification: () => Promise<void>;
  /** Jeton d'identité pour appeler les routes `/api`. */
  jeton: () => Promise<string | null>;
};

const AuthContext = createContext<Contexte | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [chargementDroits, setChargementDroits] = useState(true);

  /** Garde-fou du piège décrit en tête de fichier. */
  const droitsDejaVerifies = useRef(false);

  // --- Qui est connecté ------------------------------------------------
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      // Firebase absent : on sort des états de chargement, sinon toute
      // l'interface reste bloquée sur un écran d'attente qui ne finira
      // jamais.
      setChargement(false);
      setChargementDroits(false);
      return;
    }

    const stop = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChargement(false);
      if (!u) {
        setProfil(null);
        setIsAdmin(false);
        setChargementDroits(false);
        droitsDejaVerifies.current = false;
      }
    });

    return stop;
  }, []);

  // --- Rôle administrateur ---------------------------------------------
  // On écoute `onIdTokenChanged` et non `onAuthStateChanged` : le claim
  // `admin` arrive dans le JETON, et un jeton fraîchement émis peut le
  // porter alors que l'état d'authentification n'a pas bougé.
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const stop = onIdTokenChanged(auth, async (u) => {
      if (!u) {
        setIsAdmin(false);
        setChargementDroits(false);
        return;
      }

      if (!droitsDejaVerifies.current) setChargementDroits(true);

      try {
        const res = await u.getIdTokenResult();
        setIsAdmin(res.claims.admin === true);
      } catch {
        setIsAdmin(false);
      } finally {
        droitsDejaVerifies.current = true;
        setChargementDroits(false);
      }
    });

    return stop;
  }, []);

  // --- Profil Firestore -------------------------------------------------
  useEffect(() => {
    const db = getDb();
    if (!user || !db) {
      setProfil(null);
      return;
    }

    let annule = false;

    void (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (annule) return;
        setProfil(
          snap.exists()
            ? ({ ...(snap.data() as Profil), email: user.email ?? '' } as Profil)
            : { email: user.email ?? '' },
        );
      } catch {
        // Le profil est un confort, pas une condition d'usage : en cas
        // d'échec on retombe sur l'e-mail du compte Auth.
        if (!annule) setProfil({ email: user.email ?? '' });
      }
    })();

    return () => {
      annule = true;
    };
  }, [user]);

  // --- Actions ----------------------------------------------------------

  const inscription = useCallback(
    async (email: string, motDePasse: string, prenom: string, nom: string) => {
      const auth = requireAuth();
      const db = requireDb();

      const cred = await createUserWithEmailAndPassword(auth, email, motDePasse);

      const nomComplet = `${prenom} ${nom}`.trim();
      if (nomComplet) {
        await updateProfile(cred.user, { displayName: nomComplet });
      }

      // Le document profil est créé ici. Les règles Firestore imposent que
      // `email` soit exactement celui du compte, et que `createdAt` soit
      // l'heure du SERVEUR : un client ne peut ni usurper une adresse ni
      // antidater son inscription.
      await setDoc(doc(db, 'users', cred.user.uid), {
        firstName: prenom.trim(),
        lastName: nom.trim(),
        email: cred.user.email,
        marketingOptIn: false,
        createdAt: serverTimestamp(),
      });

      // Envoi non bloquant : un e-mail de vérification qui n'arrive pas ne
      // doit pas faire échouer une inscription par ailleurs réussie.
      void sendEmailVerification(cred.user).catch(() => {});

      return cred.user;
    },
    [],
  );

  const connexion = useCallback(async (email: string, motDePasse: string) => {
    const auth = requireAuth();
    const cred = await signInWithEmailAndPassword(auth, email, motDePasse);
    return cred.user;
  }, []);

  const connexionGoogle = useCallback(async () => {
    const auth = requireAuth();
    const db = requireDb();

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const cred = await signInWithPopup(auth, provider);

    // Première connexion Google : on crée le profil s'il n'existe pas.
    const ref = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const [prenom = '', ...reste] = (cred.user.displayName ?? '').split(' ');
      await setDoc(ref, {
        firstName: prenom,
        lastName: reste.join(' '),
        email: cred.user.email,
        marketingOptIn: false,
        createdAt: serverTimestamp(),
      });
    }

    return cred.user;
  }, []);

  const deconnexion = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
  }, []);

  const reinitialiser = useCallback(async (email: string) => {
    const auth = requireAuth();
    await sendPasswordResetEmail(auth, email);
  }, []);

  const majProfil = useCallback(
    async (donnees: Partial<Profil>) => {
      if (!user) throw new Error('Connectez-vous pour modifier votre profil.');
      const db = requireDb();

      // `email` est volontairement exclu : les règles interdisent de le
      // changer ici, il suit le compte Auth.
      const { email: _ignore, ...modifiable } = donnees;
      void _ignore;

      await setDoc(
        doc(db, 'users', user.uid),
        { ...modifiable, updatedAt: serverTimestamp() },
        { merge: true },
      );

      const nomComplet = `${donnees.firstName ?? profil?.firstName ?? ''} ${
        donnees.lastName ?? profil?.lastName ?? ''
      }`.trim();
      if (nomComplet && nomComplet !== user.displayName) {
        await updateProfile(user, { displayName: nomComplet });
      }

      setProfil((p) => ({ ...(p ?? { email: user.email ?? '' }), ...modifiable }));
    },
    [user, profil],
  );

  const majMotDePasse = useCallback(
    async (nouveau: string) => {
      if (!user) throw new Error('Connectez-vous pour changer votre mot de passe.');
      await updatePassword(user, nouveau);
    },
    [user],
  );

  const renvoyerVerification = useCallback(async () => {
    if (!user) throw new Error('Connectez-vous d’abord.');
    await sendEmailVerification(user);
  }, [user]);

  const jeton = useCallback(async () => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }, [user]);

  const valeur = useMemo<Contexte>(
    () => ({
      user,
      profil,
      isAdmin,
      chargement,
      chargementDroits,
      disponible: firebaseReady,
      inscription,
      connexion,
      connexionGoogle,
      deconnexion,
      reinitialiser,
      majProfil,
      majMotDePasse,
      renvoyerVerification,
      jeton,
    }),
    [
      user,
      profil,
      isAdmin,
      chargement,
      chargementDroits,
      inscription,
      connexion,
      connexionGoogle,
      deconnexion,
      reinitialiser,
      majProfil,
      majMotDePasse,
      renvoyerVerification,
      jeton,
    ],
  );

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth(): Contexte {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>.');
  }
  return ctx;
}
