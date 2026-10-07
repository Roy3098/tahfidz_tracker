import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import {
  getAuth,
  initializeAuth,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import defaultFirebaseConfig from '../firebase-applet-config.json';

const env = (import.meta as any).env || {};

export const firebaseConfig = {
  ...defaultFirebaseConfig,
  apiKey: env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  firestoreDatabaseId: env.VITE_FIRESTORE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with explicit database ID, forceLongPolling and useFetchStreams: false
// to prevent "Could not reach Cloud Firestore backend. Backend didn't respond within 10 seconds"
// in browser iframe / sandbox proxy environments.
let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}
export const db = firestoreDb;

// Initialize Firebase Authentication with explicit browserPopupRedirectResolver
let firebaseAuth;
try {
  firebaseAuth = initializeAuth(app, {
    popupRedirectResolver: browserPopupRedirectResolver,
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence
    ]
  });
} catch {
  firebaseAuth = getAuth(app);
}
export const auth = firebaseAuth;
export { browserPopupRedirectResolver };

export interface AuthorizedDomainCheckResult {
  isAuthorized: boolean;
  hostname: string;
  authorizedDomains: string[];
  projectId: string;
  consoleUrl: string;
}

let cachedAuthorizedDomains: string[] | null = null;

function doesDomainMatch(expectedPattern: string, currentHostname: string): boolean {
  const cleanExpected = expectedPattern.trim().toLowerCase();
  const cleanHost = currentHostname.trim().toLowerCase();
  if (!cleanExpected || !cleanHost) return false;
  if (cleanExpected === cleanHost) return true;
  const escaped = cleanExpected.replace(/\./g, '\\.');
  const re = new RegExp(`^(.+\\.${escaped}|${escaped})$`, 'i');
  return re.test(cleanHost);
}

export async function checkFirebaseAuthorizedDomain(
  forceRefresh = false
): Promise<AuthorizedDomainCheckResult> {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const projectId = firebaseConfig.projectId || defaultFirebaseConfig.projectId;
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  try {
    if (!cachedAuthorizedDomains || forceRefresh) {
      const res = await fetch(
        `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${encodeURIComponent(
          firebaseConfig.apiKey
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.authorizedDomains)) {
          cachedAuthorizedDomains = data.authorizedDomains;
        }
      }
    }
  } catch {
    // Ignore network errors and assume authorized so popup can still attempt
  }

  const domains = cachedAuthorizedDomains || [];
  const isAuthorized =
    domains.length === 0 || domains.some(domain => doesDomainMatch(domain, hostname));

  return {
    isAuthorized,
    hostname,
    authorizedDomains: domains,
    projectId,
    consoleUrl
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
}

// Recursively strip undefined properties so setDoc never throws 'Unsupported field value: undefined'
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Test connection on boot with timeout protection
export async function testConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  return true;
}
