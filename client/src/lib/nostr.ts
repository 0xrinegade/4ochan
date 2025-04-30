import {
  SimplePool,
  getEventHash,
  getPublicKey,
  nip19,
  generateSecretKey,
  finalizeEvent,
  type Event,
} from "nostr-tools";
import { NostrEvent, NostrIdentity, Relay, NostrProfile } from "../types";

// Protocol version enum - defines which version of our application protocol runs on top of Nostr
export enum ProtocolVersion {
  PRODUCTION = 'production', // Stable production version
  DEVELOPMENT = 'development' // Development/testing version
}

// Default protocol version setting
export const DEFAULT_PROTOCOL_VERSION = ProtocolVersion.PRODUCTION;

// Production protocol relays
export const PRODUCTION_RELAYS = [
  "wss://nos.lol",         // Very reliable relay
  "wss://nostr.wine",      // Good fallback relay
  "wss://relay.snort.social", // Popular with good uptime
  "wss://purplepag.es",    // Good for text events
  "wss://relay.current.fyi", // Another stable option
  "wss://relay.nostr.band", // Backup option
  "wss://nostr.mutinywallet.com", // Additional stable relay
];

// Development protocol relays - use for testing new protocol features
export const DEVELOPMENT_RELAYS = [
  "wss://relay.damus.io",  // Good for testing
  "wss://eden.nostr.land", // Another good test relay
  "wss://nostr-dev.wellorder.net", // Development relay
  "wss://testnet.nostr.watch",  // Testnet relay if available
  // You could also add a local relay for development
  // "ws://localhost:4848" // Local relay for development
];

// For backward compatibility
export const DEFAULT_RELAYS = PRODUCTION_RELAYS;

// Kind numbers for our custom event types
export const KIND = {
  METADATA: 0,
  TEXT_NOTE: 1,
  REACTION: 7, // Standard Nostr NIP-25 reaction (like)
  BOARD_DEFINITION: 9901, // Custom kind for board definition
  THREAD: 9902, // Custom kind for thread
  POST: 9903, // Custom kind for post within a thread
  SUBSCRIPTION: 9904, // Custom kind for thread subscription
  NOTIFICATION: 9905, // Custom kind for user notification
  THREAD_STATS: 9906, // Custom kind for thread statistics (views, engagement)
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
      // Parse the saved identity
      const parsed = JSON.parse(savedIdentity);
      
      // Check if we have a private key in the parsed identity
      if (parsed.privkey) {
        if (typeof parsed.privkey === 'string') {
          // Hex string format - this is what we want
          // Validate that it's actually a valid hex string
          if (/^[0-9a-fA-F]{64}$/.test(parsed.privkey)) {
            console.log("Found valid hex private key");
            return parsed;
          } else {
            console.warn("Invalid hex string format for private key, regenerating");
          }
        } else if (parsed.privkey instanceof Uint8Array || typeof parsed.privkey === 'object') {
          // Convert the object to a hex string
          try {
            // Try to convert to Uint8Array first if it's an object
            let bytes: Uint8Array;
            if (parsed.privkey instanceof Uint8Array) {
              bytes = parsed.privkey;
            } else {
              bytes = new Uint8Array(parsed.privkey as any);
            }
            
            // Convert to hex string
            const hexPrivkey = Array.from(bytes)
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
            
            // Return with converted privkey
            return {
              ...parsed,
              privkey: hexPrivkey
            };
          } catch (error) {
            console.error("Failed to convert object privkey to hex", error);
            // We'll fall through and generate a new identity
          }
        } else {
          console.warn("Unrecognized private key format:", typeof parsed.privkey);
          // We'll fall through and generate a new identity
        }
      }
      
      // If privkey is missing but we have a pubkey
      if (!parsed.privkey && parsed.pubkey) {
        console.warn("Identity has pubkey but no privkey, generating new identity");
        // Fall through to generate a new identity
      }
    } catch (error) {
      console.error("Failed to parse saved identity", error);
    }
  }

  // Create a new identity
  // generateSecretKey returns a Uint8Array
  const privkey = generateSecretKey();
  const pubkey = getPublicKey(privkey);
  
  // Convert Uint8Array to hex string for consistent handling
  const privkeyHex = Array.from(privkey)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
  
  const identity: NostrIdentity = {
    pubkey,
    privkey: privkeyHex,
    profile: { 
      name: "Anonymous", 
      pubkey: pubkey,
      picture: "",
      about: "I'm a new 4ochan user",
      nip05: ""
    }
  };
  
  // Store the identity in localStorage - it's already in serializable format
  // since we converted the privkey to hex string above
  localStorage.setItem("nostr-identity", JSON.stringify(identity));
  return identity;
};

