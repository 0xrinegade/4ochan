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
  
  // Handle changing identity
  const handleChangeIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPrivKey) {
      return;
    }
    
    try {
      // Get public key from private key
      import("nostr-tools").then(({ getPublicKey }) => {
        const pubkey = getPublicKey(newPrivKey);
        
        updateIdentity({
          pubkey,
          privkey: newPrivKey,
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
  
  // Generate a new identity
  const handleGenerateNewIdentity = () => {
    import("nostr-tools").then(({ generatePrivateKey, getPublicKey }) => {
      const privkey = generatePrivateKey();
      const pubkey = getPublicKey(privkey);
      
      updateIdentity({
        pubkey,
        privkey,
        profile: { name: "Anonymous" }
      });
      
      setIsChangeIdentityModalOpen(false);
    });
  };
  
  return (
    <div className="w-full md:w-56 bg-white md:border-r border-gray-200">
      <div className="p-2 bg-primary text-white flex justify-between items-center">
        <h2 className="text-sm font-bold">Boards</h2>
        <Button 
          onClick={() => setIsCreateBoardModalOpen(true)} 
          className="text-xs bg-accent hover:bg-red-700 rounded px-2 py-1"
          size="sm"
        >
          <i className="fas fa-plus"></i> New
        </Button>
      </div>
      
      <div className="overflow-y-auto h-full max-h-[calc(100vh-12rem)]">
        <ul className="board-list">
          {boards.map(board => (
            <li 
              key={board.id}
              className={`
                board-list-item hover:bg-gray-100 px-4 py-2 cursor-pointer 
                border-b border-gray-100 flex items-center justify-between
                ${board.id === currentBoardId ? 'bg-primary text-white' : ''}
              `}
            >
              <Link href={`/board/${board.id}`}>
                <div className="flex items-center w-full">
                  <span className="text-sm">/{board.shortName}/</span>
                  <span className={`ml-2 text-xs ${board.id === currentBoardId ? 'text-gray-200' : 'text-gray-600'}`}>
                    {board.name}
                  </span>
                </div>
              </Link>
              <span className="text-xs text-secondary">{board.threadCount}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* User Identity Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">IDENTITY</span>
          <button 
            className="text-xs text-accent hover:text-red-700"
            onClick={() => setIsChangeIdentityModalOpen(true)}
          >
            <i className="fas fa-key"></i> Change
          </button>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            <i className="fas fa-user-secret"></i>
          </div>
          <div className="ml-2 overflow-hidden">
            <div className="text-sm font-medium truncate">
              {identity.profile?.name || "Anon"}
            </div>
            <div className="text-xs monaco truncate text-gray-500">
              {formatPubkey(identity.pubkey)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Board Modal */}
      <Dialog open={isCreateBoardModalOpen} onOpenChange={setIsCreateBoardModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBoard}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shortName" className="text-right">
                  Short Name
                </Label>
                <Input
                  id="shortName"
                  value={newBoardShortName}
                  onChange={(e) => setNewBoardShortName(e.target.value)}
                  placeholder="b, tech, art, etc."
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="A short description of the board's purpose..."
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Board</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Change Identity Modal */}
      <Dialog open={isChangeIdentityModalOpen} onOpenChange={setIsChangeIdentityModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Identity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangeIdentity}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="privateKey" className="text-right">
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
              <div className="text-xs text-gray-500 col-span-4 text-center">
                Import an existing key or generate a new one. 
                <br />
                Your key is stored locally and never sent to servers.
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleGenerateNewIdentity}>
                Generate New
              </Button>
              <Button type="submit" disabled={!newPrivKey}>
                Import Key
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
