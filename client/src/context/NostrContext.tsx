import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SimplePool, type Filter } from "nostr-tools";
import { localCache } from "../lib/storage";
import { 
  NostrEvent, 
  NostrIdentity, 
  Relay, 
  Board, 
  Thread, 
  Post,
  MediaContent,
  ThreadSubscription,
  Notification
} from "../types";
import { 
  createPool, 
  getOrCreateIdentity, 
  saveIdentity, 
  getSavedRelays, 
  saveRelays, 
  KIND 
} from "../lib/nostr";

interface NostrContextType {
  pool: SimplePool | null;
  identity: NostrIdentity;
  relays: Relay[];
  boards: Board[];
  connectedRelays: number;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateIdentity: (identity: NostrIdentity) => void;
  addRelay: (relay: Relay) => void;
  removeRelay: (url: string) => void;
  updateRelay: (relay: Relay) => void;
  saveRelaySettings: (autoConnect: boolean, autoReconnect: boolean) => void;
  publishEvent: (event: NostrEvent) => Promise<void>;
  loadBoards: () => Promise<Board[]>;
  createBoard: (shortName: string, name: string, description: string) => Promise<Board>;
  getThreadsByBoard: (boardId: string) => Promise<Thread[]>;
  getThread: (threadId: string) => Promise<Thread | undefined>;
  getPostsByThread: (threadId: string) => Promise<Post[]>;
  createThread: (boardId: string, title: string, content: string, imageUrls: string[], media?: MediaContent[]) => Promise<Thread>;
  createPost: (threadId: string, content: string, replyToIds: string[], imageUrls: string[], media?: MediaContent[]) => Promise<Post>;
  // Thread subscriptions
  subscribeToThread: (threadId: string, notifyOnReplies?: boolean, notifyOnMentions?: boolean) => Promise<ThreadSubscription>;
  unsubscribeFromThread: (subscriptionId: string) => Promise<void>;
  getThreadSubscriptions: () => Promise<ThreadSubscription[]>;
  isSubscribedToThread: (threadId: string) => Promise<boolean>;
  // Notifications
  getNotifications: (includeRead?: boolean, limit?: number) => Promise<Notification[]>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  getUnreadNotificationCount: () => Promise<number>;
  // Thread statistics
  getThreadStats: (threadId: string) => Promise<{ viewCount: number, engagement: number } | null>;
}

export const NostrContext = createContext<NostrContextType | undefined>(undefined);

