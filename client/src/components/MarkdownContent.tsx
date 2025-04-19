import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeMermaid from 'rehype-mermaid';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // GitHub Flavored Markdown support
        rehypePlugins={[
          [rehypeMermaid, { theme: 'default', className: 'mermaid-diagram' }]
        ]}
        components={{
          // Add custom styling for markdown elements
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-base font-bold mb-2" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4" {...props} />,
          a: ({ node, ...props }) => (
            <a 
              className="text-primary hover:underline" 
              target="_blank" 
              rel="noopener noreferrer"
              {...props} 
            />
          ),
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 py-1 italic my-4" {...props} />
          ),
          img: ({ node, ...props }) => (
            <img className="max-w-full h-auto my-4 rounded" {...props} alt={props.alt || 'Image'} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-black" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-primary text-white" {...props} />,
          th: ({ node, ...props }) => <th className="border border-black p-2" {...props} />,
          td: ({ node, ...props }) => <td className="border border-black p-2" {...props} />,
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return (
              <code className={match ? `language-${match[1]}` : ''} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};