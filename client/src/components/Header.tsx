import React, { useState, useEffect, useRef } from "react";
import { useNostr } from "@/hooks/useNostr";
import { Button } from "@/components/ui/button";
import { RelayConnectionModal } from "@/components/RelayConnectionModal";
import { OpenAILoginButton } from "@/components/OpenAILoginButton";
import { NotificationBell } from "@/components/NotificationBell";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useBoards } from "@/hooks/useBoards";
import { useTheme } from "@/context/ThemeContext";
import { useNavigation } from "@/context/NavigationContext";

// Define theme types to match ThemeContext
type ThemeName = 'light' | 'dark' | 'highcontrast' | 'retro' | 'sepia';

// Board navigation tab that simply uses the shortName
const NavBoardTab: React.FC<{ shortName: string; label: string }> = ({ shortName, label }) => {
  const [location] = useLocation();
  const { navigateTo } = useNavigation();
  
  // Use simple path for board links that use shortName directly
  const href = `/board/${shortName}`;
  
  // Check if this is the current active tab (simpler check)
  const isActive = location.startsWith(href);
  
  // Handle navigation with animation
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo(href);
  };
  
  return (
    <a href={href} onClick={handleClick}>
      <span className={`${isActive ? 'bg-primary text-white' : 'bg-white'} px-2 md:px-3 py-0.5 text-xs md:text-sm border border-black border-b-0 mr-1 mb-1 md:mb-0 relative -mb-[1px] inline-block cursor-pointer`}>
        {label}
      </span>
    </a>
  );
};

export const Header: React.FC = () => {
  const { connectedRelays, relays } = useNostr();
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
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
  
  // Handle click outside to close theme dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [themeDropdownRef]);

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
          <a href="/" onClick={(e) => { 
            e.preventDefault(); 
            navigateTo('/');
          }}>
            <div className="flex items-center cursor-pointer">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white flex items-center justify-center overflow-hidden border border-black mr-2 md:mr-3">
                <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="30" r="25" fill="#ffb6c1" />
                  <circle cx="40" cy="25" r="5" fill="#000" />
                  <circle cx="60" cy="25" r="5" fill="#000" />
                  <path d="M40,40 Q50,50 60,40" stroke="#000" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">NostrChan</h1>
                <p className="text-xs">Decentralized Imageboard</p>
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
              {currentUser ? (
                <div className="flex gap-2 items-center">
                  <span className="text-xs">Logged in as <b>{currentUser}</b></span>
                  <button 
                    onClick={handleLogout}
                    className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                    style={{ boxShadow: "2px 2px 0 #000" }}
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

              {/* Theme Dropdown */}
              <div className="relative" ref={themeDropdownRef}>
                <button 
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                  style={{ boxShadow: "2px 2px 0 #000" }}
                >
                  Theme
                </button>
                
                {themeDropdownOpen && (
                  <div className="absolute right-0 mt-1 bg-white border-2 border-black z-50 w-40">
                    <div className="bg-primary text-white text-xs font-bold py-0.5 px-2">
                      SELECT THEME
                    </div>
                    <div className="p-1">
                      {themes.map((theme) => {
                        // Get friendly names for themes
                        let displayName = '';
                        let themeColor = '';
                        
                        switch(theme) {
                          case 'light':
                            displayName = 'Light';
                            themeColor = '#0066B8';
                            break;
                          case 'dark':
                            displayName = 'Dark';
                            themeColor = '#0098FF';
                            break;
                          case 'highcontrast':
                            displayName = 'High Contrast';
                            themeColor = '#FFFF00';
                            break;
                          case 'retro':
                            displayName = 'Retro';
                            themeColor = '#000080';
                            break;
                          case 'sepia':
                            displayName = 'Sepia';
                            themeColor = '#8B4000';
                            break;
                          default:
                            displayName = String(theme).charAt(0).toUpperCase() + String(theme).slice(1);
                        }
                        
                        return (
                          <button
                            key={theme}
                            onClick={() => {
                              setTheme(theme);
                              setThemeDropdownOpen(false);
                            }}
                            className={`w-full text-left py-1 px-1 mb-1 last:mb-0 flex items-center ${
                              currentTheme === theme ? 'bg-gray-100' : 'hover:bg-gray-100'
                            }`}
                          >
                            <div 
                              className="w-3 h-3 mr-1 border border-black inline-block"
                              style={{ backgroundColor: themeColor }}
                            ></div>
                            <span className="text-xs">{displayName}</span>
                            {currentTheme === theme && <span className="ml-auto text-xs">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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
              {currentUser ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs">Logged in as <b>{currentUser}</b></span>
                  <button 
                    onClick={handleLogout}
                    className="text-xs bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black"
                    style={{ boxShadow: "2px 2px 0 #000" }}
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <OpenAILoginButton 
                  onLoginSuccess={handleLoginSuccess}
                  className="text-xs py-1 px-2 h-auto w-full" 
                />
              )}
              
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
              
              {/* Mobile Theme Selector */}
              <div className="mt-2">
                <div className="bg-primary text-white text-xs font-bold py-0.5 px-2 mb-1">
                  SELECT THEME
                </div>
                <div className="border border-black p-1 bg-white">
                  {themes.map((theme) => {
                    // Get friendly names for themes
                    let displayName = '';
                    let themeColor = '';
                    
                    switch(theme) {
                      case 'light':
                        displayName = 'Light';
                        themeColor = '#0066B8';
                        break;
                      case 'dark':
                        displayName = 'Dark';
                        themeColor = '#0098FF';
                        break;
                      case 'highcontrast':
                        displayName = 'High Contrast';
                        themeColor = '#FFFF00';
                        break;
                      case 'retro':
                        displayName = 'Retro';
                        themeColor = '#000080';
                        break;
                      case 'sepia':
                        displayName = 'Sepia';
                        themeColor = '#8B4000';
                        break;
                      default:
                        displayName = String(theme).charAt(0).toUpperCase() + String(theme).slice(1);
                    }
                    
                    return (
                      <button
                        key={theme}
                        onClick={() => setTheme(theme)}
                        className={`w-full text-left py-1 px-1 mb-1 last:mb-0 flex items-center ${
                          currentTheme === theme ? 'bg-gray-100' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div 
                          className="w-3 h-3 mr-1 border border-black inline-block"
                          style={{ backgroundColor: themeColor }}
                        ></div>
                        <span className="text-xs">{displayName}</span>
                        {currentTheme === theme && <span className="ml-auto text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
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
          <a href="/" onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>
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