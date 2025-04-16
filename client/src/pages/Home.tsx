import React, { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
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
          {/* Subtitle only - h1 and marquee removed */}
          <div className="text-center mb-2">
            <p className="text-xs italic border-b border-primary pb-1">The premier nostric imageboard since 2025</p>
          </div>
          
          {/* Top navigation - classic 90s tab-style */}
          <div className="flex border-b border-black mb-3">
            <a href="#" className="bg-primary text-white px-3 py-0.5 text-sm font-bold border border-black border-b-0 mr-1">Home</a>
            <a href="#" className="bg-white px-3 py-0.5 text-sm border border-black border-b-0 mr-1">Rules</a>
            <a href="#" className="bg-white px-3 py-0.5 text-sm border border-black border-b-0 mr-1">FAQ</a>
            <a href="#" className="bg-white px-3 py-0.5 text-sm border border-black border-b-0 mr-1">About</a>
          </div>
          
          {/* Main content area - 90s style */}
          <div className="flex flex-col md:flex-row gap-2">
            {/* Left sidebar with quick links */}
            <div className="md:w-1/4">
              <div className="mb-2">
                <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center">
                  <span className="mr-1">■</span> QUICK LINKS
                </div>
                <div className="bg-white border border-black border-t-0 p-1">
                  <ul className="list-disc pl-4 text-sm">
                    <li className="mb-0.5"><a href="#" className="text-primary underline">Random</a></li>
                    <li className="mb-0.5"><a href="#" className="text-primary underline">Technology</a></li>
                    <li className="mb-0.5">
                      <div className="flex items-center">
                        <a href="#" className="text-primary underline">Anime</a>
                        <div className="ml-1 text-[10px] font-bold bg-red-500 text-white px-1 animate-pulse">NEW!</div>
                      </div>
                    </li>
                    <li className="mb-0.5"><a href="#" className="text-primary underline">Politics</a></li>
                    <li className="mb-0.5"><a href="#" className="text-primary underline">Video Games</a></li>
                  </ul>
                  <div className="mt-2 p-1 border border-blue-500 bg-blue-100 text-center text-xs">
                    <div className="font-bold text-blue-700">HOT TIP:</div>
                    <p className="text-[10px]">Press Ctrl+F5 to refresh your cache if pages don't load correctly!</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center">
                  <span className="mr-1">■</span> STATS
                </div>
                <div className="bg-white border border-black border-t-0 p-1 text-xs">
                  <div className="flex items-center mb-0.5">
                    <span className="animate-blink text-green-600 mr-1">●</span>
                    <p>Visitors: <span className="font-mono bg-black text-green-400 px-1">0042069</span></p>
                  </div>
                  <p>Threads: 1,337</p>
                  <p>Posts today: 8,008</p>
                  <p className="text-[10px] mt-1 text-center italic border-t border-dotted border-gray-400 pt-1">You are visitor #<span className="font-bold">42,069</span></p>
                </div>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="md:w-3/4">
              <div className="mb-2">
                <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="mr-1">■</span> TRENDING NOW
                  </div>
                  <span className="inline-block animate-pulse bg-yellow-300 text-black text-[10px] px-1 font-bold">LIVE</span>
                </div>
                <div className="bg-white border border-black border-t-0 p-2">
                  <div className="marquee mb-1">
                    <span>Threads are automatically ranked by activity - the most active threads rise to the top! Post and reply to keep your favorite discussions alive!</span>
                  </div>
                  
                  {/* Top 3 trending threads with rank badges */}
                  <div className="space-y-1 mt-2">
                    <div className="border border-black p-1 relative">
                      <div className="absolute -left-1 -top-1 bg-yellow-400 text-black w-5 h-5 flex items-center justify-center font-bold border border-black text-xs">1</div>
                      <div className="pl-5">
                        <div className="flex justify-between">
                          <span className="font-bold text-primary text-xs">King of the Hill Thread</span>
                          <span className="text-[10px]">5 min ago</span>
                        </div>
                        <p className="text-xs">The most active threads will automatically move to the top! This creates a dynamic "king of the hill" experience.</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px]">15 replies</span>
                          <div className="flex items-center">
                            <span className="bg-primary text-white text-[10px] px-1">HOT</span>
                            <div className="relative w-12 h-1.5 bg-gray-200 ml-1 overflow-hidden">
                              <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: '90%', animation: 'pulse 2s infinite' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-black p-1 relative">
                      <div className="absolute -left-1 -top-1 bg-gray-300 text-black w-5 h-5 flex items-center justify-center font-bold border border-black text-xs">2</div>
                      <div className="pl-5">
                        <div className="flex justify-between">
                          <span className="font-bold text-xs">Real-time Updates</span>
                          <span className="text-[10px]">12 min ago</span>
                        </div>
                        <p className="text-xs">The thread list refreshes automatically to show the most active discussions at the top!</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px]">8 replies</span>
                          <div className="flex items-center">
                            <span className="bg-primary text-white text-[10px] px-1">HOT</span>
                            <div className="relative w-12 h-1.5 bg-gray-200 ml-1 overflow-hidden">
                              <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: '60%', animation: 'pulse 2s infinite' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-black p-1 relative">
                      <div className="absolute -left-1 -top-1 bg-amber-600 text-white w-5 h-5 flex items-center justify-center font-bold border border-black text-xs">3</div>
                      <div className="pl-5">
                        <div className="flex justify-between">
                          <span className="font-bold text-xs">This retro UI is actually really cool!</span>
                          <span className="text-[10px]">18 min ago</span>
                        </div>
                        <p className="text-xs">The 90s aesthetic combined with modern functionality creates a unique experience.</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px]">5 replies</span>
                          <div className="flex items-center">
                            <span className="bg-primary text-white text-[10px] px-1">HOT</span>
                            <div className="relative w-12 h-1.5 bg-gray-200 ml-1 overflow-hidden">
                              <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: '40%', animation: 'pulse 2s infinite' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="mr-1">■</span> CREATE THREAD
                  </div>
                  <button 
                    onClick={() => {}} 
                    className="bg-white text-primary text-[10px] font-bold py-0 px-1 border border-white"
                  >
                    [?]
                  </button>
                </div>
                <div className="bg-white border border-black border-t-0 p-2">
                  <div className="flex items-center mb-1">
                    <p className="mr-2 text-xs">Create a new thread on the imageboard with a few clicks.</p>
                    <div className="flex items-center bg-yellow-100 border border-black px-1 rotate-2">
                      <span className="text-[10px] font-bold">UNDER CONSTRUCTION</span>
                      <span className="ml-1 text-yellow-500">▲</span>
                      <span className="text-black">▼</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black text-xs"
                    style={{ boxShadow: "2px 2px 0 #000" }}
                  >
                    Create Thread
                  </button>
                </div>
              </div>

              <div className="mb-2">
                <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center">
                  <span className="mr-1">■</span> POPULAR BOARDS
                </div>
                <div className="bg-white border border-black border-t-0 p-2">
                  {boards.length > 0 ? (
                    <table className="w-full border-collapse border-2 border-black text-left">
                      <thead>
                        <tr className="bg-primary text-white">
                          <th className="border border-black p-0.5 text-center font-bold text-[10px]">BOARD</th>
                          <th className="border border-black p-0.5 text-center font-bold text-[10px]">DESCRIPTION</th>
                          <th className="border border-black p-0.5 text-center font-bold text-[10px]">POSTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boards.map((board, idx) => (
                          <tr key={board.id} className={idx % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                            <td className="border border-black p-0.5 font-mono text-center text-xs">
                              <a href={`#${board.id}`} className="text-primary underline font-bold">/{board.id}/</a>
                            </td>
                            <td className="border border-black p-0.5 text-xs">{board.name}</td>
                            <td className="border border-black p-0.5 text-center text-xs">{board.postCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs">loading...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - classic 90s */}
          <div className="mt-4 text-center text-xs">
            <div className="border-t border-black pt-1">
              <p className="flex items-center justify-center flex-wrap">
                <span className="text-primary mx-1">◆</span> 
                4ochan.org © 2025 
                <span className="text-primary mx-1">◆</span> 
                <a href="#" className="text-primary underline">About</a> 
                <span className="text-primary mx-1">◆</span> 
                <a href="#" className="text-primary underline">Terms</a> 
                <span className="text-primary mx-1">◆</span> 
                <a href="#" className="text-primary underline">Privacy</a>
                <span className="text-primary mx-1">◆</span>
                <a href="/design" className="text-primary underline">Design System</a>
                <span className="text-primary mx-1">◆</span>
              </p>
              <p className="text-[10px] mt-0.5 italic">Best viewed with Netscape Navigator</p>
              
              {/* Visitor counter moved from header */}
              <div className="my-1.5">
                <span className="bg-white border border-black inline-block px-2 py-0.5 text-[10px]">
                  Visitors: 133,742 | Active users: 420
                </span>
              </div>
              
              {/* Classic 90s web badges */}
              <div className="flex items-center justify-center mt-1.5 space-x-1">
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
        </main>
      </div>
    </div>
  );
};

export default Home;
