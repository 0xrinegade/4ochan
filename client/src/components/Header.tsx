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
    <header className="bg-primary text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-xl font-bold cursor-pointer">NostrChan</h1>
          </Link>
          <span className="ml-2 text-xs bg-accent px-2 py-1 rounded">ALPHA</span>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center">
          <span className="text-xs mr-2 monaco">
            <i className={`fas fa-circle ${connectedRelays > 0 ? "text-green-400" : "text-red-400"} mr-1`}></i>
            {connectedRelays > 0
              ? `Connected to ${connectedRelays} relay${connectedRelays !== 1 ? "s" : ""}`
              : "Not connected"}
          </span>
          <Button 
            onClick={toggleConnectionModal} 
            className="bg-accent hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
            size="sm"
          >
            <i className="fas fa-plug mr-1"></i> Relays
          </Button>
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
