import React from 'react';
import { ExternalLink } from 'lucide-react';

interface SolanaWalletProps {
  address: string;
}

export const SolanaWallet: React.FC<SolanaWalletProps> = ({ address }) => {
  // Format the address to show only first 4 and last 4 characters
  const formatAddress = (addr: string): string => {
    if (!addr || addr.length < 8) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const openSolscan = () => {
    window.open(`https://solscan.io/address/${address}`, '_blank');
  };

  return (
    <div className="inline-flex items-center">
      <button
        onClick={openSolscan}
        className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs px-2 py-1 rounded-md font-medium"
      >
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 128 128" 
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mr-1"
        >
          <path
            d="M93.94 42.63H13.44a8.33 8.33 0 0 0-8.33 8.32v26.12a8.33 8.33 0 0 0 8.33 8.33h80.5a8.33 8.33 0 0 0 8.33-8.33V50.95a8.33 8.33 0 0 0-8.33-8.32Z"
            fill="#fff"
          />
          <path 
            d="M23.28 77.07 35.5 50.95h-8.4L15.89 77.07h7.39Zm16.45 0h7.8l12.19-26.12h-7.8L39.73 77.07Zm35.9-26.12h-15.5l-12.21 26.12h7.82l2.12-4.59h12.34l2.12 4.59h7.83l-4.53-9.75a11.43 11.43 0 0 0 5.7-9.81c0-3.62-2.94-6.56-6.56-6.56h.87Zm-3.38 15.36h-7.56l3.8-8.17h3.76a4.14 4.14 0 0 1 0 8.27v-.1Z"
            fill="#19103F"
          />
          <path 
            d="M104.81 35.24c-.2-.21-.51-.21-.71 0l-6.95 6.98 11.62 11.67 6.96-7a.5.5 0 0 0 0-.7l-10.92-10.95Z"
            fill="#19103F" 
          />
          <path 
            d="m97.15 42.22-42.9 43a2.54 2.54 0 0 0-.74 1.73v7.96c0 .3.2.5.5.5h7.94a2.45 2.45 0 0 0 1.72-.74l42.9-43-9.42-9.45Z"
            fill="#19103F" 
          />
        </svg>
        {formatAddress(address)}
        <ExternalLink size={10} />
      </button>
    </div>
  );
};