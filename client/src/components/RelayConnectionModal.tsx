import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useNostr } from "@/hooks/useNostr";
import { Relay } from "@/types";

interface RelayConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  relays: Relay[];
}

export const RelayConnectionModal: React.FC<RelayConnectionModalProps> = ({
  isOpen,
  onClose,
  relays,
}) => {
  const {
    connect,
    disconnect,
    addRelay,
    removeRelay,
    updateRelay,
    saveRelaySettings,
    connectedRelays,
  } = useNostr();
  
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [autoConnect, setAutoConnect] = useState<boolean>(
    localStorage.getItem("nostr-auto-connect") !== "false"
  );
  const [autoReconnect, setAutoReconnect] = useState<boolean>(
    localStorage.getItem("nostr-auto-reconnect") !== "false"
  );
  const [isAddingRelay, setIsAddingRelay] = useState(false);

  const handleAddRelay = () => {
    if (!newRelayUrl.trim().startsWith("wss://")) {
      alert("Relay URL must start with wss://");
      return;
    }
    
    // Check if relay already exists
    if (relays.some(r => r.url === newRelayUrl)) {
      alert("This relay is already in your list");
      return;
    }
    
    addRelay({
      url: newRelayUrl,
      status: 'disconnected',
      read: true,
      write: true
    });
    
    setNewRelayUrl("");
    setIsAddingRelay(false);
  };

  const handleRemoveRelay = (url: string) => {
    if (confirm("Are you sure you want to remove this relay?")) {
      removeRelay(url);
    }
  };

  const handleToggleRelay = (relay: Relay, prop: 'read' | 'write') => {
    updateRelay({
      ...relay,
      [prop]: !relay[prop]
    });
  };

  const handleSaveSettings = () => {
    saveRelaySettings(autoConnect, autoReconnect);
    
    // If not connected but should be, connect now
    if (connectedRelays === 0 && autoConnect) {
      connect();
    }
    
    onClose();
  };

  const getRelayStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <i className="fas fa-circle text-green-500 text-xs mr-2"></i>;
      case 'connecting':
        return <i className="fas fa-circle text-yellow-500 text-xs mr-2 animate-pulse"></i>;
      case 'error':
        return <i className="fas fa-circle text-red-500 text-xs mr-2"></i>;
      default:
        return <i className="fas fa-circle text-gray-500 text-xs mr-2"></i>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Relay Connections</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold">Active Relays</h4>
              <Button
                onClick={() => setIsAddingRelay(!isAddingRelay)}
                variant="outline"
                size="sm"
                className="text-xs text-accent hover:text-red-700"
              >
                <i className="fas fa-plus mr-1"></i> Add New
              </Button>
            </div>
            
            {isAddingRelay && (
              <div className="mb-4 flex items-center">
                <Input
                  value={newRelayUrl}
                  onChange={(e) => setNewRelayUrl(e.target.value)}
                  placeholder="wss://relay.example.com"
                  className="mr-2 monaco text-xs"
                />
                <Button onClick={handleAddRelay} size="sm">
                  Add
                </Button>
              </div>
            )}
            
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
              {relays.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  No relays configured. Add one to get started.
                </div>
              ) : (
                relays.map((relay) => (
                  <div
                    key={relay.url}
                    className="border-b border-gray-200 last:border-b-0 p-3 flex justify-between items-center"
                  >
                    <div className="flex items-center overflow-hidden">
                      {getRelayStatusIcon(relay.status)}
                      <span className="text-sm monaco truncate">{relay.url}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="flex items-center space-x-1">
                          <Checkbox
                            id={`read-${relay.url}`}
                            checked={relay.read}
                            onCheckedChange={() => handleToggleRelay(relay, 'read')}
                          />
                          <Label htmlFor={`read-${relay.url}`} className="text-xs">R</Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Checkbox
                            id={`write-${relay.url}`}
                            checked={relay.write}
                            onCheckedChange={() => handleToggleRelay(relay, 'write')}
                          />
                          <Label htmlFor={`write-${relay.url}`} className="text-xs">W</Label>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveRelay(relay.url)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-2">Connection Settings</h4>
            <div className="flex items-center mb-2">
              <Checkbox
                id="auto-connect"
                checked={autoConnect}
                onCheckedChange={(checked) => setAutoConnect(checked as boolean)}
                className="mr-2"
              />
              <Label htmlFor="auto-connect" className="text-sm">Auto-connect on startup</Label>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="auto-reconnect"
                checked={autoReconnect}
                onCheckedChange={(checked) => setAutoReconnect(checked as boolean)}
                className="mr-2"
              />
              <Label htmlFor="auto-reconnect" className="text-sm">Auto-reconnect when connection lost</Label>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => connect()}
              variant="outline"
              className="flex-1"
              disabled={relays.length === 0 || connectedRelays > 0}
            >
              Connect
            </Button>
            <Button
              onClick={() => disconnect()}
              variant="outline"
              className="flex-1"
              disabled={connectedRelays === 0}
            >
              Disconnect
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleSaveSettings} className="bg-primary">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
