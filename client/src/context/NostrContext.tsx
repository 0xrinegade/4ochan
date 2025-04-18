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

  // Connect to relays with better error handling
  const connect = useCallback(async () => {
    if (isConnecting || pool) return;
    
    setIsConnecting(true);
    const newPool = createPool();
    
    const updatedRelays = [...relays];
    let connected = 0;
    
    // Connect to each relay with 5 second timeout
    for (let i = 0; i < updatedRelays.length; i++) {
      const relay = updatedRelays[i];
      relay.status = 'connecting';
      setRelays([...updatedRelays]);
      
      try {
        // Create a promise that will reject after 5 seconds
        const connectWithTimeout = Promise.race([
          newPool.ensureRelay(relay.url),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 5000))
        ]);
        
        await connectWithTimeout;
        relay.status = 'connected';
        connected++;
        console.log(`Successfully connected to relay: ${relay.url}`);
      } catch (error) {
        console.error(`Failed to connect to relay: ${relay.url}`, error);
        relay.status = 'error';
        
        // If this relay failed, try to replace it with a working one later
        if (relay.url === "wss://relay.nostr.info") {
          relay.url = "wss://relay.damus.io";
          relay.status = 'disconnected';
          saveRelays(updatedRelays);
        }
      }
      
      setRelays([...updatedRelays]);
    }
    
    setConnectedRelays(connected);
    setPool(newPool);
    setIsConnecting(false);
    
    // Load boards after connecting
    if (connected > 0) {
      loadBoards();
    } else {
      console.error("Failed to connect to any relays");
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
    setIdentity(newIdentity);
    saveIdentity(newIdentity);
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
      throw new Error("Not connected to any relays");
    }
    
    // Publish to all writable relays
    const writeRelays = relays
      .filter(r => r.status === 'connected' && r.write)
      .map(r => r.url);
    
    if (writeRelays.length === 0) {
      throw new Error("No writable relays connected");
    }
    
    const pubs = pool.publish(writeRelays, event);
    
    // Wait for at least one successful publish
    try {
      await Promise.any(pubs);
    } catch (error) {
      console.error("Failed to publish event", error);
      throw new Error("Failed to publish to any relay");
    }
  }, [pool, relays]);

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
    
    // Check cache first
    const cachedThreads = localCache.getThreadsByBoard(boardId);
    if (cachedThreads.length > 0) {
      return cachedThreads;
    }
    
    // Fetch thread events from relays - updated for nostr-tools v2.x
    const filter: Filter = {
      kinds: [KIND.THREAD],
      '#board': [boardId]
    };
    
    const relayUrls = relays.filter(r => r.status === 'connected' && r.read).map(r => r.url);
    const events = await pool.querySync(relayUrls, filter);
    
    // Parse thread events
    const threads: Thread[] = [];
    
    for (const event of events) {
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
    
    // Fetch reply counts
    for (const thread of threads) {
      const replies = await getPostsByThread(thread.id);
      thread.replyCount = replies.length;
      thread.lastReplyTime = replies.length > 0 
        ? Math.max(...replies.map(r => r.createdAt))
        : thread.createdAt;
      
      localCache.addThread(thread);
    }
    
    return threads.sort((a, b) => 
      (b.lastReplyTime || b.createdAt) - (a.lastReplyTime || a.createdAt)
    );
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
    
    // Create and publish thread event
    const event = await import("../lib/nostr").then(({ createThreadEvent }) => 
      createThreadEvent(boardId, title, content, imageUrls, identity, media as any)
    );
    
    await publishEvent(event);
    
    // Create thread object
    const thread: Thread = {
      id: event.id,
      boardId,
      title,
      content,
      images: imageUrls,
      media: media,
      authorPubkey: identity.pubkey,
      createdAt: event.created_at,
      replyCount: 0,
      lastReplyTime: event.created_at
    };
    
    // Add to local cache
    localCache.addThread(thread);
    
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
    
    // Create and publish post event
    const event = await import("../lib/nostr").then(({ createPostEvent }) => 
      createPostEvent(threadId, content, replyToIds, imageUrls, identity, media as any)
    );
    
    await publishEvent(event);
    
    // Create post object
    const post: Post = {
      id: event.id,
      threadId,
      content,
      images: imageUrls,
      media: media,
      authorPubkey: identity.pubkey,
      createdAt: event.created_at,
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
    const event = await import("../lib/nostr").then(({ createSubscriptionEvent }) => 
      createSubscriptionEvent(threadId, notifyOnReplies, notifyOnMentions, identity)
    );
    
    try {
      // Try to publish to relays if connected (best effort)
      if (pool) {
        await publishEvent(event);
      }
    } catch (error) {
      console.warn("Could not publish subscription to relays:", error);
      // Continue anyway - we'll store locally
    }
    
    // Create subscription object
    const subscription: ThreadSubscription = {
      id: event.id,
      threadId,
      title: thread.title,
      notifyOnReplies,
      notifyOnMentions,
      createdAt: event.created_at
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
        const event = await import("../lib/nostr").then(({ removeSubscriptionEvent }) => 
          removeSubscriptionEvent(subscriptionId, identity)
        );
        
        await publishEvent(event);
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

  // Auto-connect on mount
  useEffect(() => {
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
    if (pool && autoReconnect && connectedRelays === 0 && !isConnecting) {
      console.log("No connected relays. Attempting to reconnect in 5 seconds...");
      
      const timer = setTimeout(() => {
        console.log("Auto-reconnecting...");
        disconnect();
        connect();
      }, 5000);
      
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
    getUnreadNotificationCount
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
