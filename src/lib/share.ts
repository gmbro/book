export type ShareKind = 'poll' | 'book-poll' | 'meeting' | 'discussion' | 'review';

export interface ParsedDiscussionContent {
  body: string;
  externalUrl: string;
}

export const parseDiscussionContent = (content: string): ParsedDiscussionContent => {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.kind === 'discussion-v1') {
      return {
        body: String(parsed.body || ''),
        externalUrl: String(parsed.externalUrl || ''),
      };
    }
  } catch {
    // Legacy discussions were stored as plain text.
  }
  return { body: content, externalUrl: '' };
};

export const encodeDiscussionContent = (body: string, externalUrl: string) => {
  if (!externalUrl) return body;
  return JSON.stringify({ kind: 'discussion-v1', body, externalUrl });
};

export const normalizeExternalUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
};

export const isNotionUrl = (value: string) => {
  const normalized = normalizeExternalUrl(value);
  if (!normalized) return false;
  try {
    const host = new URL(normalized).hostname.toLowerCase();
    return host === 'notion.so'
      || host.endsWith('.notion.so')
      || host === 'notion.site'
      || host.endsWith('.notion.site');
  } catch {
    return false;
  }
};

export const makeSharePath = (kind: ShareKind, id: string) => `/share/${kind}/${id}`;

export const makeShareUrl = (kind: ShareKind, id: string, origin?: string) => {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${makeSharePath(kind, id)}`;
};

export const shareOrCopy = async (payload: { title: string; text: string; url: string }) => {
  const text = `${payload.text}\n\n${payload.url}`;
  if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
    return 'shared';
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }
  return 'unsupported';
};
