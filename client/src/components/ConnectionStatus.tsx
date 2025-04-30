import React, { useContext } from 'react';
import { WifiOff, PlugZap, CloudOff, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { NostrContext } from '@/context/NostrContext';

export const ConnectionStatus: React.FC = () => {
  const nostrContext = useContext(NostrContext);
  
  // Handle null context (not wrapped in provider)
  if (!nostrContext) {
    return null;
  }
  
  const { connectedRelays, isConnecting, relays } = nostrContext;
  
  // Create a clickable wrapper that will be present regardless of connection status
  // This is useful for testing and for allowing users to access the relay settings
  const openRelayConnectionModal = () => {
    // Dispatch a custom event that can be listened for in Header.tsx or elsewhere
    const event = new CustomEvent('open-relay-modal');
    window.dispatchEvent(event);
  };

  // Don't show connection status alert if we have a good connection
  if (connectedRelays > 1) {
    // Return invisible clickable area for tests and UX
    return (
      <div 
        data-testid="connection-status" 
        onClick={openRelayConnectionModal}
        className="cursor-pointer"
      />
    );
  }
  
  // Show connecting state
  if (isConnecting) {
    return (
      <Alert 
        className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
        data-testid="connection-status"
        onClick={openRelayConnectionModal}
      >
        <PlugZap className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-600">Connecting to Nostr relays...</AlertTitle>
        <AlertDescription>
          Establishing connections to decentralized network.
        </AlertDescription>
      </Alert>
    );
  }
  
  // No connections available
  if (connectedRelays === 0) {
    return (
      <Alert 
        className="mb-4 border-red-500 bg-red-50 dark:bg-red-900/20"
        data-testid="connection-status"
        onClick={openRelayConnectionModal}
      >
        <WifiOff className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-600">Offline Mode</AlertTitle>
        <AlertDescription>
          <p>Not connected to any Nostr relays. Your posts will be saved locally and published when connection is restored.</p>
          <button 
            className="mt-2 text-red-600 hover:text-red-800 underline"
            onClick={(e) => {
              e.stopPropagation(); // Don't trigger the parent onClick
              // Force reload the page to attempt reconnection
              window.location.reload();
            }}
          >
            Retry Connection
          </button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Limited connections (just 1 relay)
  return (
    <Alert 
      className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20"
      data-testid="connection-status"
      onClick={openRelayConnectionModal}
    >
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-600">Limited Connectivity</AlertTitle>
      <AlertDescription>
        Connected to only {connectedRelays} relay. Some messages may not be delivered to all networks.
      </AlertDescription>
    </Alert>
  );
};