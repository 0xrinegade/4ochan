import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  ExternalLink, 
  Users, 
  BarChart4, 
  Database, 
  Activity 
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getSimplifiedTokenInfo, TokenPriceHistory } from '@/lib/moralis';

// Define token types
type TokenType = 'address' | 'symbol';
interface DetectedToken {
  value: string;
  type: TokenType;
}

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

// Regular expression to find token ticker symbols (like $ETH, $BTC, etc)
const findTokenSymbols = (content: string): string[] => {
  const regex = /\$([A-Za-z]{2,10})\b/g;
  let matches: string[] = [];
  let match;
  
  // Use a traditional while loop approach to avoid compatibility issues
  while ((match = regex.exec(content)) !== null) {
    // match[1] is the capturing group without the $ sign
    matches.push(match[1]);
  }
  
  // Return unique symbols
  const uniqueSymbols = Array.from(new Set(matches));
  return uniqueSymbols;
};

// Find all tokens (addresses and symbols) in content
const findTokens = (content: string): DetectedToken[] => {
  const addresses = findEthAddresses(content);
  const symbols = findTokenSymbols(content);
  
  const tokens: DetectedToken[] = [
    ...addresses.map(addr => ({ value: addr, type: 'address' as TokenType })),
    ...symbols.map(sym => ({ value: sym, type: 'symbol' as TokenType }))
  ];
  
  return tokens;
};

// Format large numbers with commas
const formatNumber = (num: number | string | undefined): string => {
  if (num === undefined) return 'N/A';
  
  const numStr = typeof num === 'number' ? num.toString() : num;
  
  // Check if it's a very large number (scientific notation)
  if (numStr.includes('e+')) {
    const [base, exponent] = numStr.split('e+');
    const exp = parseInt(exponent);
    if (exp > 15) {
      // Simplify very large numbers
      const baseNum = parseFloat(base);
      const simplifiedNum = (baseNum * Math.pow(10, exp % 3)).toFixed(2);
      const suffix = exp >= 18 ? 'Q' : exp >= 15 ? 'q' : exp >= 12 ? 'T' : exp >= 9 ? 'B' : 'M';
      return `${simplifiedNum}${suffix}`;
    }
  }
  
  // For regular numbers, add commas
  return Number(numStr).toLocaleString();
};

// Format date for chart
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

interface TokenData {
  name?: string;
  symbol?: string;
  price?: number;
  priceChange24h?: number;
  volumeChange24h?: number;
  holders?: number;
  totalSupply?: string;
  circulatingSupply?: string;
  logo?: string;
  priceHistory?: TokenPriceHistory[];
  address?: string; // Contract address (needed for symbol tokens)
  error?: string;
}

interface PumpFunWidgetProps {
  content: string;
}

