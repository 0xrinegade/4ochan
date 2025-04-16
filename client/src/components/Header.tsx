import React, { useState, useEffect } from "react";
import { useNostr } from "@/hooks/useNostr";
import { Button } from "@/components/ui/button";
import { RelayConnectionModal } from "@/components/RelayConnectionModal";
import { OpenAILoginButton } from "@/components/OpenAILoginButton";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export const Header: React.FC = () => {
  const { connectedRelays, relays } = useNostr();
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { toast } = useToast();

  // Load user from localStorage on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem("aiUser");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData.username);
      } catch (e) {
        // Invalid data in localStorage
        localStorage.removeItem("aiUser");
      }
    }
  }, []);

  const toggleConnectionModal = () => {
    setShowConnectionModal(!showConnectionModal);
  };
  
  const handleLogout = () => {
    localStorage.removeItem("aiUser");
    setCurrentUser(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };
  
  const handleLoginSuccess = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem("aiUser", JSON.stringify({ 
      username,
      loginTime: new Date().toISOString()
    }));
  };

  // Format current date in classic 90s style
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="mb-4">
      {/* Retro 90s banner and title */}
      <div className="bg-primary text-white p-4 flex justify-between items-center border border-black mb-2">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <div className="w-12 h-12 bg-white flex items-center justify-center overflow-hidden border border-black mr-3">
              <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="30" r="25" fill="#ffb6c1" />
                <circle cx="40" cy="25" r="5" fill="#000" />
                <circle cx="60" cy="25" r="5" fill="#000" />
                <path d="M40,40 Q50,50 60,40" stroke="#000" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">NostrChan</h1>
              <p className="text-xs">Decentralized Imageboard</p>
            </div>
          </div>
        </Link>
        
        <div className="text-right text-sm hidden md:block">
          <p>{dateString}</p>
          <p>
            {connectedRelays > 0 
              ? `Connected to ${connectedRelays} relay${connectedRelays !== 1 ? 's' : ''}`
              : 'Offline - Click to Connect'}
          </p>
          <div className="flex items-center gap-2 justify-end">
            {currentUser ? (
              <div className="flex gap-2 items-center">
                <span className="text-xs">Logged in as <b>{currentUser}</b></span>
                <button 
                  onClick={handleLogout}
                  className="text-xs underline"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <OpenAILoginButton 
                onLoginSuccess={handleLoginSuccess}
                className="text-xs py-0.5 px-2 h-auto" 
              />
            )}
            <Link href="/profile">
              <span className="text-xs bg-white border border-black px-2 py-0.5 hover:bg-secondary inline-block cursor-pointer">My Profile</span>
            </Link>
            <button 
              onClick={toggleConnectionModal}
              className="text-xs bg-white border border-black px-2 py-0.5 hover:bg-secondary"
            >
              Manage Relays
            </button>
          </div>
        </div>
      </div>
      
      {/* Small visitor counter in 90s style */}
      <div className="text-center text-xs mb-4">
        <span className="bg-white border border-black inline-block px-3 py-1">
          Visitors: 133,742 | Active users: 420
        </span>
      </div>
      
      {/* Relay Connection Modal */}
      <RelayConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        relays={relays}
      />
    </header>
  );
};