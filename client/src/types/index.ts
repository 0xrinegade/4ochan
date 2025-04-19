export interface Thread {
  id: string;
  boardId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: number; // Unix timestamp
  lastReplyTime?: number;
  replyCount: number;
  images?: string[];
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