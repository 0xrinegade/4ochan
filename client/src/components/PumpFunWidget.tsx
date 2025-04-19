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
  Activity,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Tag,
  Layers,
  Maximize2,
  Repeat,
  Percent,
  Info,
  Lock as LockIcon,
  Hash
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
type TokenType = 'eth_address' | 'sol_address' | 'symbol';
interface DetectedToken {
  value: string;
  type: TokenType;
}

// Regular expression to find Ethereum addresses
const findEthAddresses = (content: string): string[] => {
  // Standard Ethereum address regex
  const standardRegex = /0x[a-fA-F0-9]{40}/g;
  
  // Context-aware address patterns - match addresses that are labeled as Ethereum or mentioned with specific words
  const contextPatterns = [
    // Format: "Ethereum address: 0x..."
    /\b(?:ethereum|eth)(?:\s+(?:address|contract|token))?[\s:\-]+(0x[a-fA-F0-9]{40})\b/gi,
    
    // Format: "Token: XXXX (0x...)"
    /\b(?:token|contract)[\s:\-]+[a-zA-Z][\s\w]*\(?(0x[a-fA-F0-9]{40})\)?/gi,
    
    // Format: "0x... (token name/symbol)"
    /(0x[a-fA-F0-9]{40})\s*\([^)]+\)/g,
  ];
  
  let matches: string[] = [];
  let match;
  
  // Match standard pattern
  while ((match = standardRegex.exec(content)) !== null) {
    matches.push(match[0]);
    console.log(`ETH address found:`, match[0]);
  }
  
  // Match context-aware patterns
  for (const pattern of contextPatterns) {
    while ((match = pattern.exec(content)) !== null) {
      const address = match[1]; // Capture group for address
      if (address) {
        matches.push(address);
        console.log(`ETH address found with context pattern ${pattern}:`, address);
      }
    }
  }
  
  // Return unique addresses
  const uniqueAddresses = Array.from(new Set(matches));
  return uniqueAddresses;
};

// Regular expression to find Solana addresses
const findSolAddresses = (content: string): string[] => {
  // Improve matching of Solana addresses - being more precise
  // Solana addresses are base58-encoded strings, typically 32-44 characters long
  // Excluding common prefixes like 0x to avoid false matches with other cryptos
  
  // Common Solana address patterns
  const commonSolTokens = [
    // Explicit token mention with SOL name
    /\bBONK\s*:\s*([1-9A-HJ-NP-Za-km-z]{32,44})\b/g,
    /\bSol(?:ana)?\s*(?:token|address|contract)?[\s:\-]*([1-9A-HJ-NP-Za-km-z]{32,44})\b/gi,
    
    // Direct address match - more strict to avoid false positives
    /\b([1-9A-HJ-NP-Za-km-z]{43})\b/g,  // Exact 43 char match - very likely to be a Solana address
    /\b([1-9A-HJ-NP-Za-km-z]{44})\b/g,  // Exact 44 char match - very likely to be a Solana address
  ];
  
  let matches: string[] = [];
  
  for (const pattern of commonSolTokens) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      // If the pattern has a capturing group, use that, otherwise use the full match
      const address = match[1] || match[0];
      matches.push(address);
      
      // Debug log for development
      console.log(`SOL match found with pattern ${pattern}:`, address);
    }
  }
  
  // Return unique addresses
  const uniqueAddresses = Array.from(new Set(matches));
  return uniqueAddresses;
};

// Regular expression to find token ticker symbols (like $ETH, $BTC, etc)
const findTokenSymbols = (content: string): string[] => {
  // Multiple patterns to catch various ways tokens are mentioned
  const patterns = [
    // Standard $XXX format
    /\$([A-Za-z]{2,10})\b/g,
    
    // Explicitly labeled as token/symbol: XXX
    /\b(?:token|symbol|ticker)[:\s]+([A-Z]{2,10})\b/gi,
    
    // Common formats: ETH, SOL, BTC (without $ but in parentheses or after name)
    /\b(?:Ethereum|Ether)\s*\(([A-Z]{2,5})\)/gi,
    /\b(?:Solana)\s*\(([A-Z]{2,5})\)/gi,
    /\b(?:Bitcoin)\s*\(([A-Z]{2,5})\)/gi,
    
    // Explicitly mentioned popular tokens
    /\b(ETH|BTC|SOL|USDT|USDC|BONK|PEPE|DOGE)\b/g
  ];
  
  let matches: string[] = [];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      // match[1] is the capturing group without the symbol
      const symbol = (match[1] || match[0]).toUpperCase();
      matches.push(symbol);
      
      // Debug log
      console.log(`Symbol match found with pattern ${pattern}:`, symbol);
    }
  }
  
  // Return unique symbols
  const uniqueSymbols = Array.from(new Set(matches));
  return uniqueSymbols;
};

