import Moralis from 'moralis';

// Initialize Moralis
let initialized = false;
export const initMoralis = async () => {
  if (!initialized) {
    try {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      initialized = true;
      console.log('Moralis initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Moralis:', error);
    }
  }
};

export interface TokenMetadata {
  name?: string;
  symbol?: string;
  decimals?: string;
  logo?: string;
  logoHash?: string;
  thumbnail?: string;
  blockNumber?: string;
  validated?: boolean;
  createdAt?: string;
}

export interface TokenPrice {
  nativePrice?: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
  };
  usdPrice?: number;
  exchangeAddress?: string;
  exchangeName?: string;
}

export interface TokenPriceHistory {
  timestamp: number;
  price: number;
  volume?: number;
  marketCap?: number;
}

export interface TokenMetrics {
  totalSupply?: string;
  circulatingSupply?: string;
  holders?: number;
  transactions24h?: number;
  volumeChange24h?: number;
  priceChange24h?: number;
}

export interface TokenAnalysis {
  metadata?: TokenMetadata;
  price?: TokenPrice;
  priceHistory?: TokenPriceHistory[];
  metrics?: TokenMetrics;
  error?: string;
}

/**
 * Get detailed information about an ERC20 token on Ethereum
 * @param address Token contract address
 * @returns Token metadata and price information
 */
export const getTokenAnalysis = async (address: string): Promise<TokenAnalysis> => {
  try {
    await initMoralis();
    
    // Fetch token metadata and price in parallel
    const [metadataResponse, priceResponse] = await Promise.all([
      Moralis.EvmApi.token.getTokenMetadata({
        chain: '0x1', // Ethereum mainnet
        addresses: [address]
      }),
      Moralis.EvmApi.token.getTokenPrice({
        chain: '0x1', // Ethereum mainnet
        address
      })
    ]);
    
    // Extract token metadata 
    const metadata = metadataResponse?.toJSON()?.[0];
    
    // Extract price data
    const price = priceResponse?.toJSON();
    
    return {
      metadata,
      price
    };
  } catch (error) {
    console.error(`Error fetching token analysis for ${address}:`, error);
    return {
      error: (error as Error).message || 'Failed to fetch token information'
    };
  }
};

/**
 * Get token information in a simplified format
 * @param address Token contract address
 * @returns Simplified token information
 */
export const getSimplifiedTokenInfo = async (address: string): Promise<{
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
  address?: string; // Include the token address
  error?: string;
}> => {
  try {
    const response = await fetch(`/api/token/${address}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch token data');
    }
    
    const analysis = await response.json();
    
    if (analysis.error) {
      return { error: analysis.error };
    }
    
    return {
      name: analysis.metadata?.name,
      symbol: analysis.metadata?.symbol,
      price: analysis.price?.usdPrice,
      priceChange24h: analysis.metrics?.priceChange24h,
      volumeChange24h: analysis.metrics?.volumeChange24h,
      holders: analysis.metrics?.holders,
      totalSupply: analysis.metrics?.totalSupply,
      circulatingSupply: analysis.metrics?.circulatingSupply,
      logo: analysis.metadata?.thumbnail || analysis.metadata?.logo,
      priceHistory: analysis.priceHistory,
      address: address // Include the original token address
    };
  } catch (error) {
    console.error('Error in getSimplifiedTokenInfo:', error);
    return {
      error: (error as Error).message || 'Failed to fetch token information'
    };
  }
};