export const NostrProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pool, setPool] = useState<SimplePool | null>(null);
  const [identity, setIdentity] = useState<NostrIdentity>(getOrCreateIdentity);
  const [relays, setRelays] = useState<Relay[]>(getSavedRelays);
  const [boards, setBoards] = useState<Board[]>([]);
  const [connectedRelays, setConnectedRelays] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [autoConnect, setAutoConnect] = useState<boolean>(
    localStorage.getItem("nostr-auto-connect") !== "false"
  );
  const [autoReconnect, setAutoReconnect] = useState<boolean>(
    localStorage.getItem("nostr-auto-reconnect") !== "false"
  );

  // Connect to relays with improved error handling and automatic retry
  const connect = useCallback(async () => {
    if (isConnecting || pool) return;
    
    console.log("Auto-connecting to relays...");
    setIsConnecting(true);
    const newPool = createPool();
    
    const updatedRelays = [...relays];
    let connected = 0;
    
    // Map of problematic relays to fallback options
    const fallbackRelays: Record<string, string> = {
      "wss://relay.nostr.info": "wss://nos.lol",
      "wss://relay.damus.io": "wss://nostr.wine",
      "wss://relay.snort.social": "wss://purplepag.es",
      "wss://relay.current.fyi": "wss://nostr.mutinywallet.com"
    };
    
    // Connect to each relay with 8 second timeout (increased from 5)
    for (let i = 0; i < updatedRelays.length; i++) {
      const relay = updatedRelays[i];
      relay.status = 'connecting';
      setRelays([...updatedRelays]);
      
      try {
        // Create a promise that will reject after 8 seconds
        const connectWithTimeout = Promise.race([
          newPool.ensureRelay(relay.url),
          new Promise((_, reject) => setTimeout(() => reject(new Error("connection timed out")), 8000))
        ]);
        
        await connectWithTimeout;
        relay.status = 'connected';
        connected++;
        console.log(`Successfully connected to relay: ${relay.url}`);
      } catch (error) {
        console.error(`Failed to connect to relay: ${relay.url}`, error);
        relay.status = 'error';
        
        // If this relay failed, try to replace it with a working fallback
        if (fallbackRelays[relay.url]) {
          // Check if the fallback relay is already in our list
          const fallbackExists = updatedRelays.some(r => r.url === fallbackRelays[relay.url]);
          
          if (!fallbackExists) {
            // Add the fallback relay to our list
            updatedRelays.push({
              url: fallbackRelays[relay.url],
              status: 'disconnected',
              read: relay.read,
              write: relay.write
            });
            
            // Try to connect to the fallback immediately
            try {
              console.log(`Trying fallback relay: ${fallbackRelays[relay.url]}`);
              const fallbackIndex = updatedRelays.length - 1;
              updatedRelays[fallbackIndex].status = 'connecting';
              
              await Promise.race([
                newPool.ensureRelay(fallbackRelays[relay.url]),
                new Promise((_, reject) => setTimeout(() => reject(new Error("fallback connection timed out")), 8000))
              ]);
              
              updatedRelays[fallbackIndex].status = 'connected';
              connected++;
              console.log(`Successfully connected to fallback relay: ${fallbackRelays[relay.url]}`);
            } catch (fallbackError) {
              console.error(`Failed to connect to fallback relay: ${fallbackRelays[relay.url]}`, fallbackError);
              updatedRelays[updatedRelays.length - 1].status = 'error';
            }
          }
        }
      }
      
      setRelays([...updatedRelays]);
    }
    
    // Save the updated relays
    saveRelays(updatedRelays);
    
    setConnectedRelays(connected);
    setPool(newPool);
    setIsConnecting(false);
    
    // Load boards after connecting
    if (connected > 0) {
      loadBoards();
      
      // Try to publish any saved offline events
      try {
        const offlineEvents = JSON.parse(localStorage.getItem("offline-events") || "[]");
        if (offlineEvents.length > 0) {
          console.log(`Attempting to publish ${offlineEvents.length} saved offline events`);
          
          // Create a copy of the array since we'll be modifying it
          const eventsCopy = [...offlineEvents];
          const successfulIds = [];
          
          // Try to publish each saved event
          for (const event of eventsCopy) {
            try {
              // Need to await each one to catch individual errors
              const writeRelays = relays
                .filter(r => r.status === 'connected' && r.write)
                .map(r => r.url);
                
              if (writeRelays.length > 0 && newPool) {
                const pubs = newPool.publish(writeRelays, event);
                await Promise.any(pubs);
                successfulIds.push(event.id);
                console.log(`Successfully published saved event ${event.id}`);
              }
            } catch (error) {
              console.log(`Failed to publish saved event ${event.id}`, error);
            }
          }
          
          // Remove successful events from storage
          if (successfulIds.length > 0) {
            const remainingEvents = offlineEvents.filter(
              (event: NostrEvent) => !successfulIds.includes(event.id)
            );
            localStorage.setItem("offline-events", JSON.stringify(remainingEvents));
            console.log(`Published ${successfulIds.length}/${offlineEvents.length} saved events`);
          }
        }
      } catch (error) {
        console.error("Error processing offline events:", error);
      }
    } else {
      console.error("Failed to connect to any relays");
      
      // If all connections failed, try again in 10 seconds
      setTimeout(() => {
        if (connectedRelays === 0 && !isConnecting) {
          console.log("Auto-reconnecting after complete failure...");
          connect();
        }
      }, 10000);
    }
  }, [isConnecting, pool, relays]);

  // Disconnect from all relays
  const disconnect = useCallback(() => {
    if (pool) {
      pool.close(["user-disconnect"]); // Provide a reason for closing as required by v2.x API
      setPool(null);
      
      // Update relay statuses
      const updatedRelays = relays.map(relay => ({
        ...relay,
        status: 'disconnected' as const,
      }));
      
      setRelays(updatedRelays);
      setConnectedRelays(0);
    }
  }, [pool, relays]);

  // Update user identity
  const updateIdentity = useCallback((newIdentity: NostrIdentity) => {
    // Save identity and get back the normalized version (with consistent privkey format)
    const normalizedIdentity = saveIdentity(newIdentity);
    // Update state with the normalized identity
    setIdentity(normalizedIdentity);
  }, []);

  // Add a new relay
  const addRelay = useCallback((relay: Relay) => {
    setRelays(prev => {
      const updated = [...prev, relay];
      saveRelays(updated);
      return updated;
    });
  }, []);

  // Remove a relay
  const removeRelay = useCallback((url: string) => {
    setRelays(prev => {
      const updated = prev.filter(r => r.url !== url);
      saveRelays(updated);
      return updated;
    });
  }, []);

  // Update a relay
  const updateRelay = useCallback((updatedRelay: Relay) => {
    setRelays(prev => {
      const updated = prev.map(r => 
        r.url === updatedRelay.url ? updatedRelay : r
      );
      saveRelays(updated);
      return updated;
    });
  }, []);

  // Save relay settings
  const saveRelaySettings = useCallback((newAutoConnect: boolean, newAutoReconnect: boolean) => {
    setAutoConnect(newAutoConnect);
    setAutoReconnect(newAutoReconnect);
    localStorage.setItem("nostr-auto-connect", String(newAutoConnect));
    localStorage.setItem("nostr-auto-reconnect", String(newAutoReconnect));
  }, []);

  // Publish an event to connected relays
  const publishEvent = useCallback(async (event: NostrEvent) => {
    if (!pool) {
      // If not connected, attempt to connect first
      await connect();
      
      // If still not connected after attempting, store locally and throw error
      if (!pool) {
        // Store event locally for later retry
        const offlineEvents = JSON.parse(localStorage.getItem("offline-events") || "[]");
        offlineEvents.push(event);
        localStorage.setItem("offline-events", JSON.stringify(offlineEvents));
        
        console.log("Saved event to localStorage for later publishing");
        throw new Error("Not connected to any relays - event saved for later publishing");
      }
    }
    
    // Check for write relays, use all available relays as a fallback
    // Use a Set to ensure unique relay URLs
    const uniqueRelays = new Set<string>(
      relays
        .filter(r => r.status === 'connected' && r.write)
        .map(r => r.url)
    );
    
    let writeRelays = Array.from(uniqueRelays);
    
    // If no specific write relays, try using all connected relays
    if (writeRelays.length === 0) {
      const allConnectedRelays = new Set<string>(
        relays
          .filter(r => r.status === 'connected')
          .map(r => r.url)
      );
      
      writeRelays = Array.from(allConnectedRelays);
        
      // If still no relays available, save for later and throw error
      if (writeRelays.length === 0) {
        // Store event locally for later retry
        const offlineEvents = JSON.parse(localStorage.getItem("offline-events") || "[]");
        offlineEvents.push(event);
        localStorage.setItem("offline-events", JSON.stringify(offlineEvents));
        
        console.log("No writable relays - saved event to localStorage for later publishing");
        throw new Error("No writable relays connected - event saved for later publishing");
      }
    }
    
    console.log(`Publishing to ${writeRelays.length} relays:`, writeRelays);
    const pubs = pool.publish(writeRelays, event);
    
    // Wait for at least one successful publish with more detailed error handling
    try {
      const results = await Promise.allSettled(pubs);
      const successful = results.filter(r => r.status === 'fulfilled');
      
      if (successful.length > 0) {
        console.log(`Successfully published to ${successful.length}/${writeRelays.length} relays`);
        return;
      } else {
        // If all failed, throw a detailed error
        const errors = results
          .filter(r => r.status === 'rejected')
          .map(r => (r as PromiseRejectedResult).reason)
          .join(', ');
          
        console.error("All publish attempts failed:", errors);
        
        // Store event locally for later retry
        const offlineEvents = JSON.parse(localStorage.getItem("offline-events") || "[]");
        offlineEvents.push(event);
        localStorage.setItem("offline-events", JSON.stringify(offlineEvents));
        
        throw new Error("Failed to publish to any relay - event saved for later publishing");
      }
    } catch (error) {
      console.error("Failed to publish event", error);
      
      // Store event locally for later retry
      const offlineEvents = JSON.parse(localStorage.getItem("offline-events") || "[]");
      offlineEvents.push(event);
      localStorage.setItem("offline-events", JSON.stringify(offlineEvents));
      
      throw new Error("Failed to publish to any relay - event saved for later publishing");
    }
  }, [pool, relays, connect]);

  // Load boards from relays or create initial ones if needed
  const loadBoards = useCallback(async () => {
    // Initialize with empty boards array
    const initialBoards: Board[] = [];
    
    if (!pool) {
      // Return empty boards if not connected to pool
      setBoards(initialBoards);
      return initialBoards;
    }
    
    // Get all board definition events - using updated API for nostr-tools v2.x
    const filter: Filter = {
      kinds: [KIND.BOARD_DEFINITION]
    };
    
    // Use list events pattern compatible with nostr-tools v2.x
    const relayUrls = relays.filter(r => r.status === 'connected' && r.read).map(r => r.url);
    
    // Store loaded boards and track unique boards
    const loadedBoards: Board[] = [];
    const uniqueBoards = new Map<string, Board>();
    
    try {
      const events = await pool.querySync(relayUrls, filter);
      
      // Process relay boards
      for (const event of events) {
        try {
          const boardData = JSON.parse(event.content);
          
          const board: Board = {
            id: event.id,
            shortName: boardData.shortName,
            name: boardData.name,
            description: boardData.description,
            threadCount: 0
          };
          
          // Deduplicate boards by shortName
          if (!uniqueBoards.has(board.shortName)) {
            uniqueBoards.set(board.shortName, board);
            loadedBoards.push(board);
            localCache.addBoard(board);
          }
        } catch (error) {
          console.error("Failed to parse board event", event, error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch boards from relays:", error);
    }
    
    setBoards(loadedBoards);
    return loadedBoards;
  }, [pool, relays]);

  // Create a new board
  const createBoard = useCallback(async (
    shortName: string, 
    name: string, 
    description: string
  ): Promise<Board> => {
    if (!pool) {
      throw new Error("Not connected to any relays");
    }
    
    // Create and publish board event
    const event = await import("../lib/nostr").then(({ createBoardEvent }) => 
      createBoardEvent(shortName, name, description, identity)
    );
    
    await publishEvent(event);
    
    // Create board object
    const board: Board = {
      id: event.id,
      shortName,
      name,
      description,
      threadCount: 0
    };
    
    // Add to local cache and state
    localCache.addBoard(board);
    setBoards(prev => [...prev, board]);
    
    return board;
  }, [pool, identity, publishEvent]);

  // Get threads for a specific board
  const getThreadsByBoard = useCallback(async (boardId: string): Promise<Thread[]> => {
    if (!pool) {
      throw new Error("Not connected to any relays");
    }
    
    // Always clear the cache to get fresh data
    localCache.clearThreadsByBoard(boardId);
    
    console.log(`Fetching threads for board: ${boardId}`);
    
    // Try a broader approach - fetch all thread events and filter locally
    // This addresses the "unindexed tag filter" error from relays
    const filter: Filter = {
      kinds: [KIND.THREAD],
      limit: 100, // Fetch more threads to ensure we get all for this board
      since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30, // Last 30 days
    };
    
    const relayUrls = relays.filter(r => r.status === 'connected' && r.read).map(r => r.url);
    console.log(`Querying ${relayUrls.length} relays for threads...`);
    
    try {
      // Get all thread events
      const events = await pool.querySync(relayUrls, filter);
      console.log(`Retrieved ${events.length} total thread events from relays`);
      
      // Filter events locally for the target board
      const boardEvents = events.filter(event => {
        const boardTag = event.tags.find((tag: string[]) => 
          tag[0] === 'board' && tag[1] === boardId
        );
        return !!boardTag;
      });
      
      console.log(`Found ${boardEvents.length} events for board ${boardId}`);
      
      // Parse thread events
      const threads: Thread[] = [];
      
      for (const event of boardEvents) {
        try {
          const threadData = JSON.parse(event.content);
          
          const thread: Thread = {
            id: event.id,
            boardId,
            title: threadData.title,
            content: threadData.content,
            images: threadData.images || [],
            media: threadData.media || [],
            authorPubkey: event.pubkey,
            createdAt: event.created_at,
            replyCount: 0,
            lastReplyTime: event.created_at
          };
          
          threads.push(thread);
          localCache.addThread(thread);
        } catch (error) {
          console.error("Failed to parse thread event", event, error);
        }
      }
      
      console.log(`Successfully parsed ${threads.length} threads`);
      
      // Also try to fetch specifically created threads from our user
      if (threads.length === 0) {
        console.log("No threads found, trying to fetch user's own threads...");
        const userFilter: Filter = {
          kinds: [KIND.THREAD],
          authors: [identity.pubkey],
          limit: 50
        };
        
        const userEvents = await pool.querySync(relayUrls, userFilter);
        console.log(`Found ${userEvents.length} threads created by user`);
        
        // Filter user events for this board
        const userBoardEvents = userEvents.filter(event => {
          const boardTag = event.tags.find((tag: string[]) => 
            tag[0] === 'board' && tag[1] === boardId
          );
          return !!boardTag;
        });
        
        console.log(`Found ${userBoardEvents.length} user threads for board ${boardId}`);
        
        for (const event of userBoardEvents) {
          try {
            const threadData = JSON.parse(event.content);
            
            const thread: Thread = {
              id: event.id,
              boardId,
              title: threadData.title,
              content: threadData.content,
              images: threadData.images || [],
              media: threadData.media || [],
              authorPubkey: event.pubkey,
              createdAt: event.created_at,
              replyCount: 0,
              lastReplyTime: event.created_at
            };
            
            // Ensure no duplicates
            if (!threads.some(t => t.id === thread.id)) {
              threads.push(thread);
              localCache.addThread(thread);
            }
          } catch (error) {
            console.error("Failed to parse user thread event", event, error);
          }
        }
      }
      
      // As a last resort, check all threads in localStorage
      if (threads.length === 0) {
        console.log("Still no threads found, checking local storage...");
        // Try to load thread from local storage
        const savedThread = localStorage.getItem(`thread-${boardId}`);
        if (savedThread) {
          try {
            const threadList = JSON.parse(savedThread);
            threads.push(...threadList);
            console.log(`Loaded ${threadList.length} threads from localStorage`);
          } catch (e) {
            console.error("Failed to parse saved threads", e);
          }
        }
      }
      
      // Fetch reply counts for threads we found
      for (const thread of threads) {
        const replies = await getPostsByThread(thread.id);
        thread.replyCount = replies.length;
        thread.lastReplyTime = replies.length > 0 
          ? Math.max(...replies.map(r => r.createdAt))
          : thread.createdAt;
        
        localCache.addThread(thread);
      }
      
      // Sort by creation time to show newest threads first
      const sortedThreads = threads.sort((a, b) => 
        (b.lastReplyTime || b.createdAt) - (a.lastReplyTime || a.createdAt)
      );
      
      // Save to localStorage for backup
      try {
        localStorage.setItem(`thread-${boardId}`, JSON.stringify(sortedThreads));
      } catch (e) {
        console.error("Failed to save threads to localStorage", e);
      }
      
      console.log(`Returning ${sortedThreads.length} sorted threads`);
      return sortedThreads;
    } catch (error) {
      console.error("Error querying threads:", error);
      // Try to get from localStorage as fallback
      try {
        const savedThread = localStorage.getItem(`thread-${boardId}`);
        if (savedThread) {
          const threadList = JSON.parse(savedThread);
          console.log(`Loaded ${threadList.length} threads from localStorage as fallback`);
          return threadList;
        }
      } catch (e) {
        console.error("Failed to parse saved threads", e);
      }
      return [];
    }
  }, [pool, relays]);

  // Get a specific thread
  const getThread = useCallback(async (threadId: string): Promise<Thread | undefined> => {
    // Check cache first
    const cachedThread = localCache.getThread(threadId);
    if (cachedThread) {
      return cachedThread;
    }
    
    if (!pool) {
      throw new Error("Not connected to any relays");
    }
    
    // Fetch thread event - updated for nostr-tools v2.x
    const filter: Filter = {
      kinds: [KIND.THREAD],
      ids: [threadId]
    };
    
    const relayUrls = relays.filter(r => r.status === 'connected' && r.read).map(r => r.url);
    const events = await pool.querySync(relayUrls, filter);
    
    if (events.length === 0) {
      return undefined;
    }
    
    try {
      const event = events[0];
      const threadData = JSON.parse(event.content);
      
      // Find the board ID from the tags
      const boardTag = event.tags.find((tag: string[]) => tag[0] === 'board');
      const boardId = boardTag ? boardTag[1] : "";
      
      const thread: Thread = {
        id: event.id,
        boardId,
        title: threadData.title,
        content: threadData.content,
        images: threadData.images || [],
        media: threadData.media || [],
        authorPubkey: event.pubkey,
        createdAt: event.created_at,
        replyCount: 0,
        lastReplyTime: event.created_at
      };
      
      // Get reply count
      const replies = await getPostsByThread(thread.id);
      thread.replyCount = replies.length;
      thread.lastReplyTime = replies.length > 0 
        ? Math.max(...replies.map(r => r.createdAt))
        : thread.createdAt;
      
      localCache.addThread(thread);
      return thread;
    } catch (error) {
      console.error("Failed to parse thread event", events[0], error);
      return undefined;
    }
  }, [pool, relays]);

  // Get posts for a specific thread
  const getPostsByThread = useCallback(async (threadId: string): Promise<Post[]> => {
    // Check cache first
    const cachedPosts = localCache.getPostsByThread(threadId);
    if (cachedPosts.length > 0) {
      return cachedPosts;
    }
    
    if (!pool) {
      throw new Error("Not connected to any relays");
    }
    
    // Fetch post events - updated for nostr-tools v2.x
    const filter: Filter = {
      kinds: [KIND.POST],
      '#e': [threadId]
    };
    
    const relayUrls = relays.filter(r => r.status === 'connected' && r.read).map(r => r.url);
    const events = await pool.querySync(relayUrls, filter);
    
    // Parse post events
    const posts: Post[] = [];
    
    for (const event of events) {
      try {
        const postData = JSON.parse(event.content);
        
        // Extract references to other posts
        const references = event.tags
          .filter((tag: string[]) => tag[0] === 'e' && tag[3] === 'reply')
          .map((tag: string[]) => tag[1]);
        
        // Extract image URLs
        const images = event.tags
          .filter((tag: string[]) => tag[0] === 'image')
          .map((tag: string[]) => tag[1]);
        
        const post: Post = {
          id: event.id,
          threadId,
          content: postData.content,
          images: images.length > 0 ? images : postData.images || [],
          media: postData.media || [],
          authorPubkey: event.pubkey,
          createdAt: event.created_at,
          references
        };
        
        posts.push(post);
        localCache.addPost(post);
      } catch (error) {
        console.error("Failed to parse post event", event, error);
      }
    }
    
    return posts.sort((a, b) => a.createdAt - b.createdAt);
  }, [pool, relays]);

  // Create a new thread
  const createThread = useCallback(async (
    boardId: string, 
    title: string, 
    content: string, 
    imageUrls: string[],
    media?: MediaContent[]
  ): Promise<Thread> => {
    if (!pool) {
      throw new Error("Not connected to any relays");
    }
    
    console.log("Creating thread with:", {
      boardId,
      title,
      contentLength: content.length,
      imageCount: imageUrls.length,
      mediaCount: media?.length || 0,
      identityExists: !!identity,
      identityType: {
        pubkey: identity.pubkey,
        privkeyType: typeof identity.privkey,
        isUint8Array: identity.privkey instanceof Uint8Array,
        privkeyEmpty: typeof identity.privkey === 'string' ? identity.privkey.length === 0 : false
      }
    });
    
    // Check if we have a valid identity with a private key
    // If not, regenerate it before proceeding
    let currentIdentity = {...identity};
    
    if (!currentIdentity.privkey || 
        (typeof currentIdentity.privkey === 'string' && currentIdentity.privkey.length === 0)) {
      console.warn("Identity missing private key, regenerating...");
      
      // Import necessary functions from nostr-tools
      const { generateSecretKey, getPublicKey } = await import("nostr-tools");
      
      // Generate a new key pair
      const newPrivkey = generateSecretKey();
      const pubkey = getPublicKey(newPrivkey);
      
      // Convert private key to hex string for storage
      const privkeyHex = Array.from(newPrivkey)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Create new identity
      currentIdentity = {
        pubkey,
        privkey: privkeyHex,
        profile: { name: "Anonymous" }
      };
      
      // Save the new identity and update state
      await import("../lib/nostr").then(({ saveIdentity }) => {
        const savedIdentity = saveIdentity(currentIdentity);
        updateIdentity(savedIdentity);
      });
      
      console.log("Regenerated identity:", {
        pubkey: pubkey,
        privkeyLength: privkeyHex.length
      });
    }
    
    // Create and publish thread event
    let createdEvent: NostrEvent;
    try {
      const { createThreadEvent } = await import("../lib/nostr");
      console.log("Imported createThreadEvent function");
      
      createdEvent = await createThreadEvent(
        boardId, 
        title, 
        content, 
        imageUrls, 
        currentIdentity, // Use the potentially regenerated identity
        media as any
      );
      
      console.log("Thread event created successfully:", {
        eventId: createdEvent.id,
        eventKind: createdEvent.kind,
        tagsCount: createdEvent.tags.length
      });
      
      await publishEvent(createdEvent);
      console.log("Successfully published thread event to relays");
    } catch (error) {
      console.error("Error in thread creation:", error);
      // Show detailed error and stack trace
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Stack trace:", error.stack);
      }
      throw error; // Re-throw to allow the caller to handle it
    }
    
    // Create thread object using the successfully created event
    const thread: Thread = {
      id: createdEvent.id,
      boardId,
      title,
      content,
      images: imageUrls,
      media: media,
      authorPubkey: identity.pubkey,
      createdAt: createdEvent.created_at,
      replyCount: 0,
      lastReplyTime: createdEvent.created_at
    };
    
    // Add to local cache
    localCache.addThread(thread);
    
    // Save to localStorage for improved thread discovery
    try {
      // Get existing threads for this board
      const savedThreadsStr = localStorage.getItem(`thread-${boardId}`);
      let savedThreads: Thread[] = [];
      
      if (savedThreadsStr) {
        try {
          savedThreads = JSON.parse(savedThreadsStr);
        } catch (e) {
          console.error("Failed to parse saved threads", e);
        }
      }
      
      // Add new thread to the array
      savedThreads = [thread, ...savedThreads];
      
      // Save back to localStorage
      localStorage.setItem(`thread-${boardId}`, JSON.stringify(savedThreads));
      console.log(`Saved thread to localStorage for board ${boardId}`);
      
      // Also save the thread ID separately for easier lookup
      const threadIdsStr = localStorage.getItem('created-thread-ids') || '[]';
      try {
        const threadIds = JSON.parse(threadIdsStr);
        threadIds.push(thread.id);
        localStorage.setItem('created-thread-ids', JSON.stringify(threadIds));
      } catch (e) {
        console.error("Failed to save thread ID to localStorage", e);
      }
    } catch (error) {
      console.error("Error saving thread to localStorage:", error);
    }
    
    // Increment thread count for board
    const board = localCache.getBoard(boardId);
    if (board) {
      board.threadCount++;
      localCache.addBoard(board);
      
      // Update board list in state
      setBoards(prev => prev.map(b => 
        b.id === boardId ? { ...b, threadCount: b.threadCount + 1 } : b
      ));
    }
    
    return thread;
  }, [pool, identity, publishEvent]);

  // Create a new post (reply)
  const createPost = useCallback(async (
    threadId: string, 
    content: string, 
    replyToIds: string[] = [], 
    imageUrls: string[] = [],
    media?: MediaContent[]
  ): Promise<Post> => {
    if (!pool) {
      throw new Error("Not connected to any relays");
    }
    
    console.log("Creating post with:", {
      threadId,
      contentLength: content.length,
      replyCount: replyToIds.length,
      imageCount: imageUrls.length,
      mediaCount: media?.length || 0,
      identityExists: !!identity,
      identityType: {
        pubkey: identity.pubkey,
        privkeyType: typeof identity.privkey,
        isUint8Array: identity.privkey instanceof Uint8Array,
        privkeyEmpty: typeof identity.privkey === 'string' ? identity.privkey.length === 0 : false
      }
    });
    
    // Check if we have a valid identity with a private key
    // If not, regenerate it before proceeding
    let currentIdentity = {...identity};
    
    if (!currentIdentity.privkey || 
        (typeof currentIdentity.privkey === 'string' && currentIdentity.privkey.length === 0)) {
      console.warn("Identity missing private key, regenerating...");
      
      // Import necessary functions from nostr-tools
      const { generateSecretKey, getPublicKey } = await import("nostr-tools");
      
      // Generate a new key pair
      const newPrivkey = generateSecretKey();
      const pubkey = getPublicKey(newPrivkey);
      
      // Convert private key to hex string for storage
      const privkeyHex = Array.from(newPrivkey)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Create new identity
      currentIdentity = {
        pubkey,
        privkey: privkeyHex,
        profile: { name: "Anonymous" }
      };
      
      // Save the new identity and update state
      await import("../lib/nostr").then(({ saveIdentity }) => {
        const savedIdentity = saveIdentity(currentIdentity);
        updateIdentity(savedIdentity);
      });
      
      console.log("Regenerated identity:", {
        pubkey: pubkey,
        privkeyLength: privkeyHex.length
      });
    }
    
    // Create and publish post event
    let createdEvent: NostrEvent;
    try {
      const { createPostEvent } = await import("../lib/nostr");
      createdEvent = await createPostEvent(
        threadId, 
        content, 
        replyToIds, 
        imageUrls, 
        currentIdentity, // Use the potentially regenerated identity 
        media as any
      );
      
      console.log("Post event created successfully:", {
        eventId: createdEvent.id,
        eventKind: createdEvent.kind,
        tagsCount: createdEvent.tags.length
      });
      
      await publishEvent(createdEvent);
    } catch (error) {
      console.error("Error in post creation:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Stack trace:", error.stack);
      }
      throw error;
    }
    
    // Create post object
    const post: Post = {
      id: createdEvent.id,
      threadId,
      content,
      images: imageUrls,
      media: media,
      authorPubkey: identity.pubkey,
      createdAt: createdEvent.created_at,
      references: replyToIds
    };
    
    // Add to local cache
    localCache.addPost(post);
    
    return post;
  }, [pool, identity, publishEvent]);

  // Subscribe to a thread
  const subscribeToThread = useCallback(async (
    threadId: string,
    notifyOnReplies: boolean = true,
    notifyOnMentions: boolean = true
  ): Promise<ThreadSubscription> => {
    // Check if thread exists
    const thread = await getThread(threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    
    // Check if already subscribed
    const existingSub = localCache.getSubscriptionByThreadId(threadId);
    if (existingSub) {
      return existingSub;
    }
    
    // Create and publish subscription event
    let createdEvent: NostrEvent;
    try {
      const { createSubscriptionEvent } = await import("../lib/nostr");
      createdEvent = await createSubscriptionEvent(
        threadId, 
        notifyOnReplies, 
        notifyOnMentions, 
        identity
      );
      
      // Try to publish to relays if connected (best effort)
      if (pool) {
        await publishEvent(createdEvent);
      }
    } catch (error) {
      console.warn("Could not publish subscription to relays:", error);
      // Continue anyway - we'll create a local subscription
      throw error;
    }
    
    // Create subscription object
    const subscription: ThreadSubscription = {
      id: createdEvent.id,
      threadId,
      title: thread.title,
      notifyOnReplies,
      notifyOnMentions,
      createdAt: createdEvent.created_at
    };
    
    // Store in local cache
    localCache.addSubscription(subscription);
    
    // Create a notification for the subscription
    const notificationId = Math.random().toString(36).substring(2, 15);
    const notification: Notification = {
      id: notificationId,
      recipientPubkey: identity.pubkey,
      title: "Subscription Activated",
      message: `You are now subscribed to thread: ${thread.title || 'Untitled Thread'}`,
      threadId,
      read: false,
      createdAt: Math.floor(Date.now() / 1000)
    };
    
    localCache.addNotification(notification);
    
    return subscription;
  }, [identity, publishEvent, getThread, pool]);
  
  // Unsubscribe from a thread
  const unsubscribeFromThread = useCallback(async (subscriptionId: string): Promise<void> => {
    // Get subscription from cache
    const subscription = localCache.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    
    // Try to create and publish unsubscribe event if connected
    try {
      if (pool) {
        const { removeSubscriptionEvent } = await import("../lib/nostr");
        const createdEvent = await removeSubscriptionEvent(subscriptionId, identity);
        
        console.log("Unsubscribe event created successfully:", {
          eventId: createdEvent.id,
          eventKind: createdEvent.kind
        });
        
        await publishEvent(createdEvent);
      }
    } catch (error) {
      console.warn("Could not publish unsubscribe event to relays:", error);
      // Continue anyway - we'll remove from local cache
    }
    
    // Remove from local cache
    localCache.removeSubscription(subscriptionId);
    
    // Create a notification for unsubscribing
    const notificationId = Math.random().toString(36).substring(2, 15);
    const threadTitle = subscription.title || 'Untitled Thread';
    const notification: Notification = {
      id: notificationId,
      recipientPubkey: identity.pubkey,
      title: "Unsubscribed",
      message: `You are no longer subscribed to: ${threadTitle}`,
      threadId: subscription.threadId,
      read: false,
      createdAt: Math.floor(Date.now() / 1000)
    };
    
    localCache.addNotification(notification);
  }, [identity, publishEvent, pool]);
  
  // Get all thread subscriptions for the current user
  const getThreadSubscriptions = useCallback(async (): Promise<ThreadSubscription[]> => {
    // Get from local cache
    return localCache.getAllSubscriptions();
  }, []);
  
  // Check if user is subscribed to a thread
  const isSubscribedToThread = useCallback(async (threadId: string): Promise<boolean> => {
    const subscription = localCache.getSubscriptionByThreadId(threadId);
    return !!subscription;
  }, []);
  
  // Get notifications for the current user
  const getNotifications = useCallback(async (
    includeRead: boolean = false,
    limit: number = 50
  ): Promise<Notification[]> => {
    // Get from local cache
    return localCache.getAllNotifications(includeRead).slice(0, limit);
  }, []);
  
  // Mark a notification as read
  const markNotificationRead = useCallback(async (notificationId: string): Promise<void> => {
    localCache.markNotificationAsRead(notificationId);
  }, []);
  
  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(async (): Promise<void> => {
    localCache.markAllNotificationsAsRead();
  }, []);
  
  // Get count of unread notifications
  const getUnreadNotificationCount = useCallback(async (): Promise<number> => {
    return localCache.getUnreadNotificationCount();
  }, []);
  
  // Thread statistics cache to avoid excessive relay queries
  const threadStatsCache = React.useRef<Record<string, { viewCount: number, engagement: number, lastUpdated: number }>>({});
  
  // Get thread statistics (views, engagement)
  const getThreadStats = useCallback(async (threadId: string): Promise<{ viewCount: number, engagement: number } | null> => {
    if (!threadId) return null;
    
    // Check if we have cached stats for this thread
    if (threadStatsCache.current[threadId]) {
      // Return cached stats if they're recent (less than 5 minutes old)
      const stats = threadStatsCache.current[threadId];
      const now = Date.now();
      if (now - stats.lastUpdated < 300000) { // 5 minutes
        return {
          viewCount: stats.viewCount,
          engagement: stats.engagement
        };
      }
    }
    
    try {
      if (!pool) return null;
      
      // Use connected relays to fetch stats
      const relayUrls = relays
        .filter(r => r.status === 'connected' && r.read)
        .map(r => r.url);
      
      if (relayUrls.length === 0) {
        console.log("No connected relays to fetch thread stats");
        return null;
      }

      // Try to fetch view count events related to this thread
      const filter: Filter = {
        kinds: [KIND.THREAD_STATS],
        '#e': [threadId],
        limit: 10
      };
      
      const viewEvents = await pool.querySync(relayUrls, filter);
      
      if (viewEvents.length === 0) {
        // If no events found, create default stats and return them
        const defaultStats = { viewCount: 0, engagement: 0 };
        threadStatsCache.current[threadId] = { ...defaultStats, lastUpdated: Date.now() };
        return defaultStats;
      }
      
      // Process the events to calculate stats
      let totalViews = 0;
      let totalEngagement = 0;
      
      for (const event of viewEvents) {
        try {
          const data = JSON.parse(event.content);
          if (typeof data.viewCount === 'number') {
            totalViews = Math.max(totalViews, data.viewCount);
          }
          if (typeof data.engagement === 'number') {
            totalEngagement = Math.max(totalEngagement, data.engagement);
          }
        } catch (error) {
          console.error("Error parsing thread stats event:", error);
        }
      }
      
      // Update cache
      const updatedStats = { 
        viewCount: totalViews, 
        engagement: totalEngagement 
      };
      threadStatsCache.current[threadId] = { ...updatedStats, lastUpdated: Date.now() };
      
      return updatedStats;
      
    } catch (error) {
      console.error("Error fetching thread stats:", error);
      return { viewCount: 0, engagement: 0 };
    }
  }, [pool, relays]);

  // Initialize and validate identity on mount
  useEffect(() => {
    // Check if we have a valid identity with a private key
    console.log("Checking identity on app mount:", {
      hasPrivkey: !!identity.privkey,
      privkeyType: typeof identity.privkey,
      privkeyEmpty: typeof identity.privkey === 'string' ? identity.privkey.length === 0 : false,
      pubkey: identity.pubkey
    });
    
    // If privkey is missing or empty, regenerate it immediately
    if (!identity.privkey || 
        (typeof identity.privkey === 'string' && identity.privkey.length === 0)) {
      console.warn("Identity missing private key on app mount, regenerating...");
      
      // Use an IIFE to avoid top-level await
      (async () => {
        try {
          // Import necessary functions from nostr-tools
          const { generateSecretKey, getPublicKey } = await import("nostr-tools");
          
          // Generate a new key pair
          const newPrivkey = generateSecretKey();
          const pubkey = getPublicKey(newPrivkey);
          
          // Convert private key to hex string for storage
          const privkeyHex = Array.from(newPrivkey)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('');
          
          // Create new identity
          const newIdentity = {
            pubkey,
            privkey: privkeyHex,
            profile: { name: "Anonymous" }
          };
          
          // Save and update identity
          await import("../lib/nostr").then(({ saveIdentity }) => {
            const savedIdentity = saveIdentity(newIdentity);
            setIdentity(savedIdentity);
          });
          
          console.log("Regenerated identity on app mount:", {
            pubkey: pubkey,
            privkeyLength: privkeyHex.length
          });
        } catch (error) {
          console.error("Error regenerating identity on app mount:", error);
        }
      })();
    }
    
    // Auto-connect to relays if enabled
    if (autoConnect && !pool && !isConnecting && relays.length > 0) {
      connect();
    }
    
    return () => {
      if (pool) {
        pool.close(["cleanup"]); // Provide a reason for closing as required by v2.x API
      }
    };
  }, []);
  
  // Auto-connect to relays if needed
  useEffect(() => {
    // If autoConnect is enabled and no connections, attempt to connect
    if (autoConnect && !pool && !isConnecting && relays.length > 0) {
      console.log("Auto-connecting to relays...");
      connect();
    }
  }, [autoConnect, pool, isConnecting, relays, connect]);
  
  // Auto-reconnect if all connections fail
  useEffect(() => {
    // If we have a pool but no connected relays, attempt to reconnect
    if (pool && autoReconnect && connectedRelays === 0 && !isConnecting) {
      console.log("No connected relays. Attempting to reconnect in 8 seconds...");
      
      // Use a longer timeout to avoid rapid reconnection attempts
      const timer = setTimeout(() => {
        console.log("Auto-reconnecting...");
        
        // First try to get the current relays working
        const connectAttempt = async () => {
          try {
            // Try a full disconnect/connect cycle
            disconnect();
            
            // Add a small delay between disconnect and connect
            setTimeout(() => {
              connect();
            }, 1000);
          } catch (error) {
            console.error("Reconnection error:", error);
          }
        };
        
        connectAttempt();
      }, 8000); // Increased from 5s to 8s
      
      return () => clearTimeout(timer);
    }
  }, [autoReconnect, pool, connectedRelays, isConnecting, disconnect, connect]);
  
  // Create initial boards if empty when connected
  useEffect(() => {
    if (boards.length === 0 && pool && connectedRelays > 0) {
      // Automatically create standard boards if needed
      const initialBoards = [
        { shortName: "b", name: "Random", description: "Random discussions and topics" },
        { shortName: "tech", name: "Technology", description: "Technology, programming, hardware and software discussions" },
        { shortName: "art", name: "Artwork", description: "Share and discuss art, drawings, and creative works" },
        { shortName: "meta", name: "Meta", description: "Discussions about NostrChan itself" },
      ];
      
      (async () => {
        const existingBoards = await loadBoards();
        
        if (existingBoards.length === 0) {
          for (const board of initialBoards) {
            try {
              await createBoard(board.shortName, board.name, board.description);
            } catch (error) {
              console.error(`Failed to create default board /${board.shortName}/`, error);
            }
          }
        }
      })();
    }
  }, [pool, connectedRelays, boards.length, loadBoards, createBoard]);

  const contextValue: NostrContextType = {
    pool,
    identity,
    relays,
    boards,
    connectedRelays,
    isConnecting,
    connect,
    disconnect,
    updateIdentity,
    addRelay,
    removeRelay,
    updateRelay,
    saveRelaySettings,
    publishEvent,
    loadBoards,
    createBoard,
    getThreadsByBoard,
    getThread,
    getPostsByThread,
    createThread,
    createPost,
    // Thread subscriptions
    subscribeToThread,
    unsubscribeFromThread,
    getThreadSubscriptions,
    isSubscribedToThread,
    // Notifications
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadNotificationCount,
    // Thread statistics
    getThreadStats
  };

  return (
    <NostrContext.Provider value={contextValue}>
      {children}
    </NostrContext.Provider>
  );
};

export const useNostr = () => {
  const context = useContext(NostrContext);
  if (context === undefined) {
    throw new Error("useNostr must be used within a NostrProvider");
  }
  return context;
};
