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
          {/* Top navigation - classic 90s tab-style */}
          <div className="flex border-b border-black mb-4">
            <a href="#" className="bg-primary text-white px-4 py-1 font-bold border border-black border-b-0 mr-1">Home</a>
            <a href="#" className="bg-white px-4 py-1 border border-black border-b-0 mr-1">Rules</a>
            <a href="#" className="bg-white px-4 py-1 border border-black border-b-0 mr-1">FAQ</a>
            <a href="#" className="bg-white px-4 py-1 border border-black border-b-0 mr-1">About</a>
          </div>
          
          {/* Main content area - 90s style */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left sidebar with quick links */}
            <div className="md:w-1/4">
              <div className="mb-4">
                <div className="bg-primary text-white p-2 font-bold">
                  quick links
                </div>
                <div className="bg-white border border-black border-t-0 p-2">
                  <ul className="list-disc pl-5">
                    <li className="mb-1"><a href="#" className="text-primary underline">Random</a></li>
                    <li className="mb-1"><a href="#" className="text-primary underline">Technology</a></li>
                    <li className="mb-1"><a href="#" className="text-primary underline">Anime</a></li>
                    <li className="mb-1"><a href="#" className="text-primary underline">Politics</a></li>
                    <li className="mb-1"><a href="#" className="text-primary underline">Video Games</a></li>
                  </ul>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="bg-primary text-white p-2 font-bold">
                  stats
                </div>
                <div className="bg-white border border-black border-t-0 p-2 text-sm">
                  <p>Online: 420</p>
                  <p>Threads: 1,337</p>
                  <p>Posts today: 8,008</p>
                </div>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="md:w-3/4">
              <div className="mb-4">
                <div className="bg-primary text-white p-2 font-bold flex justify-between items-center">
                  <span>create thread</span>
                  <button 
                    onClick={() => {}} 
                    className="bg-white text-primary text-xs font-bold py-0 px-2 border border-white"
                  >
                    [?]
                  </button>
                </div>
                <div className="bg-white border border-black border-t-0 p-3">
                  <p className="mb-3">Create a new thread on the imageboard with a few clicks.</p>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary text-white font-bold py-1 px-3 border border-black"
                  >
                    Create Thread
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="bg-primary text-white p-2 font-bold">
                  popular boards
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
                            <td className="border border-black p-2 font-mono">
                              <a href={`#${board.id}`} className="text-primary underline font-bold">/{board.id}/</a>
                            </td>
                            <td className="border border-black p-2">{board.name}</td>
                            <td className="border border-black p-2 text-center">{board.postCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>loading...</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="bg-primary text-white p-2 font-bold">
                  recent posts
                </div>
                <div className="bg-white border border-black border-t-0 p-3">
                  {/* Sample recent posts */}
                  <div className="border border-black p-2 mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">Anonymous</span>
                      <span className="text-xs">Today 03:45</span>
                    </div>
                    <p className="text-sm">Has anyone actually used Nostr for anything useful yet?</p>
                    <div className="text-xs text-right mt-1">
                      <a href="#" className="text-primary underline">Reply</a>
                    </div>
                  </div>
                  
                  <div className="border border-black p-2">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">Anonymous</span>
                      <span className="text-xs">Today 03:42</span>
                    </div>
                    <p className="text-sm">This retro UI is actually really cool and nostalgic!</p>
                    <div className="text-xs text-right mt-1">
                      <a href="#" className="text-primary underline">Reply</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - classic 90s */}
          <div className="mt-8 text-center text-sm">
            <div className="border-t border-black pt-2">
              <p>NostrChan © 2025 | <a href="#" className="text-primary underline">About</a> | <a href="#" className="text-primary underline">Terms</a> | <a href="#" className="text-primary underline">Privacy</a></p>
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
