import React, { useState, useEffect } from "react";
import { useNostr } from "@/hooks/useNostr";
import { Button } from "@/components/ui/button";
import { RelayConnectionModal } from "@/components/RelayConnectionModal";
import { OpenAILoginButton } from "@/components/OpenAILoginButton";
import { NotificationBell } from "@/components/NotificationBell";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useBoards } from "@/hooks/useBoards";

// Board navigation tab that finds the board ID by shortName
const NavBoardTab: React.FC<{ shortName: string; label: string }> = ({ shortName, label }) => {
  const { boards } = useBoards();
  const [location] = useLocation();
  
  // Find board by shortName
  const board = boards.find(b => b.shortName === shortName);
  
  // Check if this is the current active tab
  const isActive = location === `/board/${board?.id}`;
  
  // If the board isn't loaded yet, just point to the shortName as a fallback
  const href = board ? `/board/${board.id}` : `/board/${shortName}`;
  
  return (
    <Link href={href}>
      <span className={`${isActive ? 'bg-primary text-white' : 'bg-white'} px-3 py-0.5 text-sm border border-black border-b-0 mr-1 relative -mb-[1px] inline-block cursor-pointer`}>
        {label}
      </span>
    </Link>
  );
};

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
      {/* Retro 90s banner and title with navigation tabs inside */}
      <div className="bg-primary text-white pt-3 px-4 border border-black mb-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
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
                    className="text-xs bg-white border border-black px-2 py-0.5 hover:bg-secondary text-primary"
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
              {/* Always show notification bell */}
              <NotificationBell />

              <button 
                onClick={toggleConnectionModal}
                className="text-xs bg-white border border-black px-2 py-0.5 hover:bg-secondary text-primary"
              >
                Manage Relays
              </button>
            </div>
          </div>
        </div>
        
        {/* Top navigation tabs - inside header and sitting on bottom border */}
        <div className="flex -mb-px ml-1">
          <Link href="/">
            <span className="bg-primary border-white text-white px-3 py-0.5 text-sm font-bold border border-black border-b-0 mr-1 relative -mb-[1px] inline-block cursor-pointer">Home</span>
          </Link>
          <NavBoardTab shortName="b" label="Random" />
          <NavBoardTab shortName="ai" label="AI" />
          <NavBoardTab shortName="p" label="Psyche" />
          <NavBoardTab shortName="gg" label="Games" />
          <NavBoardTab shortName="news" label="News" />
          <NavBoardTab shortName="crypto" label="Crypto" />
        </div>
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