import React, { useState } from "react";
import { useNostr } from "@/hooks/useNostr";
import { Button } from "@/components/ui/button";
import { RelayConnectionModal } from "@/components/RelayConnectionModal";
import { Link } from "wouter";

export const Header: React.FC = () => {
  const { connectedRelays, relays } = useNostr();
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const toggleConnectionModal = () => {
    setShowConnectionModal(!showConnectionModal);
  };

  return (
    <header className="mb-4">
      {/* Simple retro logo and navigation */}
      <div className="bg-background flex items-start p-4">
        <Link href="/">
          <div className="flex items-center">
            <div className="w-20 h-20 border border-black bg-white flex items-center justify-center overflow-hidden">
              <svg width="70" height="70" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="30" r="25" fill="#ffb6c1" />
                <circle cx="40" cy="25" r="5" fill="#000" />
                <circle cx="60" cy="25" r="5" fill="#000" />
                <path d="M40,40 Q50,50 60,40" stroke="#000" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Nostr connection section */}
      <div className="mb-4">
        <div className="bg-primary text-white p-2 font-bold">
          nostr connection
        </div>
        <div className="bg-white border border-black border-t-0 p-3">
          <p className="mb-3">connect to nostr relays to participate in the imageboard.</p>
          <button 
            onClick={toggleConnectionModal}
            className="bg-primary text-white font-bold py-1 px-3 border border-black"
          >
            manage relays
          </button>
          <span className="ml-3 text-sm">
            {connectedRelays > 0 
              ? `Connected to ${connectedRelays} relay${connectedRelays !== 1 ? 's' : ''}`
              : 'Not connected'}
          </span>
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
