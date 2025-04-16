import { Board, Thread, Post, ThreadSubscription, Notification } from "../types";

// Local cache for boards, threads, posts, subscriptions and notifications to reduce relay queries
class LocalCache {
  private boards: Map<string, Board>;
  private threads: Map<string, Thread>;
  private posts: Map<string, Post>;
  private threadsByBoard: Map<string, string[]>;
  private postsByThread: Map<string, string[]>;
  private subscriptions: Map<string, ThreadSubscription>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.boards = new Map<string, Board>();
    this.threads = new Map<string, Thread>();
    this.posts = new Map<string, Post>();
    this.threadsByBoard = new Map<string, string[]>();
    this.postsByThread = new Map<string, string[]>();
    this.subscriptions = new Map<string, ThreadSubscription>();
    this.notifications = new Map<string, Notification>();
    
    // Load from localStorage if available
    this.loadFromLocalStorage();
  }
  
  // Load data from localStorage
  private loadFromLocalStorage(): void {
    try {
      // Load subscriptions
      const savedSubscriptions = localStorage.getItem('nostr-subscriptions');
      if (savedSubscriptions) {
        const parsedSubscriptions: ThreadSubscription[] = JSON.parse(savedSubscriptions);
        parsedSubscriptions.forEach(sub => this.subscriptions.set(sub.id, sub));
      }
      
      // Load notifications
      const savedNotifications = localStorage.getItem('nostr-notifications');
      if (savedNotifications) {
        const parsedNotifications: Notification[] = JSON.parse(savedNotifications);
        parsedNotifications.forEach(notification => this.notifications.set(notification.id, notification));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }
  
  // Save data to localStorage
  private saveToLocalStorage(): void {
    try {
      // Save subscriptions
      localStorage.setItem(
        'nostr-subscriptions', 
        JSON.stringify(Array.from(this.subscriptions.values()))
      );
      
      // Save notifications
      localStorage.setItem(
        'nostr-notifications', 
        JSON.stringify(Array.from(this.notifications.values()))
      );
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
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

  // Subscription methods
  addSubscription(subscription: ThreadSubscription): void {
    this.subscriptions.set(subscription.id, subscription);
    this.saveToLocalStorage();
  }
  
  getSubscription(id: string): ThreadSubscription | undefined {
    return this.subscriptions.get(id);
  }
  
  getSubscriptionByThreadId(threadId: string): ThreadSubscription | undefined {
    return Array.from(this.subscriptions.values()).find(sub => sub.threadId === threadId);
  }
  
  getAllSubscriptions(): ThreadSubscription[] {
    return Array.from(this.subscriptions.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  
  removeSubscription(id: string): void {
    this.subscriptions.delete(id);
    this.saveToLocalStorage();
  }
  
  // Notification methods
  addNotification(notification: Notification): void {
    this.notifications.set(notification.id, notification);
    this.saveToLocalStorage();
  }
  
  getNotification(id: string): Notification | undefined {
    return this.notifications.get(id);
  }
  
  getAllNotifications(includeRead: boolean = false): Notification[] {
    return Array.from(this.notifications.values())
      .filter(notification => includeRead || !notification.read)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  
  markNotificationAsRead(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      notification.readAt = Math.floor(Date.now() / 1000);
      this.notifications.set(id, notification);
      this.saveToLocalStorage();
    }
  }
  
  markAllNotificationsAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
      notification.readAt = Math.floor(Date.now() / 1000);
    });
    this.saveToLocalStorage();
  }
  
  getUnreadNotificationCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.read).length;
  }
  
  // Clear caches
  clearCache(): void {
    this.boards.clear();
    this.threads.clear();
    this.posts.clear();
    this.threadsByBoard.clear();
    this.postsByThread.clear();
    // Don't clear subscriptions and notifications as they are persistent
  }
}

// Create and export a singleton instance
export const localCache = new LocalCache();
