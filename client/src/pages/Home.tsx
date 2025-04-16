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
                <div className="bg-primary text-white py-1 px-2 font-bold text-sm flex items-center">
                  <span className="mr-1">■</span> QUICK LINKS
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
                <div className="bg-primary text-white py-1 px-2 font-bold text-sm flex items-center">
                  <span className="mr-1">■</span> STATS
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
                <div className="bg-primary text-white py-1 px-2 font-bold text-sm flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="mr-1">■</span> TRENDING NOW
                  </div>
                  <span className="inline-block animate-pulse bg-yellow-300 text-black text-xs px-1 font-bold">LIVE</span>
                </div>
                <div className="bg-white border border-black border-t-0 p-3">
                  <div className="marquee mb-2">
                    <span>Threads are automatically ranked by activity - the most active threads rise to the top! Post and reply to keep your favorite discussions alive!</span>
                  </div>
                  
                  {/* Top 3 trending threads with rank badges */}
                  <div className="space-y-2 mt-3">
                    <div className="border border-black p-2 relative">
                      <div className="absolute -left-1 -top-1 bg-yellow-400 text-black w-6 h-6 flex items-center justify-center font-bold border border-black">1</div>
                      <div className="pl-6">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-primary">King of the Hill Thread</span>
                          <span className="text-xs">5 min ago</span>
                        </div>
                        <p className="text-sm">The most active threads will automatically move to the top! This creates a dynamic "king of the hill" experience.</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs">15 replies</span>
                          <div className="flex items-center">
                            <span className="bg-primary text-white text-xs px-1 py-0.5">HOT</span>
                            <div className="relative w-16 h-2 bg-gray-200 ml-2 overflow-hidden">
                              <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: '90%', animation: 'pulse 2s infinite' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-black p-2 relative">
                      <div className="absolute -left-1 -top-1 bg-gray-300 text-black w-6 h-6 flex items-center justify-center font-bold border border-black">2</div>
                      <div className="pl-6">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold">Real-time Updates</span>
                          <span className="text-xs">12 min ago</span>
                        </div>
                        <p className="text-sm">The thread list refreshes automatically to show the most active discussions at the top!</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs">8 replies</span>
                          <div className="flex items-center">
                            <span className="bg-primary text-white text-xs px-1 py-0.5">HOT</span>
                            <div className="relative w-16 h-2 bg-gray-200 ml-2 overflow-hidden">
                              <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: '60%', animation: 'pulse 2s infinite' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-black p-2 relative">
                      <div className="absolute -left-1 -top-1 bg-amber-600 text-white w-6 h-6 flex items-center justify-center font-bold border border-black">3</div>
                      <div className="pl-6">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold">This retro UI is actually really cool!</span>
                          <span className="text-xs">18 min ago</span>
                        </div>
                        <p className="text-sm">The 90s aesthetic combined with modern functionality creates a unique experience.</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs">5 replies</span>
                          <div className="flex items-center">
                            <span className="bg-primary text-white text-xs px-1 py-0.5">HOT</span>
                            <div className="relative w-16 h-2 bg-gray-200 ml-2 overflow-hidden">
                              <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: '40%', animation: 'pulse 2s infinite' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="bg-primary text-white py-1 px-2 font-bold text-sm flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="mr-1">■</span> CREATE THREAD
                  </div>
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
                <div className="bg-primary text-white py-1 px-2 font-bold text-sm flex items-center">
                  <span className="mr-1">■</span> POPULAR BOARDS
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
