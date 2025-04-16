import React, { useState, useEffect } from 'react';
import { useNostr } from '../context/NostrContext';
import { ThreadSubscribeButton } from '../components/ThreadSubscribeButton';
import { NotificationBell } from '../components/NotificationBell';

export const TestPage: React.FC = () => {
  const { 
    connect, 
    identity, 
    relays, 
    connectedRelays, 
    loadBoards, 
    createBoard, 
    createThread,
    getThreadSubscriptions,
    getNotifications,
    markAllNotificationsRead
  } = useNostr();
  
  const [boards, setBoards] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [testThreadId, setTestThreadId] = useState<string>('');
  
  // Generate a random test thread ID if none exists
  useEffect(() => {
    if (!testThreadId) {
      const randomId = Math.random().toString(36).substring(2, 15);
      setTestThreadId(randomId);
    }
  }, [testThreadId]);
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedBoards = await loadBoards();
        setBoards(loadedBoards);
        
        const loadedSubscriptions = await getThreadSubscriptions();
        setSubscriptions(loadedSubscriptions);
        
        const loadedNotifications = await getNotifications(true);
        setNotifications(loadedNotifications);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };
    
    loadData();
  }, [loadBoards, getThreadSubscriptions, getNotifications]);
  
  // Create test data
  const handleCreateTestBoard = async () => {
    try {
      const board = await createBoard(
        'test',
        'Test Board',
        'A test board for development'
      );
      setBoards([...boards, board]);
      return board;
    } catch (error) {
      console.error("Error creating test board:", error);
    }
  };
  
  const handleCreateTestThread = async () => {
    try {
      // Find or create a test board
      let testBoard = boards.find(b => b.shortName === 'test');
      if (!testBoard) {
        testBoard = await handleCreateTestBoard();
      }
      
      if (testBoard) {
        const thread = await createThread(
          testBoard.id,
          'Test Thread',
          'This is a test thread for development purposes',
          [],
          []
        );
        setThreads([...threads, thread]);
        setTestThreadId(thread.id);
      }
    } catch (error) {
      console.error("Error creating test thread:", error);
    }
  };
  
  const refreshData = async () => {
    try {
      const loadedSubscriptions = await getThreadSubscriptions();
      setSubscriptions(loadedSubscriptions);
      
      const loadedNotifications = await getNotifications(true);
      setNotifications(loadedNotifications);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };
  
  const createTestNotification = async () => {
    try {
      // Create a test notification directly in local storage
      const notificationId = Math.random().toString(36).substring(2, 15);
      const notification = {
        id: notificationId,
        recipientPubkey: identity.pubkey,
        title: "Test Notification",
        message: `This is a test notification created at ${new Date().toLocaleTimeString()}`,
        threadId: testThreadId,
        read: false,
        createdAt: Math.floor(Date.now() / 1000)
      };
      
      // Add to cache using localCache
      import('../lib/storage').then(({ localCache }) => {
        localCache.addNotification(notification);
        refreshData();
      });
    } catch (error) {
      console.error("Error creating test notification:", error);
    }
  };
  
  const clearAllNotifications = async () => {
    try {
      await markAllNotificationsRead();
      refreshData();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 uppercase">System Test Page</h1>
      
      <div className="bg-[#e0e0e0] border-2 border-black p-4 mb-4">
        <h2 className="text-xl font-bold mb-2 uppercase">Connection Status</h2>
        <p><strong>Pubkey:</strong> {identity.pubkey.substring(0, 8)}...</p>
        <p><strong>Connected Relays:</strong> {connectedRelays}/{relays.length}</p>
        <button 
          onClick={() => connect()}
          className="px-2 py-1 bg-[#c0c0c0] border-2 border-black mt-2"
        >
          Connect
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#e0e0e0] border-2 border-black p-4">
          <h2 className="text-xl font-bold mb-2 uppercase">Test Thread Subscription</h2>
          
          <div className="mb-2">
            <p><strong>Test Thread ID:</strong> {testThreadId || 'None'}</p>
            
            {testThreadId && (
              <div className="mt-2">
                <ThreadSubscribeButton 
                  threadId={testThreadId} 
                  threadTitle="Test Thread" 
                />
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <button 
              onClick={handleCreateTestThread}
              className="px-2 py-1 bg-[#c0c0c0] border-2 border-black mr-2"
            >
              Create Test Thread
            </button>
            
            <button 
              onClick={refreshData}
              className="px-2 py-1 bg-[#c0c0c0] border-2 border-black"
            >
              Refresh
            </button>
          </div>
          
          <div className="mt-4">
            <h3 className="font-bold">Subscriptions:</h3>
            {subscriptions.length === 0 ? (
              <p>No subscriptions</p>
            ) : (
              <ul className="list-disc ml-5">
                {subscriptions.map(sub => (
                  <li key={sub.id}>
                    {sub.title || sub.threadId.substring(0, 8)}...
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="bg-[#e0e0e0] border-2 border-black p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold uppercase">Notifications</h2>
            <NotificationBell />
          </div>
          
          <div className="flex space-x-2 mb-4">
            <button 
              onClick={createTestNotification}
              className="px-2 py-1 bg-[#c0c0c0] border-2 border-black"
            >
              Create Test Notification
            </button>
            
            <button 
              onClick={clearAllNotifications}
              className="px-2 py-1 bg-[#c0c0c0] border-2 border-black"
            >
              Clear All Notifications
            </button>
          </div>
          
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            <ul className="divide-y divide-gray-400">
              {notifications.map(notification => (
                <li key={notification.id} className="py-2">
                  <div className="flex justify-between">
                    <h4 className={`font-bold ${notification.read ? '' : 'text-red-800'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt * 1000).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{notification.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};