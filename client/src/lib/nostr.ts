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
  "wss://nos.lol",         // Very reliable relay
  "wss://nostr.wine",      // Good fallback relay
  "wss://relay.snort.social", // Popular with good uptime
  "wss://purplepag.es",    // Good for text events
  "wss://relay.current.fyi", // Another stable option
  "wss://relay.nostr.band", // Backup option
  "wss://nostr.mutinywallet.com", // Additional stable relay
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

// Load saved relays or use defaults with reliability check
export const getSavedRelays = (): Relay[] => {
  const savedRelays = localStorage.getItem("nostr-relays");
  
  if (savedRelays) {
    try {
      const parsed = JSON.parse(savedRelays);
      
      // Check if there are any problematic relays and replace them
      const updatedRelays = parsed.map((relay: Relay) => {
        // Replace known problematic relays with better alternatives
        if (relay.url === "wss://relay.nostr.info") {
          console.log("Replacing problematic relay with better alternative");
          return {
            ...relay,
            url: "wss://relay.damus.io",
            status: 'disconnected'
          };
        }
        return relay;
      });
      
      // Save any changes made
      if (JSON.stringify(updatedRelays) !== savedRelays) {
        saveRelays(updatedRelays);
      }
      
      return updatedRelays;
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
  
  // For a more classic 90s style format
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    // Format as time only for today
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  // Include date for older posts in classic 90s style
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Format time ago in a classic style (e.g., "5 mins ago", "2 hrs ago")
export const timeAgo = (timestamp: number): string => {
  const now = Date.now() / 1000;
  const seconds = Math.floor(now - timestamp);
  
  if (seconds < 60) {
    return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
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
 * Upload media file to a Nostr NIP-94 compatible service and return MediaFile object
 * @param fileData Base64 data URL of the file
 * @param fileName Original file name
 * @param mimeType MIME type of the file
 */
export const uploadMedia = async (
  fileData: string, 
  fileName: string,
  mimeType: string
): Promise<MediaFile> => {
  try {
    console.log(`Starting upload to nostr.build: ${fileName} (${mimeType})`);
    
    // Extract the base64 data without the prefix
    const base64Data = fileData.split(',')[1] || fileData;
    
    // Calculate size 
    const sizeInBytes = Math.round((base64Data.length * 3) / 4);
    
    // Get media type based on MIME
    const mediaType = getMediaTypeFromMime(mimeType);
    
    // Get file extension
    const extension = getExtensionFromMime(mimeType);
    
    // Convert base64 to binary data
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create a Blob from the binary data
    const blob = new Blob([bytes], { type: mimeType });
    
    // We'll use nostr.build for NIP-94 compatible file storage
    // Create a FormData object to send the file
    const formData = new FormData();
    const file = new File([blob], fileName, { type: mimeType });
    formData.append('file', file);
    
    // Add NIP-94 metadata fields - these fields are specific to nostr.build
    formData.append('nip94', '1'); // Indicate this is a NIP-94 upload
    formData.append('nip94_mimetype', mimeType);
    
    console.log(`Sending ${sizeInBytes} bytes to nostr.build...`);
    
    // Upload to nostr.build
    const response = await fetch('https://nostr.build/api/upload/1', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      console.error(`Upload failed with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Upload response:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Upload did not return a valid URL');
    }
    
    // nostr.build returns data in different formats depending on version
    // Extract the URL from the response based on available fields
    const fileUrl = result.url || 
                   (result.data && result.data.url) || 
                   (result.data && result.data.uploadUrl);
    
    if (!fileUrl) {
      throw new Error('Upload did not return a valid URL');
    }
    
    console.log(`Successfully uploaded to: ${fileUrl}`);
    
    return {
      url: fileUrl,
      type: mediaType,
      mimeType: mimeType,
      name: fileName,
      size: sizeInBytes
    };
  } catch (error: any) {
    console.error("Error uploading media to nostr.build:", error);
    throw new Error(`Failed to upload media file: ${error?.message || 'Unknown error'}`);
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
  const content = JSON.stringify({
    action: "unsubscribe",
    timestamp: Math.floor(Date.now() / 1000)
  });
  
  const tags = [
    ["e", subscriptionId, "", "subscription"] // Reference to the subscription being removed
  ];
  
  return await createEvent(KIND.METADATA, content, tags, identity);
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

// Update a thread subscription (change notification settings)
export const updateSubscriptionEvent = async (
  subscriptionId: string,
  threadId: string,
  notifyOnReplies: boolean,
  notifyOnMentions: boolean,
  identity: NostrIdentity
): Promise<NostrEvent> => {
  const subscriptionContent = JSON.stringify({
    notifyOnReplies,
    notifyOnMentions,
    updatedAt: Math.floor(Date.now() / 1000)
  });
  
  const tags = [
    ["e", subscriptionId, "", "subscription"], // Reference to the subscription being updated
    ["e", threadId, "", "thread"], // Thread reference
    ["subscription", "thread"] // Subscription type
  ];
  
  return await createEvent(KIND.METADATA, subscriptionContent, tags, identity);
};

