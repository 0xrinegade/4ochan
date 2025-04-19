import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

// Regular expression to find Ethereum addresses
const findEthAddresses = (content: string): string[] => {
  const regex = /0x[a-fA-F0-9]{40}/g;
  let matches: string[] = [];
  let match;
  
  // Use a traditional while loop approach to avoid compatibility issues
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[0]);
  }
  
  // Return unique addresses
  const uniqueAddresses = Array.from(new Set(matches));
  return uniqueAddresses;
};

interface TokenData {
  name?: string;
  symbol?: string;
  price?: number;
  logo?: string;
  error?: string;
}

interface PumpFunWidgetProps {
  content: string;
}

export const PumpFunWidget: React.FC<PumpFunWidgetProps> = ({ content }) => {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const addresses = findEthAddresses(content);
  
  const { data: tokenData, isLoading, isError, error } = useQuery<TokenData>({
    queryKey: ['token', selectedAddress],
    queryFn: async () => {
      if (!selectedAddress) return { error: 'No address selected' };
      
      const response = await fetch(`/api/token/${selectedAddress}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch token data');
      }
      
      const data = await response.json();
      
      return {
        name: data.metadata?.name,
        symbol: data.metadata?.symbol,
        price: data.price?.usdPrice,
        logo: data.metadata?.thumbnail || data.metadata?.logo
      };
    },
    enabled: !!selectedAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
  
  // Automatically select the first address if only one is available
  useEffect(() => {
    if (addresses.length === 1 && !selectedAddress) {
      setSelectedAddress(addresses[0]);
    }
  }, [addresses, selectedAddress]);
  
  if (addresses.length === 0) {
    return null;
  }
  
  return (
    <Card className="mt-4 bg-slate-100 border-black">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Token Analysis</CardTitle>
        <CardDescription>
          {addresses.length > 1 
            ? 'Multiple token addresses detected. Select one to view details.' 
            : 'Token address detected. View details below.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {addresses.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {addresses.map(address => (
              <Button
                key={address}
                variant={selectedAddress === address ? "default" : "outline"}
                onClick={() => setSelectedAddress(address)}
                className="text-xs"
              >
                {address.substring(0, 6)}...{address.substring(38)}
              </Button>
            ))}
          </div>
        )}
        
        {selectedAddress && (
          <div className="mt-2">
            <div className="text-sm font-mono bg-slate-200 p-2 rounded mb-3 break-all border border-slate-300">
              {selectedAddress}
            </div>
            
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            )}
            
            {isError && (
              <div className="text-red-500 text-sm">
                Error: {(error as Error)?.message || 'Failed to load token data'}
              </div>
            )}
            
            {!isLoading && !isError && tokenData && !tokenData.error && (
              <div className="space-y-2">
                <div className="flex items-center">
                  {tokenData.logo && (
                    <img 
                      src={tokenData.logo} 
                      alt={tokenData.name || 'Token logo'} 
                      className="w-8 h-8 mr-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h3 className="font-bold">
                      {tokenData.name || 'Unknown Token'} 
                      {tokenData.symbol && `(${tokenData.symbol})`}
                    </h3>
                    {tokenData.price ? (
                      <p className="text-sm">${tokenData.price.toFixed(6)}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Price unavailable</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => window.open(`https://etherscan.io/token/${selectedAddress}`, '_blank')}
                  >
                    View on Etherscan <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => window.open(`https://app.uniswap.org/#/swap?outputCurrency=${selectedAddress}`, '_blank')}
                  >
                    Trade on Uniswap <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => window.open(`https://www.pump.fun/token/${selectedAddress}`, '_blank')}
                  >
                    View on Pump.fun <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
            
            {!isLoading && tokenData?.error && (
              <div className="text-amber-600 text-sm">
                {tokenData.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};