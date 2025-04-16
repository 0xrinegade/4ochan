import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Header } from "@/components/Header";
import { BoardSidebar } from "@/components/BoardSidebar";
import { ThreadList } from "@/components/ThreadList";
import { useNostr } from "@/hooks/useNostr";
import { useBoards } from "@/hooks/useBoards";
import { Button } from "@/components/ui/button";

// Sample imageboard data for our retro UI
const boards = [
  { id: "b", name: "Random", postCount: 143 },
  { id: "a", name: "Anime", postCount: 78 },
  { id: "g", name: "Technology", postCount: 92 },
  { id: "v", name: "Video Games", postCount: 105 },
  { id: "pol", name: "Politics", postCount: 231 },
];

const Home: React.FC = () => {
  const { id: boardId } = useParams<{ id?: string }>();
  const { boards: nostrBoards, loading: loadingBoards } = useBoards();
  const { connect, connectedRelays } = useNostr();
  const [connecting, setConnecting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Find the current board details
  const currentBoard = boardId 
    ? nostrBoards.find(board => board.id === boardId)
    : nostrBoards.length > 0 
      ? nostrBoards[0] 
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
          {/* Main content area - 90s style */}
          <div className="mb-4">
            <div className="bg-primary text-white p-2 font-bold">
              create thread
            </div>
            <div className="bg-white border border-black border-t-0 p-3">
              <p className="mb-3">create a new thread on the imageboard with a few clicks.</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-white font-bold py-1 px-3 border border-black"
              >
                create thread
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="bg-primary text-white p-2 font-bold">
              boards
            </div>
            <div className="bg-white border border-black border-t-0 p-3">
              {boards.length > 0 ? (
                <table className="w-full border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2">Board</th>
                      <th className="border border-black p-2">Description</th>
                      <th className="border border-black p-2">Posts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boards.map(board => (
                      <tr key={board.id} className="hover:bg-gray-50">
                        <td className="border border-black p-2 font-mono">/{board.id}/</td>
                        <td className="border border-black p-2">{board.name}</td>
                        <td className="border border-black p-2">{board.postCount}</td>
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
