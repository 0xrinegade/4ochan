import React from 'react';
import { useNostr } from '../context/NostrContext';
import { ProtocolVersion } from '../lib/nostr';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

/**
 * NetworkSelector component allows users to switch between production and development
 * protocol versions on top of Nostr.
 */
export const NetworkSelector: React.FC = () => {
  const { currentProtocolVersion, switchProtocolVersion, relays, connectedRelays } = useNostr();
  
  const isDevelopment = currentProtocolVersion === ProtocolVersion.DEVELOPMENT;
  
  const handleProtocolChange = async (checked: boolean) => {
    const targetProtocol = checked ? ProtocolVersion.DEVELOPMENT : ProtocolVersion.PRODUCTION;
    await switchProtocolVersion(targetProtocol);
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
          <h3 className="text-sm font-medium">Protocol Version</h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isDevelopment ? 'Using development protocol version' : 'Using production protocol version'}
            </p>
            <Badge variant="outline" className="text-xs">
              {connectedRelays}/{relays.length} relays
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="protocol-switch" className="text-xs">
            {isDevelopment ? 'DEV' : 'PROD'}
          </Label>
          <Switch 
            id="protocol-switch"
            checked={isDevelopment}
            onCheckedChange={handleProtocolChange}
          />
        </div>
      </div>
      
      {isDevelopment && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs">
          <p className="text-yellow-800 dark:text-yellow-200">
            You are using the development protocol version. Content created here won't be visible to users on the production version.
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
            onClick={() => switchProtocolVersion(ProtocolVersion.PRODUCTION)}
            disabled={currentProtocolVersion === ProtocolVersion.PRODUCTION}
          >
            Production
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => switchProtocolVersion(ProtocolVersion.DEVELOPMENT)}
            disabled={currentProtocolVersion === ProtocolVersion.DEVELOPMENT}
          >
            Development
          </Button>
        </div>
      </div>
    </div>
  );
};