// Save identity to localStorage
export const saveIdentity = (identity: NostrIdentity) => {
  // Ensure the private key is in hex string format for storage
  let storedIdentity = { ...identity };
  
  if (identity.privkey) {
    if (typeof identity.privkey === 'string') {
      // Validate that it's a proper hex string
      if (!/^[0-9a-fA-F]{64}$/.test(identity.privkey)) {
        console.warn("Invalid hex string format in saveIdentity, attempting to normalize");
        try {
          // Try to parse it as a hex string anyway - clean any non-hex characters
          const cleanedHex = identity.privkey.replace(/[^0-9a-fA-F]/g, '');
          if (cleanedHex.length === 64) {
            storedIdentity.privkey = cleanedHex;
          } else {
            throw new Error("Cleaned hex string is not 64 characters");
          }
        } catch (error) {
          console.error("Failed to normalize hex string:", error);
          // Generate a new key as fallback
          const newPrivkey = generateSecretKey();
          const privkeyHex = Array.from(newPrivkey)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('');
            
          storedIdentity.privkey = privkeyHex;
          storedIdentity.pubkey = getPublicKey(newPrivkey);
          
          console.warn("Generated new key pair in saveIdentity due to invalid format");
        }
      }
      // If it's already a valid hex string, we can store it directly
    } else if (typeof identity.privkey === 'object' && 'buffer' in (identity.privkey as any)) {
      // Convert Uint8Array-like object to hex string
      const privkeyArray = Array.from(identity.privkey as unknown as ArrayLike<number>);
      const privkeyHex = privkeyArray
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      
      storedIdentity.privkey = privkeyHex;
    } else if (typeof identity.privkey === 'object') {
      // Try to convert the object to a hex string
      try {
        const bytes = new Uint8Array(identity.privkey as any);
        const privkeyHex = Array.from(bytes)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('');
          
        storedIdentity.privkey = privkeyHex;
      } catch (error) {
        console.error("Failed to convert object privkey in saveIdentity:", error);
        // Generate a new key as fallback
        const newPrivkey = generateSecretKey();
        const privkeyHex = Array.from(newPrivkey)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('');
          
        storedIdentity.privkey = privkeyHex;
        storedIdentity.pubkey = getPublicKey(newPrivkey);
        
        console.warn("Generated new key pair in saveIdentity due to invalid format");
      }
    } else {
      console.error("Unhandled private key format in saveIdentity:", typeof identity.privkey);
      // Generate a new key as fallback
      const newPrivkey = generateSecretKey();
      const privkeyHex = Array.from(newPrivkey)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
        
      storedIdentity.privkey = privkeyHex;
      storedIdentity.pubkey = getPublicKey(newPrivkey);
      
      console.warn("Generated new key pair in saveIdentity due to invalid format");
    }
  }
  
  localStorage.setItem("nostr-identity", JSON.stringify(storedIdentity));
  
  // Also return the updated identity so that it can be used immediately
  return storedIdentity;
};

// Get current protocol version from localStorage or use default
export const getCurrentProtocolVersion = (): ProtocolVersion => {
  const savedVersion = localStorage.getItem("nostr-protocol-version");
  if (savedVersion && (savedVersion === ProtocolVersion.PRODUCTION || savedVersion === ProtocolVersion.DEVELOPMENT)) {
    return savedVersion as ProtocolVersion;
  }
  return DEFAULT_PROTOCOL_VERSION;
};

// Save the current protocol version setting
export const saveProtocolVersion = (version: ProtocolVersion) => {
  localStorage.setItem("nostr-protocol-version", version);
};

// Get default relays for current protocol version
export const getDefaultRelaysForProtocol = (version: ProtocolVersion = getCurrentProtocolVersion()): string[] => {
  return version === ProtocolVersion.PRODUCTION ? PRODUCTION_RELAYS : DEVELOPMENT_RELAYS;
};

