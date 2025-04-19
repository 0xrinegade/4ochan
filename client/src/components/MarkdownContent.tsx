import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

// Function to handle Typst code blocks
const processTypstBlock = (content: string, isDarkMode: boolean): JSX.Element => {
  return (
    <div className={`typst-container ${isDarkMode ? 'typst-dark' : 'typst-light'}`}>
      <div className="typst-header">
        <div className="typst-title">Typst Document</div>
        <div className="typst-action-buttons">
          <button className="typst-action-button" title="Copy Typst code" onClick={() => {
            navigator.clipboard.writeText(content);
          }}>
            Copy
          </button>
          {/* This is a placeholder. In a future update, we could add a button to render/preview the Typst */}
          <a 
            href={`https://typst.app/project?snippet=${encodeURIComponent(content)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="typst-action-button"
            title="Open in Typst App"
          >
            Open in Typst
          </a>
        </div>
      </div>
      <SyntaxHighlighter
        style={isDarkMode ? vscDarkPlus : vs}
        language="rust" // Use rust highlighting as a fallback since Typst syntax is not directly supported
        PreTag="div"
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  // Create a state for tracking dark mode instead of reading DOM directly
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Set up an effect to check the theme when the component mounts
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme?.includes('dark') || false);
    };
    
    // Initial check
    checkTheme();
    
    // Set up an observer to watch for attribute changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    // Clean up observer on unmount
    return () => observer.disconnect();
  }, []);
  
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && (props as any).inline;
            
            // Handle different code block types
            if (!isInline && match) {
              const language = match[1];
              const codeContent = String(children).replace(/\n$/, '');
              
              // Special handling for Typst
              if (language === 'typst') {
                return processTypstBlock(codeContent, isDarkMode);
              }
              
              // Default syntax highlighting for other languages
              return (
                <SyntaxHighlighter
                  style={isDarkMode ? vscDarkPlus : vs}
                  language={language}
                  PreTag="div"
                >
                  {codeContent}
                </SyntaxHighlighter>
              );
            } 
            
            // Inline code
            return (
              <code className={className} {...props}>
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