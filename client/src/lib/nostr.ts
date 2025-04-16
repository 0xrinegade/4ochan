import {
  SimplePool,
  getEventHash,
  getPublicKey,
  nip19,
  generateSecretKey,
  finalizeEvent,
} from "nostr-tools";
import { NostrEvent, NostrIdentity, Relay, NostrProfile } from "../types";

// Default relays to connect to
export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.info",
  "wss://nostr.wine",
  "wss://nos.lol",
];

// Kind numbers for our custom event types
export const KIND = {
  METADATA: 0,
  TEXT_NOTE: 1,
  BOARD_DEFINITION: 9901, // Custom kind for board definition
  THREAD: 9902, // Custom kind for thread
  POST: 9903, // Custom kind for post within a thread
  SUBSCRIPTION: 9904, // Custom kind for thread subscription
  NOTIFICATION: 9905, // Custom kind for user notification
};

// Create an event pool for managing relay connections
export const createPool = (relays: string[] = DEFAULT_RELAYS) => {
  const pool = new SimplePool();
  return pool;
};

// Generate a new identity or load from localStorage
export const getOrCreateIdentity = (): NostrIdentity => {
  const savedIdentity = localStorage.getItem("nostr-identity");

  if (savedIdentity) {
    try {
      // The saved identity might have the private key as a hex string
      const parsed = JSON.parse(savedIdentity);
      return parsed;
    } catch (error) {
      console.error("Failed to parse saved identity", error);
    }
  }

  // Create a new identity
  const privkey = generateSecretKey();
  const pubkey = getPublicKey(privkey);
  
  const identity: NostrIdentity = {
    pubkey,
    privkey,
    profile: { name: "Anonymous" }
  };
  
  // Store a serializable version
  const serializableIdentity = {
    ...identity,
    privkey: undefined // Don't store private key in localStorage for security
  };
  
  localStorage.setItem("nostr-identity", JSON.stringify(serializableIdentity));
  return identity;
};

// Save identity to localStorage
export const saveIdentity = (identity: NostrIdentity) => {
  // Create a serializable version of the identity
  const serializableIdentity = {
    ...identity,
    // Don't store private key for security
    privkey: undefined
  };
  
  localStorage.setItem("nostr-identity", JSON.stringify(serializableIdentity));
};

// Load saved relays or use defaults
export const getSavedRelays = (): Relay[] => {
  const savedRelays = localStorage.getItem("nostr-relays");
  
  if (savedRelays) {
    try {
      return JSON.parse(savedRelays);
    } catch (error) {
      console.error("Failed to parse saved relays", error);
    }
  }
  
  // Return default relays
  return DEFAULT_RELAYS.map(url => ({ 
    url, 
    status: 'disconnected', 
    read: true, 
    write: true 
  }));
};

// Save relays to localStorage
export const saveRelays = (relays: Relay[]) => {
  localStorage.setItem("nostr-relays", JSON.stringify(relays));
};

// Create and sign a new event
export const createEvent = async (
  kind: number,
  content: string,
  tags: string[][] = [],
  identity: NostrIdentity
): Promise<NostrEvent> => {
  if (!identity.privkey) {
    throw new Error("Private key required to create an event");
  }
  
  const unsignedEvent: any = {
    kind,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content,
    pubkey: identity.pubkey,
  };
  
  // Make sure we have a Uint8Array for the private key
  let privkeyBytes: Uint8Array;
  if (typeof identity.privkey === 'string') {
    // Convert hex string to Uint8Array if needed
    privkeyBytes = new Uint8Array(
      identity.privkey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
  } else {
    privkeyBytes = identity.privkey;
  }
  
  const event = finalizeEvent(unsignedEvent, privkeyBytes);
  
  return event as NostrEvent;
};

// Create a board definition event
export const createBoardEvent = async (
  shortName: string,
  name: string,
  description: string,
  identity: NostrIdentity
): Promise<NostrEvent> => {
  const content = JSON.stringify({
    shortName,
    name,
    description,
  });
  
  return await createEvent(KIND.BOARD_DEFINITION, content, [], identity);
};

// Create a thread event
export const createThreadEvent = async (
  boardId: string,
  title: string,
  content: string,
  imageUrls: string[] = [],
  identity: NostrIdentity,
  media?: MediaFile[]
): Promise<NostrEvent> => {
  const threadContent = JSON.stringify({
    title,
    content,
    images: imageUrls,
    media: media || [],
  });
  
  const tags = [
    ["e", boardId, "", "root"],
    ["board", boardId],
  ];
  
  // Add image tags for backward compatibility
  imageUrls.forEach(url => {
    tags.push(["image", url]);
  });
  
  // Add media tags for more detailed media info
  if (media && media.length > 0) {
    media.forEach(item => {
      tags.push(["media", item.url, item.type, item.mimeType]);
    });
  }
  
  return await createEvent(KIND.THREAD, threadContent, tags, identity);
};

// Create a post (reply) event
export const createPostEvent = async (
  threadId: string,
  content: string,
  replyToIds: string[] = [],
  imageUrls: string[] = [],
  identity: NostrIdentity,
  media?: MediaFile[]
): Promise<NostrEvent> => {
  const postContent = JSON.stringify({
    content,
    images: imageUrls,
    media: media || [],
  });
  
  const tags = [
    ["e", threadId, "", "root"],
  ];
  
  // Add references to posts being replied to
  replyToIds.forEach(id => {
    tags.push(["e", id, "", "reply"]);
  });
  
  // Add image tags for backward compatibility
  imageUrls.forEach(url => {
    tags.push(["image", url]);
  });
  
  // Add media tags for more detailed media info
  if (media && media.length > 0) {
    media.forEach(item => {
      tags.push(["media", item.url, item.type, item.mimeType]);
    });
  }
  
  return await createEvent(KIND.POST, postContent, tags, identity);
};

// Format a pubkey to npub format
export const formatPubkey = (pubkey: string): string => {
  try {
    const npub = nip19.npubEncode(pubkey);
    return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
  } catch (error) {
    return `${pubkey.slice(0, 6)}...${pubkey.slice(-4)}`;
  }
};

// Format date for display
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

// Media types we support
export enum MediaType {
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Document = 'document',
}

export interface MediaFile {
  url: string;
  type: MediaType;
  mimeType: string;
  name: string;
  size?: number;
}

/**
 * Get media type based on file MIME type
 */
export const getMediaTypeFromMime = (mimeType: string): MediaType => {
  if (mimeType.startsWith('image/')) {
    return MediaType.Image;
  } else if (mimeType.startsWith('video/')) {
    return MediaType.Video;
  } else if (mimeType.startsWith('audio/')) {
    return MediaType.Audio;
  } else {
    return MediaType.Document;
  }
};

/**
 * Get file extension from MIME type
 */
export const getExtensionFromMime = (mimeType: string): string => {
  const mapping: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
  };
  
  return mapping[mimeType] || 'bin';
};

