// Nostr-related types
export interface Relay {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  write?: boolean;
  read?: boolean;
}

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface NostrProfile {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
}

export interface NostrIdentity {
  pubkey: string;
  privkey?: Uint8Array | string;
  profile?: NostrProfile;
}

// Application-specific types
export interface Board {
  id: string;
  shortName: string;
  name: string;
  description: string;
  threadCount: number;
}

export interface MediaContent {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  name: string;
  size?: number;
}

export interface Thread {
  id: string;
  boardId: string;
  title?: string;
  content: string;
  media?: MediaContent[];
  images?: string[]; // Legacy support
  authorPubkey: string;
  createdAt: number;
  replyCount: number;
  lastReplyTime?: number;
}

export interface Post {
  id: string;
  threadId: string;
  content: string;
  media?: MediaContent[];
  images?: string[]; // Legacy support
  authorPubkey: string;
  createdAt: number;
  references?: string[]; // Array of post IDs this post is replying to
}

export interface MediaUpload {
  file: File;
  data: string;
  url?: string;
  mediaContent?: MediaContent;
  loading: boolean;
  error?: string;
}

export interface ImageUpload {
  data: string;
  url?: string;
  loading: boolean;
  error?: string;
}