// Load saved relays or use defaults with reliability check
export const getSavedRelays = (): Relay[] => {
  // Get the current protocol version
  const currentVersion = getCurrentProtocolVersion();
  
  // Check if we have relays saved for this specific protocol version
  const protocolRelayKey = `nostr-relays-${currentVersion}`;
  const savedProtocolRelays = localStorage.getItem(protocolRelayKey);
  
  // First try to load protocol-specific relays
  if (savedProtocolRelays) {
    try {
      const parsed = JSON.parse(savedProtocolRelays);
      
      // Check if there are any problematic relays and replace them
      const updatedRelays = parsed.map((relay: Relay) => {
        // Replace known problematic relays with better alternatives
        if (relay.url === "wss://relay.nostr.info") {
          console.log("Replacing problematic relay with better alternative");
          return {
            ...relay,
            url: currentVersion === ProtocolVersion.PRODUCTION ? "wss://relay.damus.io" : "wss://testnet.nostr.watch",
            status: 'disconnected'
          };
        }
        return relay;
      });
      
      // Save any changes made
      if (JSON.stringify(updatedRelays) !== savedProtocolRelays) {
        saveRelays(updatedRelays);
      }
      
      return updatedRelays;
    } catch (error) {
      console.error(`Failed to parse saved ${currentVersion} relays`, error);
    }
  }
  
  // If no protocol-specific relays, check for legacy relays
  const legacyRelays = localStorage.getItem("nostr-relays");
  if (legacyRelays && currentVersion === ProtocolVersion.PRODUCTION) {
    try {
      const parsed = JSON.parse(legacyRelays);
      
      // Migrate these to protocol-specific storage
      saveRelays(parsed);
      
      return parsed;
    } catch (error) {
      console.error("Failed to parse legacy saved relays", error);
    }
  }
  
  // Return default relays for the current protocol version
  const defaultRelays = getDefaultRelaysForProtocol(currentVersion);
  console.log(`Using default relays for ${currentVersion}:`, defaultRelays);
  
  return defaultRelays.map(url => ({ 
    url, 
    status: 'disconnected', 
    read: true, 
    write: true 
  }));
};

// Save relays to localStorage, specific to the current protocol version
export const saveRelays = (relays: Relay[], version: ProtocolVersion = getCurrentProtocolVersion()) => {
  // Save to the protocol-specific storage key
  const protocolRelayKey = `nostr-relays-${version}`;
  localStorage.setItem(protocolRelayKey, JSON.stringify(relays));
  
  // If we're saving production relays, also save to the legacy key for backward compatibility
  if (version === ProtocolVersion.PRODUCTION) {
    localStorage.setItem("nostr-relays", JSON.stringify(relays));
  }
};

