import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SimplePool } from "nostr-tools";
import { 
  NostrEvent, 
  NostrIdentity, 
  Relay, 
  Board, 
  Thread, 
  Post 
} from "../types";
import { 
  createPool, 
  getOrCreateIdentity, 
  saveIdentity, 
  getSavedRelays, 
  saveRelays, 
  KIND 
} from "../lib/nostr";
import { localCache } from "../lib/storage";

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
  loadBoards: () => Promise<void>;
  createBoard: (shortName: string, name: string, description: string) => Promise<Board>;
  getThreadsByBoard: (boardId: string) => Promise<Thread[]>;
  getThread: (threadId: string) => Promise<Thread | undefined>;
  getPostsByThread: (threadId: string) => Promise<Post[]>;
  createThread: (boardId: string, title: string, content: string, imageUrls: string[]) => Promise<Thread>;
  createPost: (threadId: string, content: string, replyToIds: string[], imageUrls: string[]) => Promise<Post>;
}

const NostrContext = createContext<NostrContextType | undefined>(undefined);

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

  // Connect to relays
  const connect = useCallback(async () => {
    if (isConnecting || pool) return;
    
    setIsConnecting(true);
    const newPool = createPool();
    
    const relayUrls = relays.map(r => r.url);
    const updatedRelays = [...relays];
    
    let connected = 0;
    
    // Connect to each relay
    for (let i = 0; i < updatedRelays.length; i++) {
      const relay = updatedRelays[i];
      relay.status = 'connecting';
      setRelays([...updatedRelays]);
      
      try {
        await newPool.ensureRelay(relay.url);
        relay.status = 'connected';
        connected++;
      } catch (error) {
        console.error(`Failed to connect to relay: ${relay.url}`, error);
        relay.status = 'error';
      }
      
      setRelays([...updatedRelays]);
    }
    
    setConnectedRelays(connected);
    setPool(newPool);
    setIsConnecting(false);
    
    // Load boards after connecting
    loadBoards();
  }, [isConnecting, pool, relays]);

  // Disconnect from all relays
  const disconnect = useCallback(() => {
    if (pool) {
      pool.close();
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

  // Load boards from relays
  const loadBoards = useCallback(async () => {
    if (!pool) {
      throw new Error("Not connected to any relays");
    }
    
    // Get all board definition events
    const events = await pool.list(
      relays.filter(r => r.status === 'connected' && r.read).map(r => r.url),
      [
        {
          kinds: [KIND.BOARD_DEFINITION],
        }
      ]
    );
    
    // Parse and store boards
    const loadedBoards: Board[] = [];
    const uniqueBoards = new Map<string, Board>();
    
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
    
    // Fetch thread events from relays
    const events = await pool.list(
      relays.filter(r => r.status === 'connected' && r.read).map(r => r.url),
      [
        {
          kinds: [KIND.THREAD],
          '#board': [boardId]
        }
      ]
    );
    
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
    
    // Fetch thread event
    const events = await pool.list(
      relays.filter(r => r.status === 'connected' && r.read).map(r => r.url),
      [
        {
          kinds: [KIND.THREAD],
          ids: [threadId]
        }
      ]
    );
    
    if (events.length === 0) {
      return undefined;
    }
    
    try {
      const event = events[0];
      const threadData = JSON.parse(event.content);
      
      // Find the board ID from the tags
      const boardTag = event.tags.find(tag => tag[0] === 'board');
      const boardId = boardTag ? boardTag[1] : "";
      
      const thread: Thread = {
        id: event.id,
        boardId,
        title: threadData.title,
        content: threadData.content,
        images: threadData.images || [],
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
    
    // Fetch post events
    const events = await pool.list(
      relays.filter(r => r.status === 'connected' && r.read).map(r => r.url),
      [
        {
          kinds: [KIND.POST],
          '#e': [threadId]
        }
      ]
    );
    
    // Parse post events
    const posts: Post[] = [];
    
    for (const event of events) {
      try {
        const postData = JSON.parse(event.content);
        
        // Extract references to other posts
        const references = event.tags
          .filter(tag => tag[0] === 'e' && tag[3] === 'reply')
          .map(tag => tag[1]);
        
        // Extract image URLs
        const images = event.tags
          .filter(tag => tag[0] === 'image')
          .map(tag => tag[1]);
        
        const post: Post = {
          id: event.id,
          threadId,
          content: postData.content,
          images: images.length > 0 ? images : postData.images || [],
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
    imageUrls: string[]
  ): Promise<Thread> => {
    if (!pool) {
      throw new Error("Not connected to any relays");
    }
    
    // Create and publish thread event
    const event = await import("../lib/nostr").then(({ createThreadEvent }) => 
      createThreadEvent(boardId, title, content, imageUrls, identity)
    );
    
    await publishEvent(event);
    
    // Create thread object
    const thread: Thread = {
      id: event.id,
      boardId,
      title,
      content,
      images: imageUrls,
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
    imageUrls: string[] = []
  ): Promise<Post> => {
    if (!pool) {
      throw new Error("Not connected to any relays");
    }
    
    // Create and publish post event
    const event = await import("../lib/nostr").then(({ createPostEvent }) => 
      createPostEvent(threadId, content, replyToIds, imageUrls, identity)
    );
    
    await publishEvent(event);
    
    // Create post object
    const post: Post = {
      id: event.id,
      threadId,
      content,
      images: imageUrls,
      authorPubkey: identity.pubkey,
      createdAt: event.created_at,
      references: replyToIds
    };
    
    // Add to local cache
    localCache.addPost(post);
    
    return post;
  }, [pool, identity, publishEvent]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !pool && !isConnecting && relays.length > 0) {
      connect();
    }
    
    return () => {
      if (pool) {
        pool.close();
      }
    };
  }, []);
  
  // Set initial default boards if empty
  useEffect(() => {
    if (boards.length === 0 && pool && connectedRelays > 0) {
      // Create some default boards if there are none yet
      const defaultBoards = [
        { shortName: "b", name: "Random", description: "Random discussions and topics" },
        { shortName: "tech", name: "Technology", description: "Technology, programming, hardware and software discussions" },
        { shortName: "art", name: "Artwork", description: "Share and discuss art, drawings, and creative works" },
        { shortName: "meta", name: "Meta", description: "Discussions about NostrChan itself" },
      ];
      
      (async () => {
        const existingBoards = await loadBoards();
        
        if (existingBoards.length === 0) {
          for (const board of defaultBoards) {
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
