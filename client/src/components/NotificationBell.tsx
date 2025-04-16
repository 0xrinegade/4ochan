import React, { useState, useEffect, useRef } from 'react';
import { useNostr } from '../context/NostrContext';
import { Notification } from '../types';
import { formatDate, timeAgo } from '../lib/nostr';
import { useLocation } from 'wouter';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  className = '' 
}) => {
  const { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useNostr();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Load notifications and count
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading notification count:', error);
      }
    };
    
    loadNotifications();
    
    // Set up interval to periodically check for new notifications
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [getUnreadNotificationCount]);
  
  // Handle click outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load notifications when dropdown is opened
  const handleBellClick = async () => {
    try {
      setIsOpen(!isOpen);
      
      if (!isOpen) {
        setIsLoading(true);
        const notifs = await getNotifications(false, 20);
        setNotifications(notifs);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setIsLoading(false);
    }
  };

  // Mark a notification as read and navigate to the thread
  const [, setLocation] = useLocation();
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
      
      // Close the notification panel
      setIsOpen(false);
      
      // Navigate to the thread if thread ID exists
      if (notification.threadId) {
        setLocation(`/thread/${notification.threadId}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className={`relative ${className}`} ref={notificationRef}>
      {/* Bell Icon with Badge */}
      <button 
        onClick={handleBellClick}
        className="relative text-xs bg-[#c0c0c0] border-t-[1px] border-l-[1px] border-[#ffffff] border-b-[1px] border-r-[1px] border-[#808080] px-2 py-0.5 hover:bg-[#d0d0d0] text-black"
      >
        <div className="font-bold flex items-center">
          ✉
          {unreadCount > 0 && (
            <span className="ml-1 bg-primary text-[#f0e6d2] text-xs px-1 border border-black">
              {unreadCount}
            </span>
          )}
        </div>
      </button>
      
      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-80 max-h-96 overflow-y-auto z-50
                      bg-[#f0e6d2] border-2 border-black
                      shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center p-2 bg-primary text-white border-b-2 border-black">
            <h3 className="font-bold uppercase">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs bg-[#c0c0c0] hover:bg-[#d0d0d0] text-black px-2 py-0.5
                         border-t-[1px] border-l-[1px] border-[#ffffff] 
                         border-b-[1px] border-r-[1px] border-[#808080]"
              >
                MARK ALL READ
              </button>
            )}
          </div>
          
          {isLoading ? (
            <div className="p-4 text-center bg-[#f0e6d2]">
              <div className="inline-block px-3 py-1 bg-[#c0c0c0] border border-black">
                Loading...
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center bg-[#f0e6d2]">
              <div className="inline-block px-3 py-1 bg-[#c0c0c0] border border-black">
                No notifications
              </div>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-2 border-b border-black cursor-pointer
                    hover:bg-[#dbd1c0]
                    ${notification.read ? 'bg-[#f0e6d2]' : 'bg-[#fffdf7]'}
                  `}
                >
                  <div className="flex justify-between">
                    <h4 className="font-bold">{notification.title}</h4>
                    <span className="text-xs text-gray-700">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{notification.message}</p>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary absolute top-2 right-2"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};