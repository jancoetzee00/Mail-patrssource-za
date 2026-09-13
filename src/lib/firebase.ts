import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Email, CRMLead, EmailTemplate, EmailSignature, AutoResponseRule } from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with the exact database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Test Firestore Connection on Boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection test: client is currently offline.');
    }
  }
}
testConnection();

// Structured Firestore Error Handling
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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User-scoped Database Helpers
export const syncEmailToFirestore = async (userId: string, email: Email) => {
  const path = `users/${userId}/emails/${email.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'emails', email.id);
    await setDoc(
      docRef,
      {
        id: email.id,
        threadId: email.threadId,
        accountId: email.accountId,
        from: email.from,
        to: email.to,
        cc: email.cc || [],
        subject: email.subject || '(No Subject)',
        body: email.body || '',
        previewText: email.previewText || '',
        timestamp: email.timestamp,
        folder: email.folder,
        isRead: email.isRead,
        isStarred: email.isStarred,
        tags: email.tags || [],
        isEncrypted: email.isEncrypted || false,
        syncStatus: 'synced',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const deleteEmailFromFirestore = async (userId: string, emailId: string) => {
  const path = `users/${userId}/emails/${emailId}`;
  try {
    const docRef = doc(db, 'users', userId, 'emails', emailId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

export const syncLeadToFirestore = async (userId: string, lead: CRMLead) => {
  const path = `users/${userId}/crm_leads/${lead.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'crm_leads', lead.id);
    await setDoc(docRef, lead, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const deleteLeadFromFirestore = async (userId: string, leadId: string) => {
  const path = `users/${userId}/crm_leads/${leadId}`;
  try {
    const docRef = doc(db, 'users', userId, 'crm_leads', leadId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

export const syncTemplateToFirestore = async (userId: string, template: EmailTemplate) => {
  const path = `users/${userId}/templates/${template.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'templates', template.id);
    await setDoc(docRef, template, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const syncSignatureToFirestore = async (userId: string, signature: EmailSignature) => {
  const path = `users/${userId}/signatures/${signature.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'signatures', signature.id);
    await setDoc(docRef, signature, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const syncRuleToFirestore = async (userId: string, rule: AutoResponseRule) => {
  const path = `users/${userId}/auto_rules/${rule.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'auto_rules', rule.id);
    await setDoc(docRef, rule, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const subscribeFirestoreEmails = (
  userId: string,
  onUpdate: (emails: Email[]) => void,
  onError?: (err: Error) => void
) => {
  const path = `users/${userId}/emails`;
  try {
    const colRef = collection(db, 'users', userId, 'emails');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const loaded: Email[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as Email);
        });
        onUpdate(loaded);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const subscribeFirestoreLeads = (
  userId: string,
  onUpdate: (leads: CRMLead[]) => void,
  onError?: (err: Error) => void
) => {
  const path = `users/${userId}/crm_leads`;
  try {
    const colRef = collection(db, 'users', userId, 'crm_leads');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const loaded: CRMLead[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as CRMLead);
        });
        onUpdate(loaded);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};
