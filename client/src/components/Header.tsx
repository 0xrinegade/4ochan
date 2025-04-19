import React, { useState, useEffect } from "react";
import { useNostr } from "@/hooks/useNostr";
import { Button } from "@/components/ui/button";
import { RelayConnectionModal } from "@/components/RelayConnectionModal";
import { NotificationBell } from "@/components/NotificationBell";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useBoards } from "@/hooks/useBoards";
import { useTheme } from "@/context/ThemeContext";
import { useNavigation } from "@/context/NavigationContext";
import { getOrCreateIdentity } from "@/lib/nostr";
import logoPath from "@/assets/logo.png";

// Board navigation tab that simply uses the shortName
const NavBoardTab: React.FC<{ shortName: string; label: string }> = ({ shortName, label }) => {
  const [location] = useLocation();
  const { navigateTo } = useNavigation();
  
  // Use simple path for board links that use shortName directly
  const href = `/board/${shortName}`;
  
  // Check if this is the current active tab (simpler check)
  const isActive = location.startsWith(href);
  
  return (
    <a 
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigateTo(href);
      }}
    >
      <span className={`${isActive ? 'bg-primary text-white' : 'bg-white'} px-2 md:px-3 py-0.5 text-xs md:text-sm border border-black border-b-0 mr-1 mb-1 md:mb-0 relative -mb-[1px] inline-block cursor-pointer`}>
        {label}
      </span>
    </a>
  );
};

export const Header: React.FC = () => {
  const { connectedRelays, relays, identity, updateIdentity } = useNostr();
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { currentTheme, setTheme, themes } = useTheme();
  const { toast } = useToast();
  const { navigateTo } = useNavigation();

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="mb-4">
      {/* Retro 90s banner and title with navigation tabs inside */}
      <div className="bg-primary text-white pt-3 px-4 border border-black mb-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("/");
            }}
          >
            <div className="flex items-center cursor-pointer">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white flex items-center justify-center overflow-hidden border border-black mr-2 md:mr-3">
                <img src={logoPath} alt="4ochan logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">4ochan.org</h1>
                <p className="text-xs">AI-Enhanced Imageboard</p>
              </div>
            </div>
          </a>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col space-y-1 p-1 border border-white"
          >
            <div className="w-5 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
          </button>
          
          {/* Desktop user info */}
          <div className="text-right text-sm hidden md:block">
            <p>{dateString}</p>
            <p>
              {connectedRelays > 0 
                ? `Connected to ${connectedRelays} relay${connectedRelays !== 1 ? 's' : ''}`
                : 'Offline - Click to Connect'}
            </p>
            <div className="flex items-center gap-2 justify-end">
              <div className="flex gap-2 items-center">
                {identity.pubkey ? (
                  <>
                    <span className="text-xs">
                      Connected: <b>{identity.pubkey.substring(0, 6)}...{identity.pubkey.substring(identity.pubkey.length - 4)}</b>
                    </span>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      // Generate random key if none exists
                      if (!identity.pubkey) {
                        const newIdentity = getOrCreateIdentity();
                        updateIdentity(newIdentity);
                        toast({
                          title: "Nostr Identity Created",
                          description: "A new Nostr identity has been created for you.",
                        });
                      }
                    }}
                    className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                    style={{ boxShadow: "2px 2px 0 #000" }}
                  >
                    Generate Nostr Key
                  </button>
                )}
              </div>
              {/* Always show notification bell */}
              <NotificationBell />

              {/* Profile Button */}
              <div className="relative">
                <button 
                  onClick={() => navigateTo('/profile')}
                  className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                  style={{ boxShadow: "2px 2px 0 #000" }}
                >
                  Profile
                </button>
              </div>
              
              <button 
                onClick={toggleConnectionModal}
                className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                style={{ boxShadow: "2px 2px 0 #000" }}
              >
                Manage Relays
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white text-black border border-black p-2 mb-2">
            {/* Mobile login */}
            <div className="flex flex-col space-y-2 mb-2">
              <div className="flex flex-col gap-1">
                {identity.pubkey ? (
                  <>
                    <span className="text-xs">
                      Connected with Nostr key:
                    </span>
                    <div className="text-xs font-mono bg-gray-100 p-1 break-all border border-black">
                      {identity.pubkey.substring(0, 10)}...{identity.pubkey.substring(identity.pubkey.length - 6)}
                    </div>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      // Generate random key if none exists
                      if (!identity.pubkey) {
                        const newIdentity = getOrCreateIdentity();
                        updateIdentity(newIdentity);
                        toast({
                          title: "Nostr Identity Created",
                          description: "A new Nostr identity has been created for you.",
                        });
                      }
                    }}
                    className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                    style={{ boxShadow: "2px 2px 0 #000" }}
                  >
                    Generate Nostr Key
                  </button>
                )}
              </div>
              
              <div className="flex justify-between">
                <button 
                  onClick={toggleConnectionModal}
                  className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                  style={{ boxShadow: "2px 2px 0 #000" }}
                >
                  Manage Relays
                </button>
                <NotificationBell />
              </div>
              
              <div className="flex justify-between mt-2">
                <button 
                  onClick={() => {
                    navigateTo('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                  style={{ boxShadow: "2px 2px 0 #000" }}
                >
                  Profile
                </button>
              </div>
              
              <div className="text-xs mt-2">
                <p>Relays: {connectedRelays}/{relays.length} connected</p>
                <p>{dateString}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Top navigation tabs - inside header and sitting on bottom border */}
        <div className="flex flex-wrap overflow-x-auto -mb-px ml-1">
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("/");
            }}
          >
            <span className="bg-primary border-white text-white px-2 md:px-3 py-0.5 text-xs md:text-sm font-bold border border-black border-b-0 mr-1 relative -mb-[1px] inline-block cursor-pointer">Home</span>
          </a>
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