// Create and sign a new event using the recommended approach from Nostr docs
export const createEvent = async (
  kind: number,
  content: string,
  tags: string[][] = [],
  identity: NostrIdentity
): Promise<NostrEvent> => {
  // Get current protocol version to add as tag
  const protocolVersion = getCurrentProtocolVersion();
  try {
    // Ensure we have valid identity data
    if (!identity.privkey || !identity.pubkey) {
      throw new Error("Valid identity with private and public keys required");
    }
    
    // Convert private key to proper format for signing
    let privateKeyHex: string;
    let privateKeyBytes: Uint8Array;
    
    // Handle private key format
    if (typeof identity.privkey === 'string') {
      // If string, validate it's a proper hex
      if (/^[0-9a-fA-F]{64}$/.test(identity.privkey)) {
        privateKeyHex = identity.privkey;
        
        // Convert hex to bytes for signing
        privateKeyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          privateKeyBytes[i] = parseInt(privateKeyHex.slice(i * 2, i * 2 + 2), 16);
        }
      } else {
        console.warn("Invalid hex string for private key, regenerating");
        privateKeyBytes = generateSecretKey();
        privateKeyHex = Array.from(privateKeyBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
          
        // Update identity with new keys
        identity.privkey = privateKeyHex;
        identity.pubkey = getPublicKey(privateKeyBytes);
        saveIdentity(identity);
      }
    } else {
      // For any non-string format, regenerate
      console.warn("Non-string private key format, regenerating");
      privateKeyBytes = generateSecretKey();
      privateKeyHex = Array.from(privateKeyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
        
      // Update identity
      identity.privkey = privateKeyHex;
      identity.pubkey = getPublicKey(privateKeyBytes);
      saveIdentity(identity);
    }
    
    // Validate and clean tags to simple name-value pairs
    const cleanTags: string[][] = [];
    
    // Add protocol version tag to all events for client compatibility
    cleanTags.push(["protocol", protocolVersion]);
    
    for (const tag of tags) {
      if (Array.isArray(tag) && tag.length > 0) {
        // Ensure all tag elements are strings
        const cleanTag = tag.map(item => 
          typeof item === 'string' ? item : String(item)
        );
        cleanTags.push(cleanTag);
      }
    }
    
    // Log event creation details
    console.log("Creating event:", {
      kind,
      pubkey: identity.pubkey,
      tagsCount: cleanTags.length,
      contentLength: content.length
    });
    
    console.log("Tags structure:", JSON.stringify(cleanTags));
    
    // Create unsigned event with basic required fields
    const createdAt = Math.floor(Date.now() / 1000);
    
    // Create an unsigned event object first
    const unsignedEvent = {
      kind,
      created_at: createdAt,
      tags: cleanTags,
      content,
      pubkey: identity.pubkey,
    };
    
    // Calculate event id (hash)
    const id = getEventHash(unsignedEvent);
    
    // Sign the event using the finalizeEvent function
    // Convert hex string to Uint8Array for compatibility with finalizeEvent
    const privateKeyBytesForSigning = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      privateKeyBytesForSigning[i] = parseInt(privateKeyHex.slice(i * 2, i * 2 + 2), 16);
    }
    const event = finalizeEvent(unsignedEvent, privateKeyBytesForSigning);
    
    // Verify the event is valid for logging purposes
    const isValid = await verifyEvent(event);
    console.log(`Event creation ${isValid ? 'successful' : 'FAILED validation'}:`, {
      id: event.id?.substring(0, 10) + '...',
      sig: event.sig?.substring(0, 10) + '...',
      valid: isValid
    });
    
    if (!isValid) {
      console.error("Created event failed validation check:", event);
      throw new Error("Event validation failed after creation");
    }
    
    return event as NostrEvent;
  } catch (error) {
    console.error("Error in createEvent:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
};

// Helper function to verify an event is valid
async function verifyEvent(event: Event): Promise<boolean> {
  try {
    // Check required fields exist
    if (!event.id || !event.pubkey || !event.sig) {
      console.error("Event missing required fields");
      return false;
    }
    
    // Verify event ID matches content hash
    const eventContent = {
      pubkey: event.pubkey,
      created_at: event.created_at,
      kind: event.kind,
      tags: event.tags,
      content: event.content
    };
    
    const calculatedId = getEventHash(eventContent);
    if (calculatedId !== event.id) {
      console.error("Event ID verification failed", {
        calculatedId,
        eventId: event.id
      });
      return false;
    }
    
    // For simplicity, we're not verifying the signature here since it would require
    // additional cryptography functions. The signature will be verified by the relays.
    return true;
  } catch (error) {
    console.error("Error verifying event:", error);
    return false;
  }
}

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
  
  // Format tags properly according to NIP-01 and NIP-10 standards
  // Since boardId isn't actually an event ID, we should use a custom tag instead
  const tags = [
    ["board", boardId], // Board reference using custom tag
    ["t", title.substring(0, 20)], // Topic tag with truncated title
  ];
  
  // Add image tags for backward compatibility, using only 2-element tags
  imageUrls.forEach(url => {
    tags.push(["image", url]);
  });
  
  // Add media tags for more detailed media info, ensuring consistent format
  if (media && media.length > 0) {
    media.forEach(item => {
      // Only include essential data in a consistent format
      tags.push(["media", item.url]);
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
  
  // Format tags properly according to NIP-01 and NIP-10 standards
  // For event tags, we must ensure the thread ID is a proper event ID (32 bytes hex)
  const tags = [];
  
  // Always add the thread ID as both a root reference and a thread tag
  // This ensures maximum compatibility with different relay indexing strategies
  if (/^[0-9a-fA-F]{64}$/.test(threadId)) {
    tags.push(["e", threadId, "", "root"]);
    tags.push(["thread", threadId]); // Also add as a thread tag for additional indexing
  } else {
    // For non-standard IDs, use a custom tag
    tags.push(["thread", threadId]);
  }
  
  // Add references to posts being replied to
  for (const id of replyToIds) {
    // Validate it's a valid event ID
    if (/^[0-9a-fA-F]{64}$/.test(id)) {
      // Skip if this is the thread ID (already added as root)
      if (id !== threadId) {
        tags.push(["e", id, "", "reply"]);
      }
    }
  }
  
  // Add board tag if we can extract it from the thread ID or replyToIds
  const boardTag = localStorage.getItem(`board-for-thread-${threadId}`);
  if (boardTag) {
    tags.push(["board", boardTag]);
  }
  
  // Add image tags for backward compatibility
  imageUrls.forEach(url => {
    tags.push(["image", url]);
  });
  
  // Add media tags for more detailed media info, ensuring consistent format
  if (media && media.length > 0) {
    media.forEach(item => {
      // Only include essential data in a consistent format
      tags.push(["media", item.url]);
    });
  }
  
  // Log the tags for debugging
  console.log("Creating post with tags:", JSON.stringify(tags));
  
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
  
  // Format tags properly - validate the thread ID
  const tags = [];
  
  // Add the root reference first
  // Properly validate that the thread ID is a valid 64-character hex string
  if (/^[0-9a-fA-F]{64}$/.test(threadId)) {
    tags.push(["e", threadId]);
  } else {
    // For non-standard IDs, use a custom tag
    tags.push(["thread_id", threadId]);
  }
  
  // Add the subscription type
  tags.push(["subscription", "thread"]);
  
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
  
  // Format tags consistently
  const tags = [
    ["e", subscriptionId] // Reference to the subscription being removed
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
  
  // Format tags properly
  const tags = [
    ["p", recipientPubkey], // Recipient pubkey tag format is correct
  ];
  
  // Add thread reference with proper validation
  if (/^[0-9a-fA-F]{64}$/.test(threadId)) {
    tags.push(["e", threadId]);
  } else {
    // For non-standard IDs, use a custom tag
    tags.push(["thread_id", threadId]);
  }
  
  // Add post reference if available with validation
  if (postId && /^[0-9a-fA-F]{64}$/.test(postId)) {
    tags.push(["e", postId, "", "mention"]);
  } else if (postId) {
    tags.push(["post_id", postId]);
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
  
  // Format tags consistently
  const tags = [
    ["e", notificationId]
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
  
  // Format tags consistently
  const tags = [
    ["e", subscriptionId], // Reference to the subscription being updated
    ["e", threadId], // Thread reference
    ["subscription", "thread"] // Subscription type
  ];
  
  return await createEvent(KIND.METADATA, subscriptionContent, tags, identity);
};

// Create a thread stat tracking event (view count, engagement metric)
export const createThreadStatEvent = async (
  threadId: string,
  viewCount: number,
  engagement: number,
  identity: NostrIdentity
): Promise<NostrEvent> => {
  const statContent = JSON.stringify({
    viewCount,
    engagement,
    updatedAt: Math.floor(Date.now() / 1000)
  });
  
  // Format tags properly - thread reference
  const tags = [
    ["e", threadId, "", "root"] // Thread reference with recommended NIP-10 formatting
  ];
  
  return await createEvent(KIND.THREAD_STATS, statContent, tags, identity);
};

// Create a like event for a post
export const createPostLikeEvent = async (
  postId: string,
  identity: NostrIdentity
): Promise<NostrEvent> => {
  // Using "+" as the content for a like/positive reaction (standard for NIP-25)
  const tags = [
    ["e", postId] // Reference to the post being liked
  ];
  
  return await createEvent(KIND.REACTION, "+", tags, identity);
};

// Get the like event ID if current user has already liked this post
export const getLikeEventId = async (
  postId: string,
  pubkey: string,
  pool: SimplePool,
  relayUrls: string[]
): Promise<string | null> => {
  try {
    // Query for reaction events (kind 7) that reference this post and are created by this user
    const filter = {
      kinds: [KIND.REACTION],
      authors: [pubkey],
      "#e": [postId],
      limit: 1
    };
    
    const events = await pool.querySync(relayUrls, filter);
    if (events.length > 0) {
      return events[0].id;
    }
    
    return null;
  } catch (error) {
    console.error("Error checking if user liked post:", error);
    return null;
  }
};

// Create an event to unlike (delete previous like)
export const createPostUnlikeEvent = async (
  likeEventId: string,
  identity: NostrIdentity
): Promise<NostrEvent> => {
  // To unlike, we create a deletion event (kind 5) that references the original like event
  const tags = [
    ["e", likeEventId] // Reference to the like event being deleted
  ];
  
  return await createEvent(5, "", tags, identity);
};

// Count the total number of likes for a post
export const countPostLikes = async (
  postId: string,
  pool: SimplePool,
  relayUrls: string[]
): Promise<number> => {
  try {
    // Query for all reaction events (kind 7) that reference this post with "+" content
    const filter = {
      kinds: [KIND.REACTION],
      "#e": [postId],
      limit: 100 // Reasonable limit for likes on a post
    };
    
    const events = await pool.querySync(relayUrls, filter);
    
    // Count only positive reactions (content is "+")
    const likeCount = events.filter(event => event.content === "+").length;
    return likeCount;
  } catch (error) {
    console.error("Error counting post likes:", error);
    return 0;
  }
};

// Check if the current user has liked a post
export const hasUserLikedPost = async (
  postId: string,
  pubkey: string,
  pool: SimplePool,
  relayUrls: string[]
): Promise<boolean> => {
  const likeEventId = await getLikeEventId(postId, pubkey, pool, relayUrls);
  return likeEventId !== null;
};