/**
 * Upload media file to a service and return MediaFile object
 * @param fileData Base64 data URL of the file
 * @param fileName Original file name
 * @param mimeType MIME type of the file
 */
export const uploadMedia = async (
  fileData: string, 
  fileName: string,
  mimeType: string
): Promise<MediaFile> => {
  // For now, we'll just return mock URLs since we'd need to integrate
  // with a real decentralized storage service
  // In a real implementation, this would upload to IPFS or other decentralized storage
  
  try {
    // Extract the base64 data without the prefix
    const base64Data = fileData.split(',')[1] || fileData;
    
    // Calculate approximate size (base64 is ~4/3 the size of binary)
    const sizeInBytes = Math.round((base64Data.length * 3) / 4);
    
    // Get media type based on MIME
    const mediaType = getMediaTypeFromMime(mimeType);
    
    // Get file extension
    const extension = getExtensionFromMime(mimeType);
    
    // This is where we would make an API call to upload the file
    // For now, just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a unique ID for the file
    const fileId = Math.random().toString(36).substring(2, 15);
    
    // Mock response with a sample URL - in production this would be from a real service
    return {
      url: `https://nostr-media.example/${fileId}.${extension}`,
      type: mediaType,
      mimeType: mimeType,
      name: fileName,
      size: sizeInBytes
    };
  } catch (error) {
    console.error("Error uploading media:", error);
    throw new Error("Failed to upload media file");
  }
};

// For backward compatibility
export const uploadImage = async (imageData: string): Promise<string> => {
  const mediaFile = await uploadMedia(imageData, "image.jpg", "image/jpeg");
  return mediaFile.url;
};

// Create a thread subscription event
export const createSubscriptionEvent = async (
  threadId: string,
  notifyOnReplies: boolean = true,
  notifyOnMentions: boolean = true,
  identity: NostrIdentity
): Promise<NostrEvent> => {
  const subscriptionContent = JSON.stringify({
    notifyOnReplies,
    notifyOnMentions,
    createdAt: Math.floor(Date.now() / 1000)
  });
  
  const tags = [
    ["e", threadId, "", "thread"],
    ["subscription", "thread"]
  ];
  
  return await createEvent(KIND.SUBSCRIPTION, subscriptionContent, tags, identity);
};

// Remove a subscription (by creating a deletion event)
export const removeSubscriptionEvent = async (
  subscriptionId: string,
  identity: NostrIdentity
): Promise<NostrEvent> => {
  const tags = [
    ["e", subscriptionId]
  ];
  
  return await createEvent(KIND.METADATA, "", tags, identity);
};

// Create a notification event
export const createNotificationEvent = async (
  recipientPubkey: string,
  title: string,
  message: string,
  threadId: string,
  postId: string | null,
  identity: NostrIdentity
): Promise<NostrEvent> => {
  const notificationContent = JSON.stringify({
    title,
    message,
    createdAt: Math.floor(Date.now() / 1000),
    read: false
  });
  
  const tags = [
    ["p", recipientPubkey], // Recipient pubkey
    ["e", threadId, "", "thread"], // Thread reference
  ];
  
  // Add post reference if available
  if (postId) {
    tags.push(["e", postId, "", "post"]);
  }
  
  return await createEvent(KIND.NOTIFICATION, notificationContent, tags, identity);
};

// Mark a notification as read
export const markNotificationAsRead = async (
  notificationId: string,
  identity: NostrIdentity
): Promise<NostrEvent> => {
  const content = JSON.stringify({
    read: true,
    readAt: Math.floor(Date.now() / 1000)
  });
  
  const tags = [
    ["e", notificationId, "", "notification"]
  ];
  
  return await createEvent(KIND.METADATA, content, tags, identity);
};