export const PumpFunWidget: React.FC<PumpFunWidgetProps> = ({ content }) => {
  const [selectedToken, setSelectedToken] = useState<DetectedToken | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const tokens = findTokens(content);
  
  const { data: tokenData, isLoading, isError, error } = useQuery<TokenData>({
    queryKey: ['token-full', selectedToken?.value, selectedToken?.type],
    queryFn: async () => {
      if (!selectedToken) return { error: 'No token selected' };
      
      if (selectedToken.type === 'address') {
        // Fetch by Ethereum address
        return getSimplifiedTokenInfo(selectedToken.value);
      } else {
        // Fetch by symbol
        const response = await fetch(`/api/token-symbol/${selectedToken.value}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch token data');
        }
        return response.json();
      }
    },
    enabled: !!selectedToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
  
  // Automatically select the first token if only one is available
  useEffect(() => {
    if (tokens.length === 1 && !selectedToken) {
      setSelectedToken(tokens[0]);
    }
  }, [tokens, selectedToken]);
  
  if (tokens.length === 0) {
    return null;
  }
  
  // Prepare price history data for the chart
  const chartData = tokenData?.priceHistory?.map(item => ({
    date: formatDate(item.timestamp),
    price: item.price,
    timestamp: item.timestamp,
    volume: item.volume
  })) || [];
  
  // Format token display text
  const getTokenDisplayText = (token: DetectedToken): string => {
    if (token.type === 'address') {
      return `${token.value.substring(0, 6)}...${token.value.substring(38)}`;
    } else {
      return `$${token.value}`;
    }
  };
  
  return (
    <Card className="mt-4 bg-slate-100 border-black">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          Token Analysis
          {tokenData?.priceChange24h !== undefined && (
            <Badge className={`ml-2 ${tokenData.priceChange24h >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
              {tokenData.priceChange24h >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {Math.abs(tokenData.priceChange24h).toFixed(2)}%
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {tokens.length > 1 
            ? 'Multiple tokens detected. Select one to view details.' 
            : 'Token detected. View details below.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {tokens.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {tokens.map(token => (
              <Button
                key={`${token.type}-${token.value}`}
                variant={selectedToken?.value === token.value && selectedToken?.type === token.type 
                  ? "default" 
                  : "outline"
                }
                onClick={() => setSelectedToken(token)}
                className="text-xs"
              >
                {token.type === 'symbol' && (
                  <span className="mr-1 font-bold">$</span>
                )}
                {getTokenDisplayText(token)}
              </Button>
            ))}
          </div>
        )}
        
        {selectedToken && (
          <div className="mt-2">
            <div className="text-sm font-mono bg-slate-200 p-2 rounded mb-3 break-all border border-slate-300">
              {selectedToken.type === 'symbol' 
                ? `Token Symbol: $${selectedToken.value}` 
                : selectedToken.value
              }
            </div>
            
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}
            
            {isError && (
              <div className="text-red-500 text-sm">
                Error: {(error as Error)?.message || 'Failed to load token data'}
              </div>
            )}
            
            {!isLoading && !isError && tokenData && !tokenData.error && (
              <div className="space-y-4">
                <div className="flex items-center">
                  {tokenData.logo && (
                    <img 
                      src={tokenData.logo} 
                      alt={tokenData.name || 'Token logo'} 
                      className="w-10 h-10 mr-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">
                      {tokenData.name || 'Unknown Token'} 
                      {tokenData.symbol && <span className="ml-2 text-gray-500">({tokenData.symbol})</span>}
                    </h3>
                    {tokenData.price && typeof tokenData.price === 'number' ? (
                      <p className="text-lg font-bold">${tokenData.price.toFixed(6)}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Price unavailable</p>
                    )}
                  </div>
                </div>
                
                <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 mb-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="min-h-[120px]">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {tokenData.holders !== undefined && (
                        <div className="bg-white p-2 rounded border">
                          <div className="text-xs text-gray-500 flex items-center">
                            <Users className="h-3 w-3 mr-1" /> Holders
                          </div>
                          <div className="font-bold">{formatNumber(tokenData.holders)}</div>
                        </div>
                      )}
                      
                      {tokenData.volumeChange24h !== undefined && (
                        <div className="bg-white p-2 rounded border">
                          <div className="text-xs text-gray-500 flex items-center">
                            <Activity className="h-3 w-3 mr-1" /> 24h Volume
                          </div>
                          <div className={`font-bold flex items-center ${tokenData.volumeChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tokenData.volumeChange24h >= 0 ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(tokenData.volumeChange24h).toFixed(2)}%
                          </div>
                        </div>
                      )}
                      
                      {tokenData.totalSupply && (
                        <div className="bg-white p-2 rounded border">
                          <div className="text-xs text-gray-500 flex items-center">
                            <Database className="h-3 w-3 mr-1" /> Total Supply
                          </div>
                          <div className="font-bold">{formatNumber(tokenData.totalSupply)}</div>
                        </div>
                      )}
                      
                      {tokenData.circulatingSupply && (
                        <div className="bg-white p-2 rounded border">
                          <div className="text-xs text-gray-500 flex items-center">
                            <BarChart4 className="h-3 w-3 mr-1" /> Circ. Supply
                          </div>
                          <div className="font-bold">{formatNumber(tokenData.circulatingSupply)}</div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="chart" className="min-h-[150px]">
                    {chartData.length > 0 ? (
                      <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                          <AreaChart
                            data={chartData}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" />
                            <YAxis 
                              domain={['auto', 'auto']}
                              tickFormatter={(value) => `$${value.toFixed(6)}`}
                            />
                            <Tooltip 
                              formatter={(value) => [`$${Number(value).toFixed(6)}`, 'Price']}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <Area 
                              type="monotone" 
                              dataKey="price" 
                              stroke="#8884d8" 
                              fillOpacity={1} 
                              fill="url(#colorPrice)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[150px] text-gray-500">
                        No price history data available
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="metrics" className="min-h-[120px]">
                    <div className="space-y-2">
                      {tokenData.priceChange24h !== undefined && typeof tokenData.priceChange24h === 'number' && (
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-sm">24h Price Change:</span>
                          <span className={`font-medium ${tokenData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tokenData.priceChange24h >= 0 ? '+' : ''}{tokenData.priceChange24h.toFixed(2)}%
                          </span>
                        </div>
                      )}
                      
                      {tokenData.volumeChange24h !== undefined && typeof tokenData.volumeChange24h === 'number' && (
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-sm">24h Volume Change:</span>
                          <span className={`font-medium ${tokenData.volumeChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tokenData.volumeChange24h >= 0 ? '+' : ''}{tokenData.volumeChange24h.toFixed(2)}%
                          </span>
                        </div>
                      )}
                      
                      {tokenData.holders !== undefined && (
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-sm">Total Holders:</span>
                          <span className="font-medium">{formatNumber(tokenData.holders)}</span>
                        </div>
                      )}
                      
                      {tokenData.totalSupply && (
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-sm">Total Supply:</span>
                          <span className="font-medium">{formatNumber(tokenData.totalSupply)}</span>
                        </div>
                      )}
                      
                      {tokenData.circulatingSupply && (
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-sm">Circulating Supply:</span>
                          <span className="font-medium">{formatNumber(tokenData.circulatingSupply)}</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      // Use token address from selectedToken or tokenData if available
                      const tokenAddress = selectedToken?.type === 'address' 
                        ? selectedToken.value 
                        : tokenData?.address;
                        
                      if (tokenAddress) {
                        window.open(`https://etherscan.io/token/${tokenAddress}`, '_blank');
                      }
                    }}
                  >
                    Etherscan <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      // Use token address from selectedToken or tokenData if available
                      const tokenAddress = selectedToken?.type === 'address' 
                        ? selectedToken.value 
                        : tokenData?.address;
                        
                      if (tokenAddress) {
                        window.open(`https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}`, '_blank');
                      }
                    }}
                  >
                    Uniswap <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      // Use token address from selectedToken or tokenData if available
                      const tokenAddress = selectedToken?.type === 'address' 
                        ? selectedToken.value 
                        : tokenData?.address;
                        
                      if (tokenAddress) {
                        window.open(`https://dexscreener.com/ethereum/${tokenAddress}`, '_blank');
                      }
                    }}
                  >
                    DexScreener <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      // Use token address from selectedToken or tokenData if available
                      const tokenAddress = selectedToken?.type === 'address' 
                        ? selectedToken.value 
                        : tokenData?.address;
                        
                      if (tokenAddress) {
                        window.open(`https://www.pump.fun/token/${tokenAddress}`, '_blank');
                      }
                    }}
                  >
                    Pump.fun <ExternalLink className="h-3 w-3 ml-1" />
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
      <CardFooter className="text-xs text-gray-500 border-t pt-2">
        Powered by Moralis Web3 API
      </CardFooter>
    </Card>
  );
};