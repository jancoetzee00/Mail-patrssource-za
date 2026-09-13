import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { Email, EmailFolder, EmailRecipient } from '../types';

// Configure Google Provider with requested Gmail scopes
export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.labels',
];

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// In-Memory Token Caching (Strict compliance: NEVER store in localStorage)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let isSigningIn = false;

/**
 * Initialize auth listener on app startup
 */
export const initGmailAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is logged into Firebase, but OAuth access token needs a fresh interactive prompt or cache
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Connect to Gmail via popup with Gmail scopes
 */
export const signInWithGmail = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No OAuth access token returned from Google authentication');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Gmail Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Disconnect Gmail and clear in-memory token cache
 */
export const signOutGmail = async () => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
    cachedUser = null;
  }
};

/**
 * Retrieve cached OAuth access token in-memory
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Check if active in-memory token exists
 */
export const hasActiveGmailToken = (): boolean => {
  return !!cachedAccessToken;
};

export const getCurrentGmailUser = (): User | null => {
  return cachedUser;
};

// --- Helpers to parse and encode RFC 2822 Emails ---

function parseEmailRecipient(headerVal: string): EmailRecipient {
  if (!headerVal) return { name: 'Unknown', email: '' };
  const match = headerVal.match(/(.*?)\s*<(.+?)>/);
  if (match) {
    return {
      name: match[1].replace(/^["']|["']$/g, '').trim() || match[2].split('@')[0],
      email: match[2].trim(),
    };
  }
  return {
    name: headerVal.split('@')[0].trim(),
    email: headerVal.trim(),
  };
}

function parseMultipleRecipients(headerVal: string): EmailRecipient[] {
  if (!headerVal) return [];
  const parts = headerVal.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
  return parts.map(parseEmailRecipient).filter((r) => !!r.email);
}

function decodeBase64Url(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}

function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    // Look for HTML part first
    const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      return decodeBase64Url(htmlPart.body.data);
    }
    // Fall back to plain text
    const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }
    // Recursive search for multipart nested containers
    for (const part of payload.parts) {
      if (part.parts) {
        const nestedBody = extractBodyFromPayload(part);
        if (nestedBody) return nestedBody;
      }
    }
  }

  return '';
}

function encodeBase64UrlUtf8(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Fetch real messages from Gmail API for the authenticated user
 */
export const fetchGmailEmails = async (
  accountId: string,
  maxResults = 30
): Promise<Email[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Gmail is not connected or session token has expired. Please sign in with Google.');
  }

  // 1. List messages
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    const errJson = await listRes.json().catch(() => ({}));
    throw new Error(
      `Gmail API returned ${listRes.status}: ${errJson.error?.message || listRes.statusText}`
    );
  }

  const listData = await listRes.json();
  const messageSummaries: { id: string; threadId: string }[] = listData.messages || [];

  if (messageSummaries.length === 0) {
    return [];
  }

  // 2. Fetch full details for the retrieved messages (in parallel batches)
  const detailPromises = messageSummaries.slice(0, 25).map(async (msg) => {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!msgRes.ok) return null;
      return await msgRes.json();
    } catch {
      return null;
    }
  });

  const fullMessages = (await Promise.all(detailPromises)).filter(Boolean);

  // 3. Map into the application's Email model
  return fullMessages.map((msgItem: any): Email => {
    const headers: { name: string; value: string }[] = msgItem.payload?.headers || [];
    const getHeader = (name: string): string => {
      const h = headers.find((item) => item.name.toLowerCase() === name.toLowerCase());
      return h ? h.value : '';
    };

    const fromVal = getHeader('From');
    const toVal = getHeader('To');
    const ccVal = getHeader('Cc');
    const subjectVal = getHeader('Subject') || '(No Subject)';
    const dateVal = getHeader('Date');

    const labelIds: string[] = msgItem.labelIds || [];

    let folder: EmailFolder = 'inbox';
    if (labelIds.includes('TRASH')) {
      folder = 'trash';
    } else if (labelIds.includes('SENT')) {
      folder = 'sent';
    } else if (labelIds.includes('DRAFT')) {
      folder = 'drafts';
    } else if (labelIds.includes('SPAM')) {
      folder = 'trash';
    } else if (!labelIds.includes('INBOX')) {
      folder = 'archive';
    }

    const isStarred = labelIds.includes('STARRED');
    const isRead = !labelIds.includes('UNREAD');

    const rawBody = extractBodyFromPayload(msgItem.payload);
    const snippet = msgItem.snippet || rawBody.substring(0, 160).replace(/<[^>]*>/g, '');

    const parsedDate = dateVal ? new Date(dateVal) : new Date(Number(msgItem.internalDate));
    const timestamp = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

    return {
      id: msgItem.id,
      threadId: msgItem.threadId || msgItem.id,
      accountId: accountId,
      from: parseEmailRecipient(fromVal),
      to: parseMultipleRecipients(toVal),
      cc: ccVal ? parseMultipleRecipients(ccVal) : undefined,
      subject: subjectVal,
      body: rawBody || snippet || '(Empty message content)',
      previewText: snippet,
      timestamp: timestamp,
      folder: folder,
      isRead: isRead,
      isStarred: isStarred,
      tags: labelIds.filter((l) => !['INBOX', 'UNREAD', 'STARRED', 'SENT', 'DRAFT', 'IMPORTANT', 'CATEGORY_PERSONAL'].includes(l)),
      syncStatus: 'synced',
    };
  });
};

/**
 * Send an email using the real Gmail API (RFC 2822)
 */
export const sendGmailEmail = async ({
  fromEmail,
  fromName,
  to,
  cc,
  subject,
  htmlBody,
}: {
  fromEmail: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  subject: string;
  htmlBody: string;
}): Promise<{ id: string; threadId: string }> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Gmail access token is missing. Please connect with Google first.');
  }

  const senderHeader = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

  // Build standard RFC 2822 email payload
  const emailLines: string[] = [
    `From: ${senderHeader}`,
    `To: ${to.join(', ')}`,
  ];

  if (cc && cc.length > 0) {
    emailLines.push(`Cc: ${cc.join(', ')}`);
  }

  // UTF-8 subject encoding
  const encodedSubject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  emailLines.push(`Subject: ${encodedSubject}`);
  emailLines.push('MIME-Version: 1.0');
  emailLines.push('Content-Type: text/html; charset=UTF-8');
  emailLines.push('Content-Transfer-Encoding: 7bit');
  emailLines.push('');
  emailLines.push(htmlBody);

  const rawRfc2822 = emailLines.join('\r\n');
  const base64UrlRaw = encodeBase64UrlUtf8(rawRfc2822);

  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64UrlRaw }),
  });

  if (!sendRes.ok) {
    const err = await sendRes.json().catch(() => ({}));
    throw new Error(`Failed to send email via Gmail API: ${err.error?.message || sendRes.statusText}`);
  }

  return await sendRes.json();
};

/**
 * Trash an email in Gmail
 */
export const trashGmailEmail = async (messageId: string): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) return false;

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
};

/**
 * Star or unstar an email in Gmail
 */
export const setGmailStarred = async (messageId: string, isStarred: boolean): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) return false;

  const body = isStarred
    ? { addLabelIds: ['STARRED'] }
    : { removeLabelIds: ['STARRED'] };

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
};

/**
 * Mark an email as read or unread in Gmail
 */
export const setGmailReadStatus = async (messageId: string, isRead: boolean): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) return false;

  const body = isRead
    ? { removeLabelIds: ['UNREAD'] }
    : { addLabelIds: ['UNREAD'] };

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
};
