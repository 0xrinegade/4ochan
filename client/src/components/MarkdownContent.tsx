import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Libertarian, monospace',
});

// Function to handle Typst code blocks
const processTypstBlock = (content: string, isDarkMode: boolean): JSX.Element => {
  const [showSource, setShowSource] = useState(false);
  
  return (
    <div className={`typst-container ${isDarkMode ? 'typst-dark' : 'typst-light'}`}>
      <div className="typst-header">
        <div className="typst-title">Typst Document</div>
        <div className="typst-action-buttons">
          <button 
            className="typst-action-button" 
            title="Copy Typst code" 
            onClick={() => navigator.clipboard.writeText(content)}
          >
            Copy
          </button>
          <button
            className="typst-action-button"
            title={showSource ? "Show Preview" : "Show Source"}
            onClick={() => setShowSource(!showSource)}
          >
            {showSource ? "Show Preview" : "Show Source"}
          </button>
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
      
      {showSource ? (
        <SyntaxHighlighter
          style={isDarkMode ? vscDarkPlus : vs}
          language="rust" // Use rust highlighting as a fallback since Typst syntax is not directly supported
          PreTag="div"
        >
          {content}
        </SyntaxHighlighter>
      ) : (
        <div className="typst-preview">
          <div className="typst-render">
            <div className="typst-heading">
              <h3>Typst Document Preview</h3>
              <p>This document has been formatted for better readability</p>
            </div>
            <div className="typst-content">
              {content.split('\n').map((line, index) => {
                // Process Typst syntax to add formatting
                let formattedLine = line;
                
                // Format headings (= Heading)
                if (line.trim().startsWith('= ')) {
                  return <h1 key={index} className="typst-heading-1">{line.trim().substring(2)}</h1>;
                }
                // Format subheadings (== Subheading)
                else if (line.trim().startsWith('== ')) {
                  return <h2 key={index} className="typst-heading-2">{line.trim().substring(3)}</h2>;
                }
                // Format subsubheadings (=== Subsubheading)
                else if (line.trim().startsWith('=== ')) {
                  return <h3 key={index} className="typst-heading-3">{line.trim().substring(4)}</h3>;
                }
                // Format bold (*bold*)
                else if (line.includes('*') && !line.trim().startsWith('- ')) {
                  formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
                }
                // Format italics (_italic_)
                if (line.includes('_')) {
                  formattedLine = formattedLine.replace(/_(.*?)_/g, '<em>$1</em>');
                }
                // Format code (`code`)
                if (line.includes('`')) {
                  formattedLine = formattedLine.replace(/`(.*?)`/g, '<code>$1</code>');
                }
                // Format lists
                if (line.trim().startsWith('- ')) {
                  return <li key={index} className="typst-list-item">{line.trim().substring(2)}</li>;
                }
                // Format block elements
                if (line.trim().startsWith('#')) {
                  return <div key={index} className="typst-block">{line}</div>;
                }
                
                // Return the regular line with formatting applied
                return (
                  <div key={index} className="typst-line" 
                       dangerouslySetInnerHTML={{__html: formattedLine}} />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component to render Mermaid diagrams
const MermaidDiagram: React.FC<{ chart: string, isDarkMode: boolean }> = ({ chart, isDarkMode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  
  useEffect(() => {
    // Initialize Mermaid with the correct theme
    mermaid.initialize({
      startOnLoad: true,
      theme: isDarkMode ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'Libertarian, monospace',
    });
    
    if (ref.current && !rendered) {
      try {
        // Clear the container first
        ref.current.innerHTML = '';
        
        // Generate a unique ID for this diagram
        const id = `mermaid-diagram-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        mermaid.render(id, chart).then(result => {
          if (ref.current) {
            ref.current.innerHTML = result.svg;
            setRendered(true);
            setError(null);
          }
        }).catch(err => {
          console.error('Mermaid rendering error:', err);
          setError(`Failed to render diagram: ${err.message}`);
        });
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        setError(`Failed to render diagram: ${err.message}`);
      }
    }
  }, [chart, isDarkMode, rendered]);
  
  return (
    <div className="mermaid-container">
      <div className="mermaid-header">
        <div className="mermaid-title">Mermaid Diagram</div>
        <div className="mermaid-action-buttons">
          <button 
            className="mermaid-action-button" 
            title="Copy Mermaid code" 
            onClick={() => navigator.clipboard.writeText(chart)}
          >
            Copy
          </button>
          <a 
            href={`https://mermaid.live/edit#${encodeURIComponent(chart)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mermaid-action-button"
          >
            Edit Live
          </a>
        </div>
      </div>
      {error ? (
        <div className="mermaid-error">
          <p>Error rendering Mermaid diagram:</p>
          <pre>{error}</pre>
          <SyntaxHighlighter
            style={isDarkMode ? vscDarkPlus : vs}
            language="mermaid"
            PreTag="div"
          >
            {chart}
          </SyntaxHighlighter>
        </div>
      ) : (
        <div ref={ref} className="mermaid-diagram" />
      )}
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
              
              // Special handling for different languages
              switch (language) {
                case 'typst':
                  return processTypstBlock(codeContent, isDarkMode);
                
                case 'mermaid':
                  return <MermaidDiagram chart={codeContent} isDarkMode={isDarkMode} />;
                
                default:
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