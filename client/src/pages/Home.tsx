import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Header } from "@/components/Header";
import { BoardSidebar } from "@/components/BoardSidebar";
import { ThreadList } from "@/components/ThreadList";
import { useNostr } from "@/hooks/useNostr";
import { useBoards } from "@/hooks/useBoards";
import { Button } from "@/components/ui/button";

const Home: React.FC = () => {
  const { id: boardId } = useParams<{ id?: string }>();
  const { boards, loading: loadingBoards } = useBoards();
  const { connect, connectedRelays } = useNostr();
  const [connecting, setConnecting] = useState(false);

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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col md:flex-row">
        <BoardSidebar />
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {connectedRelays === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded shadow-sm text-center max-w-md">
                <i className="fas fa-plug text-4xl text-primary mb-4"></i>
                <h2 className="text-xl font-bold mb-2">Not Connected to Relays</h2>
                <p className="text-gray-600 mb-4">
                  Connect to Nostr relays to view and participate in threads.
                </p>
                <Button 
                  onClick={() => connect()} 
                  className="bg-primary"
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Connecting...
                    </>
                  ) : (
                    "Connect Now"
                  )}
                </Button>
              </div>
            </div>
          ) : !currentBoard && loadingBoards ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin text-2xl text-primary mb-2"></i>
                <p>Loading boards...</p>
              </div>
            </div>
          ) : !currentBoard ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded shadow-sm text-center max-w-md">
                <i className="fas fa-clipboard-list text-4xl text-primary mb-4"></i>
                <h2 className="text-xl font-bold mb-2">No Board Selected</h2>
                <p className="text-gray-600 mb-4">
                  Select a board from the sidebar or create a new one to get started.
                </p>
              </div>
            </div>
          ) : (
            <ThreadList 
              boardId={currentBoard.id}
              boardName={currentBoard.name}
              boardShortName={currentBoard.shortName}
              boardDescription={currentBoard.description}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
