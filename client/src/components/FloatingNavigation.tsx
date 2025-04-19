import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/**
 * Fixed navigation buttons that are always visible on screen
 * regardless of scroll position or page content
 */
export const FloatingNavigation: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{id: string; text: string}[]>([]);
  const [currentSearchResult, setCurrentSearchResult] = useState(0);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };

  const performSearch = () => {
    if (!searchQuery.trim()) return;

    // This is a global search across the whole document
    const posts = document.querySelectorAll('.post');
    const results: {id: string; text: string}[] = [];

    posts.forEach(post => {
      const content = post.textContent?.toLowerCase() || '';
      const postId = post.getAttribute('data-post-id') || post.id;
      
      if (content.includes(searchQuery.toLowerCase())) {
        // Extract a snippet of text around the match
        const start = Math.max(0, content.indexOf(searchQuery.toLowerCase()) - 20);
        const end = Math.min(content.length, content.indexOf(searchQuery.toLowerCase()) + searchQuery.length + 20);
        const snippet = content.substring(start, end);
        
        results.push({
          id: postId,
          text: '...' + snippet + '...'
        });
      }
    });

    setSearchResults(results);
    setCurrentSearchResult(0);
    
    if (results.length > 0) {
      scrollToResult(results[0].id);
    }
  };

  const scrollToResult = (id: string) => {
    const element = document.getElementById(id) || document.querySelector(`[data-post-id='${id}']`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight the element temporarily
      element.classList.add('highlight-post');
      setTimeout(() => {
        element.classList.remove('highlight-post');
      }, 2000);
    }
  };

  const nextSearchResult = () => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentSearchResult + 1) % searchResults.length;
    setCurrentSearchResult(nextIndex);
    scrollToResult(searchResults[nextIndex].id);
  };

  const prevSearchResult = () => {
    if (searchResults.length === 0) return;
    
    const prevIndex = (currentSearchResult - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchResult(prevIndex);
    scrollToResult(searchResults[prevIndex].id);
  };

  return (
    <div 
         style={{ 
           position: 'fixed', 
           right: '24px', 
           bottom: '96px',
           zIndex: 9999,
           pointerEvents: 'auto',
           display: 'flex',
           flexDirection: 'column',
           gap: '16px',
           isolation: 'isolate', // Ensures the container is rendered on its own stacking context
           filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' // Add a drop shadow for visibility
         }}>
      
      {/* Bottom scroll button */}
      <Button
        onClick={scrollToBottom}
        className="w-12 h-12 p-0 flex items-center justify-center bg-primary text-primary-foreground rounded-full border-2 border-black shadow-lg hover:bg-primary/90"
        variant="default"
        title="Scroll to bottom"
      >
        <ArrowDown size={24} />
      </Button>
      
      {/* Top scroll button */}
      <Button
        onClick={scrollToTop}
        className="w-12 h-12 p-0 flex items-center justify-center bg-primary text-primary-foreground rounded-full border-2 border-black shadow-lg hover:bg-primary/90"
        variant="default"
        title="Scroll to top"
      >
        <ArrowUp size={24} />
      </Button>

      {/* Search Button and Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogTrigger asChild>
          <Button 
            className="w-12 h-12 p-0 flex items-center justify-center bg-primary text-primary-foreground rounded-full border-2 border-black shadow-lg hover:bg-primary/90"
            variant="default"
            title="Search the page"
          >
            <Search size={24} />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Enter text to search on this page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Input
                placeholder="Enter search term..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    performSearch();
                  }
                }}
              />
            </div>
            <Button onClick={performSearch} type="submit" size="sm">
              Search
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">
                  {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={prevSearchResult}
                    disabled={searchResults.length <= 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={nextSearchResult}
                    disabled={searchResults.length <= 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div 
                    key={`${result.id}-${index}`}
                    className={`p-2 text-sm border rounded cursor-pointer hover:bg-accent/10 ${
                      index === currentSearchResult ? 'border-accent bg-accent/5' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      setCurrentSearchResult(index);
                      scrollToResult(result.id);
                    }}
                  >
                    <div className="font-medium mb-1">
                      Post #{result.id.substring(0, 6)}
                    </div>
                    <div>
                      {result.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearchOpen(false);
                setSearchResults([]);
                setSearchQuery('');
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FloatingNavigation;