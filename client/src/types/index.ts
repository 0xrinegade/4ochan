export interface Thread {
  id: string;
  boardId: string;
  title: string;
  content: string;
  createdBy?: string;  // Legacy field, can be optional if authorPubkey is used
  authorPubkey?: string; // Author's pubkey for Nostr
  createdAt: number; // Unix timestamp
  lastReplyTime?: number;
  replyCount: number;
  images?: string[];
  media?: MediaContent[]; // Media content attached to the thread
  nsfw?: boolean;
  tags?: string[];
  locked?: boolean;
  pinned?: boolean;
}

export interface Board {
  id: string;
  shortName: string;
  name: string;
  description: string;
  icon?: string;
  createdAt: number;
  threadCount: number;
  lastActive?: number;
  color?: string;
}

export interface Reply {
  id: string;
  threadId: string;
  content: string;
  createdBy: string;
  createdAt: number;
  images?: string[];
}

export interface MediaContent {
  id: string;
  url: string;
  type: 'image' | 'video' | 'file';
  name: string;
  size?: number;
}

export interface MediaUpload extends MediaContent {
  progress: number;
  error?: string;
  status: 'uploading' | 'error' | 'success' | 'pending';
}

export interface Relay {
  url: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  read: boolean;
  write: boolean;
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

export interface NostrIdentity {
  pubkey: string;
  privkey?: string;
  relays?: string[];
  profile?: NostrProfile;
}

export interface NostrProfile {
  pubkey: string;
  name?: string;
  displayName?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  lud16?: string;
}

export interface ThreadSubscription {
  id: string;
  userId: string;
  threadId: string;
  title?: string;
  createdAt: number;
  notifyOnReplies: boolean;
  notifyOnMentions: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  recipientPubkey?: string; // Pubkey of the notification recipient
  title: string;
  message: string;
  type: 'mention' | 'reply' | 'system' | 'like';
  threadId?: string;
  postId?: string;
  createdAt: number;
  read: boolean;
  readAt?: number; // When the notification was read
  createdBy?: string;
}

export interface Post {
  id: string;
  threadId: string;
  replyToId?: string;
  content: string;
  authorPubkey: string;
  createdAt: number;
  images?: string[];
  media?: MediaContent[];
  references?: string[]; // References to other posts/events
  likes?: number; // Count of likes for this post
  likedByUser?: boolean; // Whether the current user has liked this post
}