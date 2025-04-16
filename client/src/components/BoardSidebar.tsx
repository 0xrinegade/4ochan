import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import { useNostr } from "@/hooks/useNostr";
import { useBoards } from "@/hooks/useBoards";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPubkey } from "@/lib/nostr";
import { PlusCircleIcon, KeyIcon, UserIcon } from "lucide-react";

export const BoardSidebar: React.FC = () => {
  const [location] = useLocation();
  const { boards, createBoard } = useBoards();
  const { identity, updateIdentity } = useNostr();
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isChangeIdentityModalOpen, setIsChangeIdentityModalOpen] = useState(false);
  
  // New board form state
  const [newBoardShortName, setNewBoardShortName] = useState("");
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  
  // New identity form state
  const [newPrivKey, setNewPrivKey] = useState("");
  
  // Current board id from URL
  const currentBoardMatch = location.match(/\/board\/([^/]+)/);
  const currentBoardId = currentBoardMatch ? currentBoardMatch[1] : "";
  
  // Handle creating a new board
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBoardShortName || !newBoardName) {
      return; // Basic validation
    }
    
    try {
      await createBoard(newBoardShortName, newBoardName, newBoardDescription);
      
      // Reset form
      setNewBoardShortName("");
      setNewBoardName("");
      setNewBoardDescription("");
      
      // Close modal
      setIsCreateBoardModalOpen(false);
    } catch (error) {
      console.error("Failed to create board", error);
    }
  };
  
  // Handle changing identity (updated for nostr-tools v2.x)
  const handleChangeIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPrivKey) {
      return;
    }
    
    try {
      // Get public key from private key using updated API
      import("nostr-tools").then((nostrTools) => {
        // Convert hex string to Uint8Array for v2 compatibility if needed
        let privkeyBytes: Uint8Array;
        if (typeof newPrivKey === 'string') {
          // Ensure the private key is in the correct format (hex without prefix)
          const normalizedKey = newPrivKey.startsWith('0x') 
            ? newPrivKey.slice(2) 
            : newPrivKey;
            
          // Convert hex string to Uint8Array
          privkeyBytes = new Uint8Array(
            normalizedKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
          );
        } else {
          privkeyBytes = newPrivKey as unknown as Uint8Array;
        }
        
        const pubkey = nostrTools.getPublicKey(privkeyBytes);
        
        updateIdentity({
          pubkey,
          privkey: privkeyBytes,
          profile: { name: "Anonymous" }
        });
        
        // Reset form and close modal
        setNewPrivKey("");
        setIsChangeIdentityModalOpen(false);
      });
    } catch (error) {
      console.error("Invalid private key", error);
    }
  };
  
  // Generate a new identity (updated for nostr-tools v2.x)
  const handleGenerateNewIdentity = () => {
    import("nostr-tools").then((nostrTools) => {
      // In v2, use nip19 or other methods to generate keys
      // For now we'll use a simple method to create random bytes
      const privkeyBytes = crypto.getRandomValues(new Uint8Array(32));
      const pubkey = nostrTools.getPublicKey(privkeyBytes);
      
      updateIdentity({
        pubkey,
        privkey: privkeyBytes,
        profile: { name: "Anonymous" }
      });
      
      setIsChangeIdentityModalOpen(false);
    });
  };
  
  return (
    <div className="w-full md:w-60 bg-card border-r border-border">
      <div className="px-3 py-2 bg-primary text-primary-foreground flex justify-between items-center">
        <h2 className="text-sm font-bold tracking-wide uppercase">Boards</h2>
        <Button 
          onClick={() => setIsCreateBoardModalOpen(true)} 
          variant="secondary"
          size="sm"
          className="h-7 px-2 bg-accent/90 hover:bg-accent text-white border-0"
        >
          <PlusCircleIcon className="h-3.5 w-3.5 mr-1" /> New
        </Button>
      </div>
      
      <div className="overflow-y-auto h-full max-h-[calc(100vh-14rem)]">
        <ul className="board-list py-1">
          {boards.map(board => (
            <li 
              key={board.id}
              className={`
                group px-3 py-2 cursor-pointer 
                border-b border-border/50 transition-colors
                hover:bg-muted/50 flex items-center justify-between
                ${board.id === currentBoardId ? 'bg-primary/10 border-primary/20' : ''}
              `}
            >
              <Link href={`/board/${board.id}`} className="w-full">
                <div className="flex items-center w-full justify-between pr-1">
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold monaco ${board.id === currentBoardId ? 'text-primary' : ''}`}>
                      /{board.shortName}/
                    </span>
                    <span className={`text-xs ${board.id === currentBoardId ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {board.name}
                    </span>
                  </div>
                  <span className="text-xs bg-secondary/20 rounded-full px-2 py-0.5 text-secondary-foreground/70">
                    {board.threadCount}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      {/* User Identity Section */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground tracking-wide">IDENTITY</span>
          <button 
            className="text-xs text-accent hover:text-accent/80 flex items-center"
            onClick={() => setIsChangeIdentityModalOpen(true)}
          >
            <KeyIcon className="h-3 w-3 mr-1" /> Change
          </button>
        </div>
        <div className="flex items-center bg-muted/30 p-2 rounded-sm border border-border">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="ml-2 overflow-hidden">
            <div className="text-sm font-medium truncate">
              {identity.profile?.name || "Anon"}
            </div>
            <div className="text-xs monaco truncate text-muted-foreground">
              {formatPubkey(identity.pubkey)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Board Modal */}
      <Dialog open={isCreateBoardModalOpen} onOpenChange={setIsCreateBoardModalOpen}>
        <DialogContent className="border border-border">
          <DialogHeader className="border-b border-border pb-2 mb-2">
            <DialogTitle className="text-primary font-bold">Create New Board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBoard}>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shortName" className="text-right text-sm font-medium">
                  Short Name
                </Label>
                <Input
                  id="shortName"
                  value={newBoardShortName}
                  onChange={(e) => setNewBoardShortName(e.target.value)}
                  placeholder="b, tech, art, etc."
                  className="col-span-3 font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-sm font-medium">
                  Display Name
                </Label>
                <Input
                  id="name"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Random, Technology, Artwork, etc."
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right text-sm font-medium pt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="A short description of the board's purpose..."
                  className="col-span-3 text-sm"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-4 pt-2 border-t border-border">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90"
              >
                <PlusCircleIcon className="h-4 w-4 mr-1" /> Create Board
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Change Identity Modal */}
      <Dialog open={isChangeIdentityModalOpen} onOpenChange={setIsChangeIdentityModalOpen}>
        <DialogContent className="border border-border">
          <DialogHeader className="border-b border-border pb-2 mb-2">
            <DialogTitle className="text-primary font-bold">Change Identity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangeIdentity}>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="privateKey" className="text-right text-sm font-medium">
                  Private Key
                </Label>
                <Input
                  id="privateKey"
                  value={newPrivKey}
                  onChange={(e) => setNewPrivKey(e.target.value)}
                  placeholder="Enter hex private key"
                  className="col-span-3 monaco text-xs"
                />
              </div>
              <div className="text-xs text-muted-foreground col-span-4 bg-muted/30 p-3 rounded-sm border border-border">
                <p className="mb-1 font-semibold">About Nostr Keys</p>
                Import an existing key or generate a new one. Your key is stored locally and never sent to servers.
                <p className="mt-1 text-accent/90">Keep your private key secret – anyone with access to it can post as you.</p>
              </div>
            </div>
            <DialogFooter className="mt-4 pt-2 border-t border-border space-x-2">
              <Button type="button" variant="outline" onClick={handleGenerateNewIdentity} className="border-primary/30 text-primary">
                <KeyIcon className="h-3.5 w-3.5 mr-1" /> Generate New
              </Button>
              <Button type="submit" disabled={!newPrivKey} className="bg-primary hover:bg-primary/90">
                Import Key
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
