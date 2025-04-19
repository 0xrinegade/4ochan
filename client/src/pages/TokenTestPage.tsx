import React from 'react';
import { PumpFunWidget } from '@/components/PumpFunWidget';

export const TokenTestPage: React.FC = () => {
  // Sample post content with token mentions
  const testContent = `
Testing token analysis with various tokens:
  
Ethereum (ETH): 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
Solana (SOL): $SOL
Bitcoin Wrapped (WBTC): 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
Tether (USDT): 0xdAC17F958D2ee523a2206206994597C13D831ec7

Let's also include a popular Solana token:
BONK: 6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN
  `;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Token Detection Test</h1>
      <div className="bg-gray-100 p-4 rounded mb-4 whitespace-pre-wrap">
        {testContent}
      </div>

      <h2 className="text-xl font-bold mb-2">Token Analysis</h2>
      <PumpFunWidget content={testContent} />
    </div>
  );
};

export default TokenTestPage;