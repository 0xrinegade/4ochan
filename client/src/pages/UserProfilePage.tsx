import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useNostr } from '@/hooks/useNostr';
import { Header } from '@/components/Header';
import { UserProfile } from '@/components/UserProfile';
import { ReputationDisplay } from '@/components/ReputationDisplay';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/context/ThemeContext';

const UserProfilePage: React.FC<{ id?: string }> = ({ id: propId }) => {
  const { toast } = useToast();
  const { id: paramId } = useParams<{ id?: string }>();
  const { identity, connectedRelays } = useNostr();
  const { currentTheme, setTheme, themes } = useTheme();
  
  // Use the prop ID, URL parameter, or the current user's pubkey (in that order of precedence)
  const id = propId || paramId;
  const targetId = id || identity.pubkey;
  const isCurrentUser = id === identity.pubkey || !id;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <Header />
        
        <main className="container mx-auto px-4">
          {/* Main content starts here */}
          
          {/* Main content area - 90s style */}
          <div className="flex flex-col-reverse md:flex-row gap-4">
            {/* Main content */}
            <div className="md:w-2/3">
              {targetId ? (
                <>
                  <UserProfile 
                    pubkey={targetId} 
                  />
                  
                  {isCurrentUser && (
                    <div className="mt-4">
                      <ReputationDisplay 
                        userId={1} // This would be the user's ID from the database
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border border-black p-4">
                  <div className="section-header">not logged in</div>
                  <div className="p-3">
                    Please connect to Nostr to view profiles.
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar with tips and stats */}
            <div className="md:w-1/3 mb-4 md:mb-0">
              {/* Connection status */}
              <div className="thread-container mb-4">
                <div className="section-header">connection status</div>
                <div className="p-3">
                  <div className="mb-2">
                    {connectedRelays > 0 ? (
                      <div className="text-green-700">
                        ● Connected to {connectedRelays} relay{connectedRelays !== 1 ? 's' : ''}
                      </div>
                    ) : (
                      <div className="text-red-700">
                        ○ Not connected to any relays
                      </div>
                    )}
                  </div>
                  
                  {identity.pubkey ? (
                    <div className="text-xs text-gray-700">
                      Logged in as:
                      <div className="font-mono bg-gray-100 p-1 mt-1 break-all border border-black">
                        {identity.pubkey.substring(0, 16)}...{identity.pubkey.substring(identity.pubkey.length - 16)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-700">
                      Not logged in.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Theme Settings */}
              {isCurrentUser && (
                <div className="thread-container mb-4">
                  <div className="section-header">theme settings</div>
                  <div className="p-3">
                    <div className="bg-white">
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
                </div>
              )}
              
              {/* Tips for profile */}
              <div className="thread-container">
                <div className="section-header">profile tips</div>
                <div className="p-3">
                  <ul className="retro-list text-sm">
                    <li className="mb-2">Set a custom avatar to stand out in threads</li>
                    <li className="mb-2">Write a bio to tell others about yourself</li>
                    <li className="mb-2">Earn badges by being an active community member</li>
                    <li className="mb-2">Increase your reputation by posting quality content</li>
                    <li>Follow other users to build your network</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer - classic 90s */}
          <div className="mt-8 text-center text-sm">
            <div className="border-t border-black pt-2">
              <p>NostrChan © 2025 | <a href="#" className="text-primary underline">About</a> | <a href="#" className="text-primary underline">Terms</a> | <a href="#" className="text-primary underline">Privacy</a></p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfilePage;