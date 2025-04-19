import React, { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Header } from "@/components/Header";
import { BoardSidebar } from "@/components/BoardSidebar";
import { ThreadList } from "@/components/ThreadList";
import { useNostr } from "@/hooks/useNostr";
import { useBoards } from "@/hooks/useBoards";
import { CreateThreadModal } from "@/components/CreateThreadModal";
import { formatPubkey } from "@/lib/nostr";

const Home: React.FC<{ id?: string }> = ({ id }) => {
  // If id is not passed as a prop, try to get it from the URL params
  const params = useParams<{ id?: string }>();
  const boardId = id || params.id;
  
  const { boards: nostrBoards, loading: loadingBoards } = useBoards();
  const nostr = useNostr();
  const { connect, connectedRelays, relays, identity } = nostr;
  const [connecting, setConnecting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Find the current board details - either by ID or shortName
  const currentBoard = boardId
    ? nostrBoards.find(board => board.id === boardId || board.shortName === boardId)
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
        <main className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="w-full md:w-1/4">
              <div className="mb-2">
                <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center">
                  <span className="mr-1">■</span> QUICK LINKS
                </div>
                <div className="bg-white border border-black border-t-0 p-1">
                  <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-1 md:list-disc md:pl-4 text-sm">
                    <li className="mb-0.5"><Link href="/board/b" className="text-primary underline">Random</Link></li>
                    <li className="mb-0.5"><Link href="/board/tech" className="text-primary underline">Technology</Link></li>
                    <li className="mb-0.5"><Link href="/board/ai" className="text-primary underline">AI</Link></li>
                    <li className="mb-0.5"><Link href="/board/p" className="text-primary underline">Psyche</Link></li>
                    <li className="mb-0.5"><Link href="/board/gg" className="text-primary underline">Games</Link></li>
                  </ul>
                </div>
              </div>

            </div>

            <div className="w-full md:w-3/4">
              {currentBoard && boardId ? (
                <ThreadList 
                  boardId={currentBoard.id}
                  boardName={currentBoard.name}
                  boardShortName={currentBoard.shortName}
                  boardDescription={currentBoard.description}
                />
              ) : (
                <div className="mb-2">
                  <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
                    Welcome to the Board
                  </div>
                  <div className="bg-white border border-black border-t-0 p-2">
                    <p>Select a board from the quick links to get started.</p>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Footer - classic 90s */}
          <div className="mt-4 text-center text-xs">
            <div className="border-t border-black pt-1">
              <p className="flex items-center justify-center flex-wrap gap-x-1 gap-y-2">
                <span className="text-primary">◆</span> 
                <span>4ochan.org © 2025</span> 
                <span className="text-primary">◆</span> 
                <a href="#" className="text-primary underline">About</a> 
                <span className="text-primary">◆</span> 
                <a href="#" className="text-primary underline">Terms</a> 
                <span className="text-primary">◆</span> 
                <a href="#" className="text-primary underline">Privacy</a>
                <span className="text-primary">◆</span>
                <a href="/design" className="text-primary underline">Design</a>
                <span className="text-primary">◆</span>
              </p>
              <p className="text-[10px] mt-1.5 italic">Best viewed with Netscape Navigator</p>
              
              {/* Visitor counter moved from header */}
              <div className="my-1.5">
                <span className="bg-white border border-black inline-block px-2 py-0.5 text-[10px]">
                  Relays: {relays.length} | Connected: {connectedRelays} | Boards: {nostrBoards.length}
                </span>
              </div>
              
              {/* Classic 90s web badges */}
              <div className="flex flex-wrap items-center justify-center mt-1.5 gap-1">
                <div className="border border-black bg-gray-200 px-1 text-[8px] font-mono">HTML 1.0</div>
                <div className="border border-black bg-gray-200 px-1 text-[8px] font-mono">800x600</div>
                <div className="border border-black bg-blue-700 text-white px-1 text-[8px] animate-pulse font-mono">JAVASCRIPT ON</div>
                <div className="border border-gray-500 bg-white text-[8px] font-mono px-1 italic">
                  <span className="text-red-600 font-bold">W</span>
                  <span className="text-blue-600 font-bold">e</span>
                  <span className="text-green-600 font-bold">b</span>
                  <span className="text-yellow-600 font-bold">1.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* For functionality and access to modals */}
          <div className="hidden">
            <BoardSidebar />
          </div>
          
          {/* Create Thread Modal */}
          {showCreateModal && (
            <CreateThreadModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCreateThread={(title, content, imageUrls) => {
                console.log("Creating thread:", { title, content, imageUrls });
                setShowCreateModal(false);
                return Promise.resolve();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;