import React, { useState, useEffect } from 'react';
import { useNostr } from '../context/NostrContext';
import { ThreadSubscription } from '../types';

interface ThreadSubscribeButtonProps {
  threadId: string;
  threadTitle?: string;
  className?: string;
}

export const ThreadSubscribeButton: React.FC<ThreadSubscribeButtonProps> = ({
  threadId,
  threadTitle,
  className = ''
}) => {
  const { subscribeToThread, unsubscribeFromThread, isSubscribedToThread, getThreadSubscriptions } = useNostr();
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<ThreadSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setIsLoading(true);
        // Check if already subscribed
        const subscribed = await isSubscribedToThread(threadId);
        setIsSubscribed(subscribed);
        
        if (subscribed) {
          // Find the subscription details
          const subscriptions = await getThreadSubscriptions();
          const foundSubscription = subscriptions.find(s => s.threadId === threadId);
          if (foundSubscription) {
            setSubscription(foundSubscription);
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSubscription();
  }, [threadId, isSubscribedToThread, getThreadSubscriptions]);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      if (isSubscribed && subscription) {
        await unsubscribeFromThread(subscription.id);
        setIsSubscribed(false);
        setSubscription(null);
      } else {
        const newSubscription = await subscribeToThread(threadId, true, true);
        setIsSubscribed(true);
        setSubscription(newSubscription);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Classic 90s style button
  return (
    <button 
      onClick={handleSubscribe}
      disabled={isLoading}
      className={`
        px-2 py-1 
        bg-[#c0c0c0] 
        border-t-2 border-l-2 border-[#ffffff] 
        border-b-2 border-r-2 border-[#808080]
        text-black
        font-bold
        text-sm
        uppercase
        hover:bg-[#d0d0d0]
        active:border-t-2 active:border-l-2 active:border-[#808080] 
        active:border-b-2 active:border-r-2 active:border-[#ffffff]
        active:translate-y-[1px]
        disabled:opacity-50
        ${className}
      `}
    >
      {isLoading ? 
        '...' : 
        isSubscribed ? 
          '■ UNSUBSCRIBE' : 
          '□ SUBSCRIBE'
      }
    </button>
  );
};