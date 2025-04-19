import React from 'react';

interface PumpFunWidgetProps {
  contractAddress: string;
  className?: string;
}

/**
 * A widget that provides a Pump.fun link for a given contract address (CA)
 * This widget will be used in the Crypto board when a contract address is detected in a post
 */
export const PumpFunWidget: React.FC<PumpFunWidgetProps> = ({ 
  contractAddress, 
  className = '' 
}) => {
  // Clean the address - remove any non-hex characters and ensure it has 0x prefix
  const cleanAddress = contractAddress.trim();
  const formattedAddress = cleanAddress.startsWith('0x') 
    ? cleanAddress 
    : `0x${cleanAddress}`;
  
  // Validate it's likely an ethereum address
  const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(formattedAddress);
  
  if (!isValidEthAddress) {
    return null;
  }
  
  // Create the Pump.fun URL
  const pumpFunUrl = `https://pump.fun/token/${formattedAddress}`;
  
  // Create the Etherscan URL
  const etherscanUrl = `https://etherscan.io/token/${formattedAddress}`;
  
  return (
    <div className={`border border-black p-2 bg-white my-2 ${className}`}>
      <h4 className="text-sm font-bold mb-1">Contract detected:</h4>
      <div className="text-xs font-mono bg-gray-100 p-1 border border-black break-all mb-2">
        {formattedAddress}
      </div>
      
      <div className="flex gap-2 text-xs">
        <a 
          href={pumpFunUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-white px-2 py-1 border border-black"
          style={{ boxShadow: "2px 2px 0 #000" }}
        >
          Ape on Pump.fun
        </a>
        <a 
          href={etherscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-200 text-black px-2 py-1 border border-black"
          style={{ boxShadow: "2px 2px 0 #000" }}
        >
          View on Etherscan
        </a>
      </div>
    </div>
  );
};