// Find all tokens (addresses and symbols) in content
const findTokens = (content: string): DetectedToken[] => {
  const ethAddresses = findEthAddresses(content);
  const solAddresses = findSolAddresses(content);
  const symbols = findTokenSymbols(content);
  
  const tokens: DetectedToken[] = [
    ...ethAddresses.map(addr => ({ value: addr, type: 'eth_address' as TokenType })),
    ...solAddresses.map(addr => ({ value: addr, type: 'sol_address' as TokenType })),
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

// Calculate circulation percentage
const calculateCirculationPercentage = (circulating: string | undefined, total: string | undefined): number => {
  if (!circulating || !total) return 0;
  
  try {
    // Handle scientific notation strings or regular numbers
    const circulatingNum = parseFloat(circulating);
    const totalNum = parseFloat(total);
    
    if (isNaN(circulatingNum) || isNaN(totalNum) || totalNum === 0) return 0;
    
    const percentage = (circulatingNum / totalNum) * 100;
    return Math.min(100, Math.round(percentage * 10) / 10); // Round to 1 decimal place, cap at 100%
  } catch (error) {
    console.error('Error calculating circulation percentage:', error);
    return 0;
  }
};

interface TokenBondingInfo {
  bondingStatus?: 'bonding' | 'graduated' | 'new';
  bondingCurve?: {
    reserveToken: string;
    reserveBalance: string;
    supplyBalance: string;
  };
  createdAt?: number;
  updatedAt?: number;
}

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
  bondingInfo?: TokenBondingInfo;
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
      
      if (selectedToken.type === 'eth_address') {
        // Fetch by Ethereum address
        return getSimplifiedTokenInfo(selectedToken.value);
      } else if (selectedToken.type === 'sol_address') {
        // Fetch Solana token info
        try {
          const response = await fetch(`/api/solana-token/${selectedToken.value}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch Solana token data');
          }
          return response.json();
        } catch (error) {
          console.error('Error fetching Solana token:', error);
          return { 
            error: 'Failed to fetch Solana token data. This feature requires Solana API support.',
            address: selectedToken.value
          };
        }
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
  
  // Automatically select the first token if available and log detected tokens for debugging
  useEffect(() => {
    if (tokens.length > 0) {
      console.log('Detected tokens:', tokens);
      
      if (!selectedToken) {
        console.log('Auto-selecting first token:', tokens[0]);
        setSelectedToken(tokens[0]);
      }
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
    if (token.type === 'eth_address') {
      return `${token.value.substring(0, 6)}...${token.value.substring(38)}`;
    } else if (token.type === 'sol_address') {
      return `${token.value.substring(0, 4)}...${token.value.substring(token.value.length - 4)}`;
    } else {
      return `$${token.value}`;
    }
  };
  
  return (
    <Card className="mt-4 bg-slate-100 border-black">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          Token Analysis
          {tokenData?.priceChange24h !== undefined && typeof tokenData.priceChange24h === 'number' && (
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
                : selectedToken.type === 'eth_address'
                  ? `Ethereum Address: ${selectedToken.value}`
                  : `Solana Address: ${selectedToken.value}`
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
                  <TabsList className="grid grid-cols-4 mb-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="pumpfun" className={selectedToken?.type === 'sol_address' ? '' : 'opacity-50'}>
                      Pump.fun
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="min-h-[120px]">
                    <div className="mb-4">
                      {/* Price Section */}
                      <div className="mb-3 p-2 bg-gray-50 border rounded">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm text-gray-600 font-semibold flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" /> Price
                          </div>
                          {tokenData.priceChange24h !== undefined && typeof tokenData.priceChange24h === 'number' && (
                            <div className={`text-xs flex items-center font-medium ${tokenData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tokenData.priceChange24h >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {Math.abs(tokenData.priceChange24h).toFixed(2)}% (24h)
                            </div>
                          )}
                        </div>
                        <div className="text-lg font-bold">
                          ${typeof tokenData.price === 'number' ? tokenData.price.toFixed(6) : 'N/A'}
                        </div>
                      </div>
                      
                      {/* Primary Metrics - 2 columns */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {tokenData.holders !== undefined && (
                          <div className="bg-white p-2 rounded border hover:bg-gray-50 transition-colors">
                            <div className="text-xs text-gray-500 flex items-center">
                              <Users className="h-3 w-3 mr-1" /> Holders
                            </div>
                            <div className="font-bold">{formatNumber(tokenData.holders)}</div>
                          </div>
                        )}
                        
                        {tokenData.volumeChange24h !== undefined && typeof tokenData.volumeChange24h === 'number' && (
                          <div className="bg-white p-2 rounded border hover:bg-gray-50 transition-colors">
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
                      </div>
                      
                      {/* Supply info section */}
                      <div className="bg-white p-2 rounded border mb-3">
                        <div className="text-xs text-gray-500 font-medium mb-1">Supply Information</div>
                        <div className="grid grid-cols-2 gap-1">
                          {tokenData.totalSupply && (
                            <div className="flex items-center">
                              <Database className="h-3 w-3 mr-1 text-gray-400" /> 
                              <div className="text-xs">
                                <span className="text-gray-500 mr-1">Total:</span>
                                <span className="font-medium">{formatNumber(tokenData.totalSupply)}</span>
                              </div>
                            </div>
                          )}
                          
                          {tokenData.circulatingSupply && (
                            <div className="flex items-center">
                              <BarChart4 className="h-3 w-3 mr-1 text-gray-400" /> 
                              <div className="text-xs">
                                <span className="text-gray-500 mr-1">Circ:</span>
                                <span className="font-medium">{formatNumber(tokenData.circulatingSupply)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Token utility and category */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-gray-50">
                          <Tag className="h-3 w-3 mr-1" />
                          {tokenData.symbol ? tokenData.symbol.toUpperCase() : 'UNKNOWN'}
                        </Badge>
                        
                        <Badge variant="outline" className="bg-gray-50">
                          <Layers className="h-3 w-3 mr-1" />
                          {selectedToken?.type === 'eth_address' ? 'ERC-20' : 'SPL Token'}
                        </Badge>
                        
                        {tokenData.priceChange24h !== undefined && (
                          <Badge 
                            variant={tokenData.priceChange24h >= 0 ? "outline" : "outline"}
                            className={tokenData.priceChange24h >= 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}
                          >
                            {tokenData.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {tokenData.priceChange24h >= 0 ? 'Bullish' : 'Bearish'}
                          </Badge>
                        )}
                      </div>
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
                              tickFormatter={(value) => typeof value === 'number' ? `$${value.toFixed(6)}` : `$${value}`}
                            />
                            <Tooltip 
                              formatter={(value) => {
                                const numValue = Number(value);
                                return isNaN(numValue) ? [`$${value}`, 'Price'] : [`$${numValue.toFixed(6)}`, 'Price'];
                              }}
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
                    {/* Market Performance Section */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b flex items-center">
                        <Activity className="h-3 w-3 mr-1" /> MARKET PERFORMANCE
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {tokenData.priceChange24h !== undefined && typeof tokenData.priceChange24h === 'number' && (
                          <div className="p-2 bg-gray-50 rounded border">
                            <div className="text-xs text-gray-500 mb-1">Price (24h)</div>
                            <div className={`flex items-center text-sm font-semibold ${tokenData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tokenData.priceChange24h >= 0 ? (
                                <TrendingUp className="h-4 w-4 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 mr-1" />
                              )}
                              {tokenData.priceChange24h >= 0 ? '+' : ''}{tokenData.priceChange24h.toFixed(2)}%
                            </div>
                          </div>
                        )}
                        
                        {tokenData.volumeChange24h !== undefined && typeof tokenData.volumeChange24h === 'number' && (
                          <div className="p-2 bg-gray-50 rounded border">
                            <div className="text-xs text-gray-500 mb-1">Volume (24h)</div>
                            <div className={`flex items-center text-sm font-semibold ${tokenData.volumeChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tokenData.volumeChange24h >= 0 ? (
                                <TrendingUp className="h-4 w-4 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 mr-1" />
                              )}
                              {tokenData.volumeChange24h >= 0 ? '+' : ''}{tokenData.volumeChange24h.toFixed(2)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Supply & Holders Section */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b flex items-center">
                        <Database className="h-3 w-3 mr-1" /> SUPPLY & DISTRIBUTION
                      </div>
                      
                      <div className="space-y-2">
                        {tokenData.totalSupply && (
                          <div className="flex justify-between items-center">
                            <div className="text-sm flex items-center text-gray-700">
                              <Maximize2 className="h-3 w-3 mr-1 text-gray-400" /> Total Supply
                            </div>
                            <div className="font-medium">{formatNumber(tokenData.totalSupply)}</div>
                          </div>
                        )}
                        
                        {tokenData.circulatingSupply && (
                          <div className="flex justify-between items-center">
                            <div className="text-sm flex items-center text-gray-700">
                              <Repeat className="h-3 w-3 mr-1 text-gray-400" /> Circulating Supply
                            </div>
                            <div className="font-medium">{formatNumber(tokenData.circulatingSupply)}</div>
                          </div>
                        )}
                        
                        {tokenData.totalSupply && tokenData.circulatingSupply && (
                          <div className="flex justify-between items-center">
                            <div className="text-sm flex items-center text-gray-700">
                              <Percent className="h-3 w-3 mr-1 text-gray-400" /> Circulation Ratio
                            </div>
                            <div className="font-medium">
                              {calculateCirculationPercentage(tokenData.circulatingSupply, tokenData.totalSupply)}%
                            </div>
                          </div>
                        )}
                        
                        {tokenData.holders !== undefined && (
                          <div className="flex justify-between items-center">
                            <div className="text-sm flex items-center text-gray-700">
                              <Users className="h-3 w-3 mr-1 text-gray-400" /> Holders
                            </div>
                            <div className="font-medium">{formatNumber(tokenData.holders)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Token Details Section */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b flex items-center">
                        <Info className="h-3 w-3 mr-1" /> TOKEN DETAILS
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="text-sm flex items-center text-gray-700">
                            <Hash className="h-3 w-3 mr-1 text-gray-400" /> Token Type
                          </div>
                          <div className="font-medium">
                            {selectedToken?.type === 'eth_address' ? 'ERC-20' : 'SPL Token'}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm flex items-center text-gray-700">
                            <Tag className="h-3 w-3 mr-1 text-gray-400" /> Symbol
                          </div>
                          <div className="font-medium">
                            {tokenData.symbol ? tokenData.symbol.toUpperCase() : 'UNKNOWN'}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm flex items-center text-gray-700">
                            <LockIcon className="h-3 w-3 mr-1 text-gray-400" /> Contract
                          </div>
                          <div className="font-medium text-xs font-mono truncate max-w-[120px]">
                            {selectedToken?.value ? selectedToken.value.substring(0, 8) + '...' : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pumpfun" className="min-h-[120px]">
                    {selectedToken?.type !== 'sol_address' ? (
                      <div className="text-center text-gray-500 py-4">
                        <Info className="h-5 w-5 mx-auto mb-2" />
                        <p>Pump.fun data is only available for Solana tokens.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Bonding Status Section */}
                        {tokenData?.bondingInfo && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b flex items-center">
                              <LockIcon className="h-3 w-3 mr-1" /> BONDING STATUS
                            </div>
                            
                            <div className="p-3 bg-gray-50 rounded border mb-3">
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-sm font-medium">Status:</div>
                                <Badge 
                                  variant="outline"
                                  className={
                                    tokenData.bondingInfo?.bondingStatus === 'bonding' 
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : tokenData.bondingInfo?.bondingStatus === 'graduated'
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  }
                                >
                                  {tokenData.bondingInfo?.bondingStatus === 'bonding' 
                                    ? <LockIcon className="h-3 w-3 mr-1" /> 
                                    : tokenData.bondingInfo?.bondingStatus === 'graduated'
                                      ? <Maximize2 className="h-3 w-3 mr-1" />
                                      : <Tag className="h-3 w-3 mr-1" />
                                  }
                                  {tokenData.bondingInfo?.bondingStatus 
                                    ? tokenData.bondingInfo.bondingStatus.charAt(0).toUpperCase() + tokenData.bondingInfo.bondingStatus.slice(1)
                                    : "Unknown"
                                  }
                                </Badge>
                              </div>
                              
                              {tokenData.bondingInfo?.createdAt && (
                                <div className="flex justify-between items-center text-sm mb-1">
                                  <div className="text-gray-500">Created:</div>
                                  <div>{new Date(tokenData.bondingInfo.createdAt).toLocaleDateString()}</div>
                                </div>
                              )}
                              
                              {tokenData.bondingInfo?.bondingStatus === 'bonding' && tokenData.bondingInfo?.bondingCurve && (
                                <div className="mt-3 pt-2 border-t">
                                  <div className="text-xs font-semibold mb-2">Bonding Curve Details:</div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <div className="text-gray-500">Reserve Token:</div>
                                      <div className="font-mono">{tokenData.bondingInfo.bondingCurve.reserveToken}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Reserve Balance:</div>
                                      <div>{formatNumber(tokenData.bondingInfo.bondingCurve.reserveBalance)}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Supply Balance:</div>
                                      <div>{formatNumber(tokenData.bondingInfo.bondingCurve.supplyBalance)}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Exchange Links */}
                        <div className="mb-4">
                          <div className="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b flex items-center">
                            <Repeat className="h-3 w-3 mr-1" /> EXCHANGES
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                if (selectedToken?.value) {
                                  window.open(`https://jup.ag/swap/SOL-${selectedToken.value}`, '_blank');
                                }
                              }}
                            >
                              Jupiter <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                if (selectedToken?.value) {
                                  window.open(`https://raydium.io/swap/?inputCurrency=SOL&outputCurrency=${selectedToken.value}`, '_blank');
                                }
                              }}
                            >
                              Raydium <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                if (selectedToken?.value) {
                                  window.open(`https://www.pump.fun/token/${selectedToken.value}`, '_blank');
                                }
                              }}
                            >
                              Pump.fun <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                if (selectedToken?.value) {
                                  window.open(`https://solscan.io/token/${selectedToken.value}`, '_blank');
                                }
                              }}
                            >
                              SolScan <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Related tokens section */}
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b flex items-center">
                            <Hash className="h-3 w-3 mr-1" /> SIMILAR TOKENS
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                window.open('https://www.pump.fun/tokens/new', '_blank');
                              }}
                            >
                              New Tokens <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                window.open('https://www.pump.fun/tokens/bonding', '_blank');
                              }}
                            >
                              Bonding Tokens <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                window.open('https://www.pump.fun/tokens/graduated', '_blank');
                              }}
                            >
                              Graduated <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                window.open('https://www.pump.fun/explorer', '_blank');
                              }}
                            >
                              Explorer <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                
                <div className="flex gap-2 mt-3 flex-wrap">
                  {selectedToken?.type === 'eth_address' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => {
                          // Use token address from selectedToken or tokenData if available
                          const tokenAddress = selectedToken?.type === 'eth_address' 
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
                          const tokenAddress = selectedToken?.type === 'eth_address' 
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
                          const tokenAddress = selectedToken?.type === 'eth_address' 
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
                          const tokenAddress = selectedToken?.type === 'eth_address' 
                            ? selectedToken.value 
                            : tokenData?.address;
                            
                          if (tokenAddress) {
                            window.open(`https://www.pump.fun/token/${tokenAddress}`, '_blank');
                          }
                        }}
                      >
                        Pump.fun <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </>
                  )}
                  
                  {selectedToken?.type === 'sol_address' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => {
                          if (selectedToken?.value) {
                            window.open(`https://solscan.io/token/${selectedToken.value}`, '_blank');
                          }
                        }}
                      >
                        Solscan <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => {
                          if (selectedToken?.value) {
                            window.open(`https://solana.fm/address/${selectedToken.value}`, '_blank');
                          }
                        }}
                      >
                        Solana FM <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => {
                          if (selectedToken?.value) {
                            window.open(`https://jup.ag/swap/SOL-${selectedToken.value}`, '_blank');
                          }
                        }}
                      >
                        Jupiter <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </>
                  )}
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