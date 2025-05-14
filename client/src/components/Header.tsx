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
import logoPath from "@/assets/logo.svg";

// Board navigation tab that simply uses the shortName
const NavBoardTab: React.FC<{ shortName: string; label: string }> = ({
  shortName,
  label,
}) => {
  const [location] = useLocation();
  const { navigateTo } = useNavigation();

  // Use simple path for board links that use shortName directly
  const href = `/board/${shortName}`;

  // Check if this is the current active tab
  const isActive = location.startsWith(href);

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigateTo(href);
      }}
    >
      <span
        className={`${isActive ? "bg-white/20 text-white" : "bg-white/10 text-white"} px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md mx-1 inline-block cursor-pointer hover:bg-white/20 transition-colors`}
      >
        {label}
      </span>
    </a>
  );
};

export const Header: React.FC = () => {
  const { connectedRelays, relays, identity, updateIdentity, currentProtocolVersion } = useNostr();
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { currentTheme, setTheme, themes } = useTheme();
  const { toast } = useToast();
  const { navigateTo } = useNavigation();
  const [location] = useLocation();

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
    
    // Add event listener for opening relay modal from ConnectionStatus
    const handleOpenRelayModal = () => {
      setShowConnectionModal(true);
    };
    
    window.addEventListener('open-relay-modal', handleOpenRelayModal);
    
    // Cleanup
    return () => {
      window.removeEventListener('open-relay-modal', handleOpenRelayModal);
    };
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
    localStorage.setItem(
      "aiUser",
      JSON.stringify({
        username,
        loginTime: new Date().toISOString(),
      }),
    );
  };

  // Format current date in classic 90s style
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="mb-4">
      {/* Modern header with gradient background */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white pt-3 px-4 border-b border-indigo-800 mb-1 flex flex-col shadow-md">
        <div className="flex justify-between items-center mb-4">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("/");
            }}
          >
            <div className="flex items-center cursor-pointer">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white flex items-center justify-center overflow-hidden rounded-lg shadow-md mr-2 md:mr-3">
                <img
                  src={logoPath}
                  alt="4ochan logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  4ochan.org
                </h1>
                <p className="text-xs">AI-Enhanced Imageboard</p>
              </div>
            </div>
          </a>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col space-y-1 p-2 rounded-md bg-white/10"
          >
            <div className="w-5 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
            <div className="w-5 h-0.5 bg-white"></div>
          </button>

          {/* Desktop user info with Solana wallet */}
          <div className="text-right text-sm hidden md:flex items-center gap-4">
            {/* Solana wallet */}
            <div className="inline-flex items-center">
              <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs px-2 py-1 rounded-md font-medium">
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 128 128" 
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1"
                >
                  <path
                    d="M93.94 42.63H13.44a8.33 8.33 0 0 0-8.33 8.32v26.12a8.33 8.33 0 0 0 8.33 8.33h80.5a8.33 8.33 0 0 0 8.33-8.33V50.95a8.33 8.33 0 0 0-8.33-8.32Z"
                    fill="#fff"
                  />
                  <path 
                    d="M23.28 77.07 35.5 50.95h-8.4L15.89 77.07h7.39Zm16.45 0h7.8l12.19-26.12h-7.8L39.73 77.07Zm35.9-26.12h-15.5l-12.21 26.12h7.82l2.12-4.59h12.34l2.12 4.59h7.83l-4.53-9.75a11.43 11.43 0 0 0 5.7-9.81c0-3.62-2.94-6.56-6.56-6.56h.87Zm-3.38 15.36h-7.56l3.8-8.17h3.76a4.14 4.14 0 0 1 0 8.27v-.1Z"
                    fill="#19103F"
                  />
                  <path 
                    d="M104.81 35.24c-.2-.21-.51-.21-.71 0l-6.95 6.98 11.62 11.67 6.96-7a.5.5 0 0 0 0-.7l-10.92-10.95Z"
                    fill="#19103F" 
                  />
                  <path 
                    d="m97.15 42.22-42.9 43a2.54 2.54 0 0 0-.74 1.73v7.96c0 .3.2.5.5.5h7.94a2.45 2.45 0 0 0 1.72-.74l42.9-43-9.42-9.45Z"
                    fill="#19103F" 
                  />
                </svg>
                4och...shit
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </div>
            </div>
            
            <div>
              <p className="text-sm">{dateString}</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center ${connectedRelays > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  <span className={`w-2 h-2 rounded-full mr-1 ${connectedRelays > 0 ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  {connectedRelays > 0
                    ? `${connectedRelays} relay${connectedRelays !== 1 ? "s" : ""}`
                    : "Offline"}
                </span>
                <span className="bg-indigo-800 text-white px-1.5 py-0.5 rounded text-xs font-mono">
                  {currentProtocolVersion?.toUpperCase() || 'MAINNET'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {identity.pubkey ? (
                <span className="text-xs bg-white/10 px-2 py-1 rounded-md">
                  {identity.pubkey.substring(0, 6)}...
                  {identity.pubkey.substring(identity.pubkey.length - 4)}
                </span>
              ) : (
                <button
                  onClick={() => {
                    // Generate random key if none exists
                    if (!identity.pubkey) {
                      const newIdentity = getOrCreateIdentity();
                      updateIdentity(newIdentity);
                      toast({
                        title: "Nostr Identity Created",
                        description:
                          "A new Nostr identity has been created for you.",
                      });
                    }
                  }}
                  className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-2 rounded-md transition-colors"
                >
                  Generate Nostr Key
                </button>
              )}
              
              {/* Controls group */}
              <div className="flex items-center gap-2">
                <NotificationBell />
                
                <button
                  onClick={() => navigateTo("/profile")}
                  className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-2 rounded-md transition-colors"
                >
                  Profile
                </button>
                
                <button
                  onClick={toggleConnectionModal}
                  className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-2 rounded-md transition-colors"
                >
                  Relays
                </button>
              </div>
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
                    <span className="text-xs">Connected with Nostr key:</span>
                    <div className="text-xs font-mono bg-gray-100 p-1 break-all border border-black">
                      {identity.pubkey.substring(0, 10)}...
                      {identity.pubkey.substring(identity.pubkey.length - 6)}
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
                          description:
                            "A new Nostr identity has been created for you.",
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
                    navigateTo("/profile");
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                  style={{ boxShadow: "2px 2px 0 #000" }}
                >
                  Profile
                </button>
                
                <button
                  onClick={() => {
                    navigateTo("/faq");
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                  style={{ boxShadow: "2px 2px 0 #000" }}
                >
                  FAQ
                </button>
              </div>

              <div className="text-xs mt-2">
                <div className="flex items-center justify-between">
                  <p>
                    Relays: {connectedRelays}/{relays.length} connected
                  </p>
                  <span className="bg-gray-200 text-black px-1 py-0.5 rounded font-mono text-xs">
                    {currentProtocolVersion?.toUpperCase() || 'MAINNET'}
                  </span>
                </div>
                <p>{dateString}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top navigation tabs - centered and modern */}
        <div className="flex justify-center items-center flex-wrap overflow-x-auto py-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("/");
            }}
          >
            <span className="bg-white/10 text-white px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md mx-1 inline-block cursor-pointer hover:bg-white/20 transition-colors">
              Home
            </span>
          </a>
          <a
            href="/faq"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("/faq");
            }}
          >
            <span className={`${location.startsWith("/faq") ? "bg-white/20 text-white" : "bg-white/10 text-white"} px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-md mx-1 inline-block cursor-pointer hover:bg-white/20 transition-colors`}>
              FAQ
            </span>
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
