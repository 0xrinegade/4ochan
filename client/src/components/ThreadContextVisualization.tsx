import React, { useState, useEffect } from 'react';
import { Post, Thread, NostrEvent } from '@/types';
import { useNostr } from '@/context/NostrContext';
import { ArrowDown, ArrowRight, MessageSquare, Reply, CornerUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useThread } from '@/hooks/useThreads';

interface ThreadContextVisualizationProps {
  threadId: string;
  highlightedPostId?: string;
}

export const ThreadContextVisualization: React.FC<ThreadContextVisualizationProps> = ({ 
  threadId, 
  highlightedPostId 
}) => {
  const { thread: threadData, posts: threadPosts } = useThread(threadId);
  const [thread, setThread] = useState<Thread | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (threadId && threadData) {
      setThread(threadData);
      
      // Auto-expand the highlighted post's context
      if (highlightedPostId && threadPosts) {
        // Find the highlighted post's parent chain
        const expandParentChain = (postId: string, parentMap: Record<string, boolean> = {}) => {
          const post = threadPosts.find((p: Post) => p.id === postId);
          if (post && post.replyToId) {
            parentMap[post.replyToId] = true;
            expandParentChain(post.replyToId, parentMap);
          }
          return parentMap;
        };
        
        const expandedMap = expandParentChain(highlightedPostId);
        setExpanded(expandedMap);
      }
    }
  }, [threadId, highlightedPostId, threadData, threadPosts]);

  if (!thread || !threadPosts) {
    return <div className="p-4 text-center">Loading thread visualization...</div>;
  }

  // Build the reply tree structure
  const buildReplyTree = () => {
    // Create a map of posts by id for quick access
    const postsById: Record<string, Post> = {};
    threadPosts.forEach((post: Post) => {
      postsById[post.id] = post;
    });
    
    // Create a map of child posts
    const childrenMap: Record<string, Post[]> = {};
    
    // Initialize the root posts array (posts that reply directly to the thread)
    const rootPosts: Post[] = [];
    
    // Organize posts into the tree structure
    threadPosts.forEach((post: Post) => {
      // If the post replies to another post in the thread
      if (post.replyToId && postsById[post.replyToId]) {
        if (!childrenMap[post.replyToId]) {
          childrenMap[post.replyToId] = [];
        }
        childrenMap[post.replyToId].push(post);
      } 
      // If the post replies to the thread event itself or has no replyToId
      else if (post.replyToId === thread.id || !post.replyToId) {
        rootPosts.push(post);
      }
    });
    
    // Sort posts by timestamp
    const sortByTimestamp = (a: Post, b: Post) => a.createdAt - b.createdAt;
    rootPosts.sort(sortByTimestamp);
    
    Object.keys(childrenMap).forEach(parentId => {
      childrenMap[parentId].sort(sortByTimestamp);
    });
    
    return { rootPosts, childrenMap };
  };

  const { rootPosts, childrenMap } = buildReplyTree();

  // Recursive component to render the post and its replies
  const renderPostNode = (post: Post, depth = 0, isLastChild = true, parentChain: string[] = []) => {
    const hasChildren = childrenMap[post.id] && childrenMap[post.id].length > 0;
    const isHighlighted = post.id === highlightedPostId;
    const isExpanded = expanded[post.id];
    
    // Create a unique chain ID for this branch
    const nodeChain = [...parentChain, post.id];
    const nodeChainId = nodeChain.join('-');
    
    return (
      <div key={post.id} className="relative">
        <div className={`flex items-start mb-1 ${isHighlighted ? 'bg-amber-100' : ''}`}>
          {/* Connection lines for tree view */}
          {depth > 0 && (
            <div className="flex items-center">
              {parentChain.map((parentId, index) => (
                <div 
                  key={`line-${parentId}-${index}`}
                  className={`border-l-2 border-gray-300 h-full absolute ${index * 20}px`}
                  style={{ left: `${index * 20 + 10}px`, height: '100%', top: '0' }}
                ></div>
              ))}
              <div 
                className="border-l-2 border-b-2 border-gray-300 absolute"
                style={{ 
                  left: `${(depth - 1) * 20 + 10}px`, 
                  width: '10px', 
                  height: '50%', 
                  top: '0', 
                  borderBottomLeftRadius: '5px'
                }}
              ></div>
            </div>
          )}
          
          {/* Indentation for tree levels */}
          <div style={{ marginLeft: `${depth * 20}px` }} className="flex-1">
            {/* Post node with toggle button */}
            <div className={`p-2 border ${isHighlighted ? 'border-amber-500' : 'border-gray-300'} bg-white flex items-start gap-2`}>
              {hasChildren && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => setExpanded(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                >
                  {isExpanded ? <ArrowDown className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </Button>
              )}
              {!hasChildren && <div className="w-6"></div>}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500">#{post.id.substring(0, 8)}</span>
                  <span className="font-bold">{post.authorPubkey.substring(0, 8)}</span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(post.createdAt * 1000, { addSuffix: true })}
                  </span>
                  {post.replyToId && (
                    <Badge variant="outline" className="text-xs">
                      <Reply className="h-3 w-3 mr-1" />
                      Reply to #{post.replyToId.substring(0, 6)}
                    </Badge>
                  )}
                </div>
                <div className="text-sm mt-1 line-clamp-2">
                  {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="ml-6">
            {childrenMap[post.id].map((childPost, index, arr) => 
              renderPostNode(
                childPost, 
                depth + 1, 
                index === arr.length - 1,
                nodeChain.slice(0, depth + 1)
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-100 border border-black p-4 my-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Thread Context Visualization
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>
      
      {rootPosts.length === 0 ? (
        <div className="text-center p-4 border border-dashed">
          No posts in this thread yet
        </div>
      ) : (
        <div className="thread-tree">
          {rootPosts.map((post, index, arr) => 
            renderPostNode(post, 0, index === arr.length - 1)
          )}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-4 flex justify-between">
        <span>Total posts: {threadPosts?.length || 0}</span>
        <span>Root posts: {rootPosts.length}</span>
      </div>
    </div>
  );
};

export default ThreadContextVisualization;