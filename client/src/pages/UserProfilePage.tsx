import React from 'react';
import { useParams } from 'wouter';
import { useNostr } from '@/hooks/useNostr';
import { Header } from '@/components/Header';
import { UserProfile } from '@/components/UserProfile';
import { ReputationDisplay } from '@/components/ReputationDisplay';
import { useToast } from '@/hooks/use-toast';

const UserProfilePage: React.FC<{ id?: string }> = ({ id: propId }) => {
  const { toast } = useToast();
  const { id: paramId } = useParams<{ id?: string }>();
  const { identity, connectedRelays } = useNostr();
  
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