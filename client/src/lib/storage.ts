import { Board, Thread, Post } from "../types";

// Local cache for boards, threads, and posts to reduce relay queries
class LocalCache {
  private boards: Map<string, Board>;
  private threads: Map<string, Thread>;
  private posts: Map<string, Post>;
  private threadsByBoard: Map<string, string[]>;
  private postsByThread: Map<string, string[]>;

  constructor() {
    this.boards = new Map<string, Board>();
    this.threads = new Map<string, Thread>();
    this.posts = new Map<string, Post>();
    this.threadsByBoard = new Map<string, string[]>();
    this.postsByThread = new Map<string, string[]>();
  }

  // Board methods
  addBoard(board: Board): void {
    this.boards.set(board.id, board);
  }

  getBoard(id: string): Board | undefined {
    return this.boards.get(id);
  }

  getAllBoards(): Board[] {
    return Array.from(this.boards.values());
  }

  // Thread methods
  addThread(thread: Thread): void {
    this.threads.set(thread.id, thread);
    
    // Update the board's thread list
    const threads = this.threadsByBoard.get(thread.boardId) || [];
    if (!threads.includes(thread.id)) {
      threads.push(thread.id);
      this.threadsByBoard.set(thread.boardId, threads);
    }
  }

  getThread(id: string): Thread | undefined {
    return this.threads.get(id);
  }

  getThreadsByBoard(boardId: string): Thread[] {
    const threadIds = this.threadsByBoard.get(boardId) || [];
    return threadIds
      .map(id => this.threads.get(id))
      .filter((thread): thread is Thread => thread !== undefined)
      .sort((a, b) => b.lastReplyTime || b.createdAt - (a.lastReplyTime || a.createdAt));
  }

  // Post methods
  addPost(post: Post): void {
    this.posts.set(post.id, post);
    
    // Update the thread's post list
    const posts = this.postsByThread.get(post.threadId) || [];
    if (!posts.includes(post.id)) {
      posts.push(post.id);
      this.postsByThread.set(post.threadId, posts);
    }
    
    // Update thread's reply count and last reply time
    const thread = this.threads.get(post.threadId);
    if (thread) {
      thread.replyCount = (thread.replyCount || 0) + 1;
      thread.lastReplyTime = Math.max(post.createdAt, thread.lastReplyTime || 0);
      this.threads.set(post.threadId, thread);
    }
  }

  getPost(id: string): Post | undefined {
    return this.posts.get(id);
  }

  getPostsByThread(threadId: string): Post[] {
    const postIds = this.postsByThread.get(threadId) || [];
    return postIds
      .map(id => this.posts.get(id))
      .filter((post): post is Post => post !== undefined)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  // Clear caches
  clearCache(): void {
    this.boards.clear();
    this.threads.clear();
    this.posts.clear();
    this.threadsByBoard.clear();
    this.postsByThread.clear();
  }
}

// Create and export a singleton instance
export const localCache = new LocalCache();
