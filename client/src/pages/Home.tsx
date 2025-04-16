import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Header } from "@/components/Header";
import { BoardSidebar } from "@/components/BoardSidebar";
import { useNostr } from "@/hooks/useNostr";
import { useBoards } from "@/hooks/useBoards";
import { Button } from "@/components/ui/button";

// Fake memecoin data for our retro UI
const memeCoins = [
  { id: "doge", name: "DogeCoin", symbol: "DOGE", price: "$0.12", change: "+5.3%" },
  { id: "shib", name: "Shiba Inu", symbol: "SHIB", price: "$0.000016", change: "-2.1%" },
  { id: "pepe", name: "Pepe", symbol: "PEPE", price: "$0.000003", change: "+12.7%" },
  { id: "wojak", name: "Wojak", symbol: "WOJAK", price: "$0.42", change: "-8.3%" },
  { id: "bonk", name: "Bonk", symbol: "BONK", price: "$0.000002", change: "+1.4%" },
];

const Home: React.FC = () => {
  const { id: boardId } = useParams<{ id?: string }>();
  const { boards, loading: loadingBoards } = useBoards();
  const { connect, connectedRelays } = useNostr();
  const [connecting, setConnecting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Find the current board details
  const currentBoard = boardId 
    ? boards.find(board => board.id === boardId)
    : boards.length > 0 
      ? boards[0] 
      : undefined;

  // Connect to relays if not connected
  useEffect(() => {
    if (connectedRelays === 0 && !connecting) {
      setConnecting(true);
      connect().finally(() => setConnecting(false));
    }
  }, [connectedRelays, connect]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <Header />
        
        <main className="container mx-auto px-4">
          {/* Main content area - matches the screenshot */}
          <div className="mb-4">
            <div className="bg-primary text-white p-2 font-bold">
              meme coins
            </div>
            <div className="bg-white border border-black border-t-0 p-3">
              {memeCoins.length > 0 ? (
                <table className="w-full border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2">Name</th>
                      <th className="border border-black p-2">Symbol</th>
                      <th className="border border-black p-2">Price</th>
                      <th className="border border-black p-2">24h Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memeCoins.map(coin => (
                      <tr key={coin.id} className="hover:bg-gray-50">
                        <td className="border border-black p-2">{coin.name}</td>
                        <td className="border border-black p-2 font-mono">{coin.symbol}</td>
                        <td className="border border-black p-2">{coin.price}</td>
                        <td className={`border border-black p-2 ${coin.change.startsWith('+') ? 'text-green-700' : 'text-red-700'}`}>
                          {coin.change}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>loading...</p>
              )}
            </div>
          </div>

          {/* For functionality and access to modals */}
          <div className="hidden">
            <BoardSidebar />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
