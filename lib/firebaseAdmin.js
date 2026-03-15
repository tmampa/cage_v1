import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount);
      // Only use cert() if the key looks like a real service account
      if (parsed.private_key && parsed.private_key.startsWith('-----BEGIN')) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        return initializeApp({ credential: cert(parsed) });
      }
    } catch (e) {
      console.warn('Invalid FIREBASE_SERVICE_ACCOUNT_KEY, falling back to project ID:', e.message);
    }
  }

  // Fall back to project ID
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
