import Moralis from 'moralis';

// Initialize Moralis
let initialized = false;
export const initMoralis = async () => {
  if (!initialized && process.env.MORALIS_API_KEY) {
    try {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      initialized = true;
      console.log('Moralis initialized successfully on server');
    } catch (error) {
      console.error('Failed to initialize Moralis on server:', error);
    }
  } else if (!process.env.MORALIS_API_KEY) {
    console.error('MORALIS_API_KEY not found in environment variables');
  }
};

interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: string;
  logo?: string;
  logoHash?: string;
  thumbnail?: string;
}

interface TokenPrice {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  nativePrice?: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
  };
  usdPrice: number;
  exchangeAddress?: string;
  exchangeName?: string;
}

interface TokenAnalysisResponse {
  metadata?: TokenMetadata;
  price?: TokenPrice;
  error?: string;
}

/**
 * Get detailed information about an ERC20 token on Ethereum
 * @param address Token contract address
 * @returns Token metadata and price information
 */
export const getTokenAnalysis = async (address: string): Promise<TokenAnalysisResponse> => {
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
      }).catch(error => {
        console.log(`Price fetch error for ${address}: ${error.message}`);
        return null; // Return null instead of failing the whole request
      })
    ]);
    
    // Extract token metadata 
    const metadata = metadataResponse?.toJSON()?.[0];
    
    // Extract price data if available
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