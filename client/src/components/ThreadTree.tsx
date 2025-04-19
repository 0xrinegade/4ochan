import React from 'react';
import { Post } from '@/types';
import { truncate } from '@/lib/utils';

interface ThreadTreeProps {
  posts: Post[];
  threadId: string;
  selectedPostId: string | null;
  onSelectPost: (postId: string) => void;
}

interface TreeNode {
  post: Post;
  children: TreeNode[];
}

export const ThreadTree: React.FC<ThreadTreeProps> = ({ 
  posts, 
  threadId, 
  selectedPostId,
  onSelectPost
}) => {
  // Build the tree structure
  const buildTree = () => {
    // Create a map of posts by their ID
    const postsMap = new Map<string, Post>();
    posts.forEach(post => {
      postsMap.set(post.id, post);
    });
    
    // Create a map to track parent-child relationships
    const childrenMap = new Map<string, string[]>();
    
    // Initialize with the thread ID as the root
    childrenMap.set(threadId, []);
    
    // Map each post to its parent based on references
    posts.forEach(post => {
      const parentId = post.replyToId || threadId;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      const children = childrenMap.get(parentId) || [];
      children.push(post.id);
      childrenMap.set(parentId, children);
    });
    
    // Function to recursively build the tree
    const buildNode = (nodeId: string): TreeNode[] => {
      const childIds = childrenMap.get(nodeId) || [];
      return childIds.map(childId => {
        const post = postsMap.get(childId);
        if (!post) return null;
        
        return {
          post,
          children: buildNode(childId)
        };
      }).filter(Boolean) as TreeNode[];
    };
    
    // Build the tree starting from the thread ID
    return buildNode(threadId);
  };
  
  // Render a tree node
  const renderNode = (node: TreeNode, level: number = 0) => {
    const isSelected = node.post.id === selectedPostId;
    
    return (
      <div key={node.post.id} className="tree-node">
        <div 
          className={`tree-node-content ${isSelected ? 'selected' : ''}`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => onSelectPost(node.post.id)}
        >
          <div className="tree-line"></div>
          <div className="tree-node-label">
            <span className="post-num">#{node.post.id.substring(0, 6)}</span>
            <span className="post-preview">
              {node.post.content.length > 30 
                ? node.post.content.substring(0, 30) + '...' 
                : node.post.content}
            </span>
          </div>
        </div>
        
        {node.children.length > 0 && (
          <div className="tree-children">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  const tree = buildTree();
  
  return (
    <div className="thread-tree">
      <h3 className="text-sm font-bold mb-4 uppercase text-gray-600">Reply Structure</h3>
      <div className="tree-container">
        {tree.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            No replies yet.
          </div>
        ) : (
          <div className="tree-nodes">
            {tree.map(node => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  );
};