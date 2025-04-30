import React from 'react';
import { useNostr } from '../context/NostrContext';
import { NostrNetwork } from '../lib/nostr';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

/**
 * NetworkSelector component allows users to switch between mainnet and devnet
 * for Nostr protocol connectivity.
 */
export const NetworkSelector: React.FC = () => {
  const { currentNetwork, switchNetwork, relays, connectedRelays } = useNostr();
  
  const isDevnet = currentNetwork === NostrNetwork.DEVNET;
  
  const handleNetworkChange = async (checked: boolean) => {
    const targetNetwork = checked ? NostrNetwork.DEVNET : NostrNetwork.MAINNET;
    await switchNetwork(targetNetwork);
  };

  const { resetToDefaultRelays } = useNostr();
  const [isResetting, setIsResetting] = React.useState(false);

  const handleResetRelays = async () => {
    setIsResetting(true);
    try {
      await resetToDefaultRelays();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3 p-3 border rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Network Environment</h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isDevnet ? 'Using development test network' : 'Using main production network'}
            </p>
            <Badge variant="outline" className="text-xs">
              {connectedRelays}/{relays.length} relays
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="network-switch" className="text-xs">
            {isDevnet ? 'DEVNET' : 'MAINNET'}
          </Label>
          <Switch 
            id="network-switch"
            checked={isDevnet}
            onCheckedChange={handleNetworkChange}
          />
        </div>
      </div>
      
      {isDevnet && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs">
          <p className="text-yellow-800 dark:text-yellow-200">
            You are currently on the development network. Content created here won't appear on the main network.
          </p>
        </div>
      )}
      
      <div className="flex justify-between items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetRelays}
          disabled={isResetting}
        >
          {isResetting ? 'Resetting...' : 'Reset to Default Relays'}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => switchNetwork(NostrNetwork.MAINNET)}
            disabled={currentNetwork === NostrNetwork.MAINNET}
          >
            Mainnet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => switchNetwork(NostrNetwork.DEVNET)}
            disabled={currentNetwork === NostrNetwork.DEVNET}
          >
            Devnet
          </Button>
        </div>
      </div>
    </div>
  );
};