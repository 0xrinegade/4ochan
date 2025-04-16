import React from "react";
import { useParams } from "wouter";
import { Header } from "@/components/Header";
import { BoardSidebar } from "@/components/BoardSidebar";
import { ThreadView } from "@/components/ThreadView";
import { useNostr } from "@/hooks/useNostr";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Thread: React.FC = () => {
  const { id: threadId } = useParams<{ id: string }>();
  const { connectedRelays, connect } = useNostr();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Show sidebar on desktop, hide on mobile */}
        {!isMobile && <BoardSidebar />}
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {connectedRelays === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded shadow-sm text-center max-w-md">
                <i className="fas fa-plug text-4xl text-primary mb-4"></i>
                <h2 className="text-xl font-bold mb-2">Not Connected to Relays</h2>
                <p className="text-gray-600 mb-4">
                  Connect to Nostr relays to view this thread.
                </p>
                <Button onClick={() => connect()} className="bg-primary">
                  Connect Now
                </Button>
              </div>
            </div>
          ) : !threadId ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded shadow-sm text-center max-w-md">
                <i className="fas fa-exclamation-triangle text-4xl text-accent mb-4"></i>
                <h2 className="text-xl font-bold mb-2">Thread Not Found</h2>
                <p className="text-gray-600 mb-4">
                  The thread you're looking for doesn't exist or couldn't be loaded.
                </p>
              </div>
            </div>
          ) : (
            <ThreadView threadId={threadId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Thread;
