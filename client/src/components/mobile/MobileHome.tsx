import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useNostr } from '@/hooks/useNostr';
import { useBoards } from '@/hooks/useBoards';
import { navigateWithoutReload } from '@/App';
import { Board } from '@/types';
import {
  ArrowUpRight, Search, Clock, Layout, FileText, 
  Bell, MessageSquare, Users, Calendar, Bookmark
} from 'lucide-react';

const MobileHome: React.FC = () => {
  const { boards, loading: loadingBoards } = useBoards();
  const { connectedRelays, relays } = useNostr();
  const [location, setLocation] = useLocation();
  
  // Function to format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Navigate to a board
  const navigateToBoard = (boardId: string) => {
    navigateWithoutReload(`/board/${boardId}`);
  };
  
  return (
    <div className="mobile-home pb-20">
      {/* Stats Banner */}
      <div className="p-3 bg-muted/30 text-xs flex justify-between items-center">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-1 ${connectedRelays > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{connectedRelays}/{relays.length} relays</span>
        </div>
        <div>{formatNumber(boards.length)} boards</div>
      </div>
      
      {/* Search Bar */}
      <div className="p-3 pb-4">
        <button 
          className="w-full flex items-center gap-2 p-2 px-3 border rounded-md text-sm text-foreground/60 bg-muted/20"
          onClick={() => {
            // For now, just open the search dialog
            const searchBtn = document.querySelector('[title="Search the page"]') as HTMLButtonElement;
            if (searchBtn) searchBtn.click();
          }}
        >
          <Search size={16} />
          <span>Search threads and boards...</span>
        </button>
      </div>
      
      {/* Recent Activity */}
      <div className="px-3 mb-4">
        <h2 className="font-bold text-lg mb-2">Recent Activity</h2>
        <div className="space-y-2">
          <button
            className="w-full flex items-center justify-between p-3 rounded-md border hover:bg-muted/20 transition-colors"
            onClick={() => navigateWithoutReload('/board/b')}
          >
            <div className="flex items-center">
              <Clock size={18} className="mr-2 text-foreground/70" />
              <span>Recent threads</span>
            </div>
            <ArrowUpRight size={16} className="text-foreground/50" />
          </button>
          
          <button
            className="w-full flex items-center justify-between p-3 rounded-md border hover:bg-muted/20 transition-colors"
            onClick={() => navigateWithoutReload('/subscriptions')}
          >
            <div className="flex items-center">
              <Bell size={18} className="mr-2 text-foreground/70" />
              <span>Subscribed threads</span>
            </div>
            <ArrowUpRight size={16} className="text-foreground/50" />
          </button>
        </div>
      </div>
      
      {/* Popular Boards */}
      <div className="px-3 mb-4">
        <h2 className="font-bold text-lg mb-2">Popular Boards</h2>
        <div className="grid grid-cols-2 gap-2">
          {loadingBoards ? (
            // Loading state
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 border rounded-md animate-pulse bg-muted/30"></div>
            ))
          ) : boards.length === 0 ? (
            <div className="col-span-2 p-4 text-center text-foreground/60 border rounded-md">
              No boards available
            </div>
          ) : (
            // Display boards
            boards.slice(0, 6).map((board) => (
              <MobileBoardCard
                key={board.id}
                board={board}
                onClick={() => navigateToBoard(board.shortName || board.id)}
              />
            ))
          )}
        </div>
        {boards.length > 6 && (
          <button 
            className="w-full mt-2 p-2 text-sm text-center text-foreground/70 hover:bg-muted/20 rounded-md"
            onClick={() => {
              // Navigate to boards list or show all boards
              const boardsMenu = document.querySelector('[aria-label="Boards Menu"]') as HTMLButtonElement;
              if (boardsMenu) boardsMenu.click();
            }}
          >
            View all boards
          </button>
        )}
      </div>
      
      {/* Quick Links */}
      <div className="px-3 mb-4">
        <h2 className="font-bold text-lg mb-2">Quick Links</h2>
        <div className="grid grid-cols-4 gap-2">
          <QuickLinkButton 
            icon={<MessageSquare size={20} />} 
            label="Threads" 
            onClick={() => navigateWithoutReload('/board/b')}
          />
          <QuickLinkButton 
            icon={<Users size={20} />} 
            label="Users" 
            onClick={() => navigateWithoutReload('/users')}
          />
          <QuickLinkButton 
            icon={<Bookmark size={20} />} 
            label="Saved" 
            onClick={() => navigateWithoutReload('/subscriptions')}
          />
          <QuickLinkButton 
            icon={<FileText size={20} />} 
            label="FAQ" 
            onClick={() => navigateWithoutReload('/faq')}
          />
        </div>
      </div>
      
      {/* App Info */}
      <div className="p-4 text-center text-xs text-foreground/50">
        <p>4ochan.org | v1.0.0</p>
        <p className="mt-1">A decentralized, privacy-first communication platform</p>
      </div>
    </div>
  );
};

interface MobileBoardCardProps {
  board: Board;
  onClick: () => void;
}

const MobileBoardCard: React.FC<MobileBoardCardProps> = ({ board, onClick }) => {
  return (
    <button 
      className="h-24 border rounded-md overflow-hidden flex flex-col hover:bg-muted/20 transition-colors p-3"
      onClick={onClick}
    >
      <div className="font-bold text-sm">/{board.shortName || board.id}/</div>
      <div className="text-xs text-foreground/70 line-clamp-1 mb-1">{board.name}</div>
      <div className="mt-auto flex items-center justify-between text-xs text-foreground/60">
        <span>{board.threadCount || 0} threads</span>
        <ArrowUpRight size={14} />
      </div>
    </button>
  );
};

interface QuickLinkButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const QuickLinkButton: React.FC<QuickLinkButtonProps> = ({ icon, label, onClick }) => {
  return (
    <button 
      className="flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted/20 transition-colors"
      onClick={onClick}
    >
      <div className="mb-1 text-foreground/80">{icon}</div>
      <div className="text-xs">{label}</div>
    </button>
  );
};

export default MobileHome;