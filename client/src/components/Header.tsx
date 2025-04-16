import React, { useState } from "react";
import { useNostr } from "@/hooks/useNostr";
import { Button } from "@/components/ui/button";
import { RelayConnectionModal } from "@/components/RelayConnectionModal";
import { Link } from "wouter";
import { CircleIcon, NetworkIcon, HomeIcon, SettingsIcon, CircleUserIcon } from "lucide-react";

export const Header: React.FC = () => {
  const { connectedRelays, relays } = useNostr();
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const toggleConnectionModal = () => {
    setShowConnectionModal(!showConnectionModal);
  };

  return (
    <header className="border-b border-border">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground px-4 py-2.5">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-xl font-bold cursor-pointer tracking-tight">NostrChan</h1>
            </Link>
            <span className="ml-2 text-xs bg-accent/90 px-2 py-0.5 rounded-sm">ALPHA</span>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono flex items-center">
              <CircleIcon className={`h-2 w-2 mr-1 ${connectedRelays > 0 ? "text-green-400" : "text-red-400"}`} />
              {connectedRelays > 0
                ? `${connectedRelays} relay${connectedRelays !== 1 ? "s" : ""}`
                : "offline"}
            </span>
            <Button 
              onClick={toggleConnectionModal} 
              variant="secondary"
              size="sm"
              className="h-7 text-xs font-medium"
            >
              <NetworkIcon className="h-3.5 w-3.5 mr-1" /> Relays
            </Button>
          </div>
        </div>
      </div>
      
      {/* Navigation bar */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto">
          <div className="flex items-center space-x-1 px-1">
            <Link href="/">
              <Button variant="ghost" className="text-sm h-9" size="sm">
                <HomeIcon className="h-4 w-4 mr-1" /> Home
              </Button>
            </Link>
            <Button variant="ghost" className="text-sm h-9" size="sm">
              <CircleUserIcon className="h-4 w-4 mr-1" /> Profile
            </Button>
            <Button variant="ghost" className="text-sm h-9" size="sm">
              <SettingsIcon className="h-4 w-4 mr-1" /> Settings
            </Button>
          </div>
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
