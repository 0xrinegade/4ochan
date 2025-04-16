import { useEffect, useState, useCallback } from "react";
import { useNostr } from "./useNostr";
import { Thread, Post } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useThreads = (boardId?: string) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getThreadsByBoard, createThread, connectedRelays } = useNostr();
  const { toast } = useToast();
  
  // Calculate activity score for sorting threads
  const calculateActivityScore = useCallback((thread: Thread): number => {
    const now = Date.now();
    const threadAge = (now - thread.createdAt) / (1000 * 60 * 60); // Age in hours
    const lastActivityTime = thread.lastReplyTime || thread.createdAt;
    const lastActivityAge = (now - lastActivityTime) / (1000 * 60 * 60); // Age in hours
    
    // Formula: (replies × 10) + recency factor
    // Higher scores = more active threads
    const replyScore = thread.replyCount * 10;
    const recencyScore = 100 / (1 + lastActivityAge); // Decays over time
    
    return replyScore + recencyScore;
  }, []);
  
  // Sort threads by activity score
  const sortThreadsByActivity = useCallback((threadList: Thread[]): Thread[] => {
    return [...threadList].sort((a, b) => {
      const scoreA = calculateActivityScore(a);
      const scoreB = calculateActivityScore(b);
      return scoreB - scoreA; // Higher scores first
    });
  }, [calculateActivityScore]);

  // Fetch threads for the given board
  const fetchThreads = useCallback(async () => {
    if (!boardId || connectedRelays === 0) return;
    
    setLoading(true);
    try {
      const fetchedThreads = await getThreadsByBoard(boardId);
      // Sort threads by activity score
      const sortedThreads = sortThreadsByActivity(fetchedThreads);
      setThreads(sortedThreads);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load threads");
      toast({
        title: "Error",
        description: "Failed to load threads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [boardId, getThreadsByBoard, connectedRelays, toast, sortThreadsByActivity]);

  // Periodically re-sort threads to update rankings
  useEffect(() => {
    if (threads.length === 0) return;
    
    // Re-sort threads every minute to update "king of the hill" rankings
    const interval = setInterval(() => {
      setThreads(prev => sortThreadsByActivity(prev));
    }, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [threads, sortThreadsByActivity]);

  // Fetch threads when board changes or connection is established
  useEffect(() => {
    if (boardId && connectedRelays > 0) {
      fetchThreads();
    }
    
    // Set up polling for new threads every 30 seconds
    const pollInterval = setInterval(() => {
      if (boardId && connectedRelays > 0) {
        fetchThreads();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(pollInterval);
  }, [boardId, connectedRelays, fetchThreads]);

  // Create a new thread
  const handleCreateThread = async (
    title: string,
    content: string,
    imageUrls: string[] = []
  ): Promise<Thread> => {
    if (!boardId) {
      throw new Error("Board ID is required to create a thread");
    }
    
    try {
      const newThread = await createThread(boardId, title, content, imageUrls);
      // Add the new thread and re-sort
      setThreads(prev => sortThreadsByActivity([newThread, ...prev]));
      toast({
        title: "Thread Created",
        description: "Your thread has been posted successfully",
      });
      return newThread;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create thread";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }
  };

  return {
    threads,
    loading,
    error,
    refreshThreads: fetchThreads,
    createThread: handleCreateThread,
  };
};

export const useThread = (threadId?: string) => {
  const [thread, setThread] = useState<Thread | undefined>(undefined);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getThread, getPostsByThread, createPost, connectedRelays } = useNostr();
  const { toast } = useToast();

  // Fetch thread and its posts
  const fetchThread = useCallback(async () => {
    if (!threadId || connectedRelays === 0) return;
    
    setLoading(true);
    try {
      const [fetchedThread, fetchedPosts] = await Promise.all([
        getThread(threadId),
        getPostsByThread(threadId)
      ]);
      
      setThread(fetchedThread);
      setPosts(fetchedPosts);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load thread");
      toast({
        title: "Error",
        description: "Failed to load thread or replies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [threadId, getThread, getPostsByThread, connectedRelays, toast]);

  // Fetch thread when ID changes or connection is established
  useEffect(() => {
    if (threadId && connectedRelays > 0) {
      fetchThread();
    }
  }, [threadId, connectedRelays, fetchThread]);

  // Create a new post (reply)
  const handleCreatePost = async (
    content: string,
    replyToIds: string[] = [],
    imageUrls: string[] = []
  ): Promise<Post> => {
    if (!threadId) {
      throw new Error("Thread ID is required to create a post");
    }
    
    try {
      const newPost = await createPost(threadId, content, replyToIds, imageUrls);
      setPosts(prev => [...prev, newPost]);
      
      // Update thread's reply count
      if (thread) {
        setThread({
          ...thread,
          replyCount: thread.replyCount + 1,
          lastReplyTime: Math.max(thread.lastReplyTime || thread.createdAt, newPost.createdAt)
        });
      }
      
      toast({
        title: "Reply Posted",
        description: "Your reply has been posted successfully",
      });
      
      return newPost;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to post reply";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }
  };

  return {
    thread,
    posts,
    loading,
    error,
    refreshThread: fetchThread,
    createPost: handleCreatePost,
  };
};
