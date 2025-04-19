import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useNostr } from '@/context/NostrContext';
import { ThreadSubscription, Notification } from '@/types';
import { timeAgo } from '@/lib/nostr';
import { navigateWithoutReload } from '@/App';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export const SubscriptionsPage: React.FC = () => {
  const { 
    getThreadSubscriptions, 
    unsubscribeFromThread, 
    getNotifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    getUnreadNotificationCount
  } = useNostr();
  const [subscriptions, setSubscriptions] = useState<ThreadSubscription[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState<boolean>(true);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(true);
  const { toast } = useToast();

  // Load subscriptions and notifications
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load subscriptions
        setLoadingSubscriptions(true);
        const subs = await getThreadSubscriptions();
        setSubscriptions(subs.sort((a, b) => b.createdAt - a.createdAt));
        setLoadingSubscriptions(false);
        
        // Load notifications
        setLoadingNotifications(true);
        const notifs = await getNotifications(false, 50); // Include read notifications, limit 50
        setNotifications(notifs.sort((a, b) => b.createdAt - a.createdAt));
        
        // Get unread count
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
        setLoadingNotifications(false);
      } catch (error) {
        console.error('Error loading subscriptions/notifications:', error);
        toast({
          title: "Error Loading Data",
          description: "There was a problem loading your subscriptions and notifications.",
          variant: "destructive"
        });
        setLoadingSubscriptions(false);
        setLoadingNotifications(false);
      }
    };
    
    loadData();
  }, [getThreadSubscriptions, getNotifications, getUnreadNotificationCount, toast]);
  
  // Unsubscribe from a thread
  const handleUnsubscribe = async (subscriptionId: string) => {
    try {
      await unsubscribeFromThread(subscriptionId);
      
      // Update local state
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
      
      toast({
        title: "Unsubscribed",
        description: "You have been unsubscribed from this thread.",
      });
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe from thread.",
        variant: "destructive"
      });
    }
  };
  
  // Mark notification as read and navigate to thread
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await markNotificationRead(notification.id);
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Navigate to thread if thread ID exists
      if (notification.threadId) {
        navigateWithoutReload(`/thread/${notification.threadId}`);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };
  
  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      toast({
        title: "Notifications Cleared",
        description: "All notifications have been marked as read.",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <Header />
        
        <main className="container mx-auto px-2 sm:px-4">
          <div className="mb-4">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center">
              <span className="mr-1">■</span> NOTIFICATIONS & SUBSCRIPTIONS
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <Tabs defaultValue="subscriptions" className="w-full">
                <TabsList className="w-full grid grid-cols-2 h-8 bg-[#c0c0c0] border border-black">
                  <TabsTrigger 
                    value="subscriptions" 
                    className="text-xs uppercase font-bold data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Thread Subscriptions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="text-xs uppercase font-bold data-[state=active]:bg-primary data-[state=active]:text-white relative"
                  >
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded-full absolute -top-1 -right-1">
                        {unreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                {/* Subscriptions Tab */}
                <TabsContent value="subscriptions" className="mt-2">
                  {loadingSubscriptions ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : subscriptions.length === 0 ? (
                    <div className="text-center p-8 bg-[#f0f0f0] border border-black">
                      <div className="text-sm mb-2">You are not subscribed to any threads.</div>
                      <p className="text-xs text-gray-500">
                        Subscribe to threads to receive notifications when there are new replies.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {subscriptions.map((subscription) => (
                        <div 
                          key={subscription.id}
                          className="border border-black p-2 bg-[#f4f4f4] flex justify-between items-center"
                        >
                          <div>
                            <div 
                              className="font-bold cursor-pointer hover:underline"
                              onClick={() => navigateWithoutReload(`/thread/${subscription.threadId}`)}
                            >
                              {subscription.title || "Untitled Thread"}
                            </div>
                            <div className="text-xs text-gray-700 mt-1">
                              Subscribed {timeAgo(subscription.createdAt)}
                              {subscription.notifyOnReplies && " • Notify on replies"}
                              {subscription.notifyOnMentions && " • Notify on mentions"}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => navigateWithoutReload(`/thread/${subscription.threadId}`)}
                              className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                              style={{ boxShadow: "2px 2px 0 #000" }}
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleUnsubscribe(subscription.id)}
                              className="text-xs bg-red-500 text-white font-bold py-0.5 px-2 border-2 border-black"
                              style={{ boxShadow: "2px 2px 0 #000" }}
                            >
                              Unsubscribe
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                {/* Notifications Tab */}
                <TabsContent value="notifications" className="mt-2">
                  {loadingNotifications ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center p-8 bg-[#f0f0f0] border border-black">
                      <div className="text-sm mb-2">You don't have any notifications.</div>
                      <p className="text-xs text-gray-500">
                        Notifications will appear here when you receive replies to subscribed threads.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mark all as read button */}
                      {unreadCount > 0 && (
                        <div className="flex justify-end mb-2">
                          <button 
                            onClick={handleMarkAllRead}
                            className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                            style={{ boxShadow: "2px 2px 0 #000" }}
                          >
                            Mark All as Read
                          </button>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`
                              border border-black p-2 cursor-pointer 
                              hover:bg-[#dbd1c0] relative
                              ${notification.read ? 'bg-[#f0f0f0]' : 'bg-[#fffdf7]'}
                            `}
                          >
                            <div className="flex justify-between items-start">
                              <div className="font-bold">{notification.title}</div>
                              <div className="text-xs text-gray-700">
                                {timeAgo(notification.createdAt)}
                              </div>
                            </div>
                            <div className="text-sm mt-1">{notification.message}</div>
                            
                            {/* Unread indicator dot */}
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary absolute top-2 right-2 rounded-full"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SubscriptionsPage;