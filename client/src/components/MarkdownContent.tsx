import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import { PostReference } from './PostReference';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

// TypeScript declaration for Vivliostyle
declare module '@vivliostyle/viewer';
import * as Vivliostyle from '@vivliostyle/viewer';

// TypstVivliostyleViewer component
interface TypstVivliostyleViewerProps {
  content: string;
  isDarkMode: boolean;
}

const TypstVivliostyleViewer: React.FC<TypstVivliostyleViewerProps> = ({ content, isDarkMode }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!viewerRef.current) return;
    
    setIsLoading(true);
    
    try {
      // Convert Typst to HTML structure
      const typstHtml = convertTypstToHTML(content);
      
      // Create a blob URL for the HTML content
      const blob = new Blob([typstHtml], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Set up Vivliostyle viewer
      const viewerOptions = {
        viewportElement: viewerRef.current,
        userStylesheet: [
          {
            text: generateTypstStyles(isDarkMode),
            type: 'text/css'
          }
        ]
      };
      
      // Initialize the viewer with the typst content
      setTimeout(() => {
        try {
          // Clear any previous content
          if (viewerRef.current) {
            viewerRef.current.innerHTML = '';
            
            // Create an iframe for the Vivliostyle viewer
            const iframe = document.createElement('iframe');
            iframe.className = 'typst-vivliostyle-frame';
            iframe.src = blobUrl;
            iframe.title = 'Typst Document Preview';
            iframe.onload = () => {
              setIsLoading(false);
            };
            
            viewerRef.current.appendChild(iframe);
          }
        } catch (err: any) {
          console.error('Error initializing Vivliostyle:', err);
          setError(err.message || 'Failed to initialize document viewer');
          setIsLoading(false);
        }
      }, 100);
      
      return () => {
        URL.revokeObjectURL(blobUrl);
      };
      
    } catch (err: any) {
      console.error('Error in Vivliostyle Typst renderer:', err);
      setError(err.message || 'Failed to render document');
      setIsLoading(false);
    }
  }, [content, isDarkMode]);
  
  // Convert Typst syntax to simplified HTML
  const convertTypstToHTML = (typstContent: string): string => {
    const lines = typstContent.split('\n');
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Typst Document</title>
        <style>
          body { 
            font-family: 'Libertarian', serif;
            margin: 0;
            padding: 20px;
            line-height: 1.5;
            color: ${isDarkMode ? '#ddd' : '#333'};
            background-color: ${isDarkMode ? '#1a1a1a' : '#fff'};
          }
          .title { 
            text-align: center;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: bold;
          }
          .author {
            text-align: center;
            font-style: italic;
            margin-bottom: 30px;
          }
          h1, h2, h3 { 
            color: ${isDarkMode ? '#fff' : '#000'};
          }
          code {
            background-color: ${isDarkMode ? '#333' : '#f5f5f5'};
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
          }
          pre {
            background-color: ${isDarkMode ? '#333' : '#f5f5f5'};
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
          }
          .math {
            font-style: italic;
            font-family: 'Times New Roman', serif;
          }
          .figure {
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            border: 1px solid ${isDarkMode ? '#444' : '#ddd'};
          }
          .equation-block {
            text-align: center;
            margin: 15px 0;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="typst-document">
    `;
    
    // Parse for title and author
    let title = "Untitled Document";
    let author = "";
    let hasTitle = false;
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      
      // Look for #set document(title: "Title")
      if (line.includes('#set document') && line.includes('title:')) {
        const titleMatch = line.match(/title:\s*"([^"]+)"/);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1];
          hasTitle = true;
        }
      }
      
      // Look for #set document(author: "Author")
      if (line.includes('#set document') && line.includes('author:')) {
        const authorMatch = line.match(/author:\s*"([^"]+)"/);
        if (authorMatch && authorMatch[1]) {
          author = authorMatch[1];
        }
      }
      
      // Alternative: = Title
      if (!hasTitle && line.trim().startsWith('= ')) {
        title = line.trim().substring(2);
        hasTitle = true;
      }
    }
    
    html += `<div class="title">${title}</div>`;
    if (author) {
      html += `<div class="author">by ${author}</div>`;
    }
    
    let inCodeBlock = false;
    let codeContent = '';
    let inListBlock = false;
    
    for (const line of lines) {
      // Skip document setting lines
      if (line.trim().startsWith('#set')) {
        continue;
      }
      
      // Handle code blocks
      if (line.trim().startsWith('#raw(') || line.trim() === '```') {
        if (!inCodeBlock) {
          inCodeBlock = true;
          html += '<pre><code>';
          continue;
        } else {
          inCodeBlock = false;
          html += `${escapeHtml(codeContent)}</code></pre>`;
          codeContent = '';
          continue;
        }
      }
      
      if (inCodeBlock) {
        codeContent += line + '\n';
        continue;
      }
      
      // Headings
      if (line.trim().startsWith('= ')) {
        html += `<h1>${escapeHtml(line.trim().substring(2))}</h1>`;
        continue;
      }
      
      if (line.trim().startsWith('== ')) {
        html += `<h2>${escapeHtml(line.trim().substring(3))}</h2>`;
        continue;
      }
      
      if (line.trim().startsWith('=== ')) {
        html += `<h3>${escapeHtml(line.trim().substring(4))}</h3>`;
        continue;
      }
      
      // Lists
      if (line.trim().startsWith('- ')) {
        if (!inListBlock) {
          inListBlock = true;
          html += '<ul>';
        }
        const listContent = formatInlineMarkup(line.trim().substring(2));
        html += `<li>${listContent}</li>`;
        continue;
      } else if (inListBlock) {
        inListBlock = false;
        html += '</ul>';
      }
      
      // Block elements like figures, equations, etc.
      if (line.trim().startsWith('#')) {
        const blockMatch = line.match(/#([a-zA-Z]+)(\(.*?\))?\s*{?(.*)?$/);
        if (blockMatch) {
          const blockType = blockMatch[1];
          const blockContent = blockMatch[3] || '';
          
          switch(blockType) {
            case 'figure':
              html += `<div class="figure">${formatInlineMarkup(blockContent)}<div class="caption">Figure</div></div>`;
              break;
            case 'equation':
              html += `<div class="equation-block">${formatInlineMarkup(blockContent)}</div>`;
              break;
            default:
              html += `<div class="block block-${blockType}">${formatInlineMarkup(blockContent)}</div>`;
          }
          continue;
        }
      }
      
      // Regular paragraph
      if (line.trim() !== '') {
        html += `<p>${formatInlineMarkup(line)}</p>`;
      } else {
        html += '<div class="spacer"></div>';
      }
    }
    
    // Close any open list
    if (inListBlock) {
      html += '</ul>';
    }
    
    html += `
        </div>
      </body>
      </html>
    `;
    
    return html;
  };
  
  // Format inline markup (bold, italic, etc.)
  const formatInlineMarkup = (text: string): string => {
    let result = escapeHtml(text);
    
    // Bold: *text*
    result = result.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    
    // Italic: _text_
    result = result.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Code: `code`
    result = result.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Math: $x = y$
    result = result.replace(/\$(.*?)\$/g, '<span class="math">$1</span>');
    
    return result;
  };
  
  // Escape HTML special characters
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  // Generate CSS for the Typst document
  const generateTypstStyles = (isDarkMode: boolean): string => {
    return `
      @font-face {
        font-family: 'Libertarian';
        src: url('/fonts/Libertarian.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      body {
        background-color: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
        color: ${isDarkMode ? '#ddd' : '#333'};
      }
      
      .typst-document {
        font-family: 'Libertarian', serif;
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      
      h1, h2, h3 {
        color: ${isDarkMode ? '#fff' : '#000'};
      }
      
      code {
        font-family: monospace;
        background-color: ${isDarkMode ? '#333' : '#f5f5f5'};
        color: ${isDarkMode ? '#ff7b72' : '#d63384'};
      }
      
      ul {
        padding-left: 20px;
      }
      
      .block {
        margin: 15px 0;
        padding: 10px;
        border-left: 3px solid ${isDarkMode ? '#555' : '#333'};
        background-color: ${isDarkMode ? '#2a2a2a' : '#f8f8f8'};
      }
    `;
  };
  
  return (
    <div className="typst-vivliostyle-container">
      {isLoading && (
        <div className="typst-loading">
          <div className="typst-loading-spinner"></div>
          <p>Preparing document...</p>
        </div>
      )}
      
      {error && (
        <div className="typst-error">
          <p>Error rendering document:</p>
          <pre>{error}</pre>
        </div>
      )}
      
      <div 
        ref={viewerRef} 
        className={`typst-vivliostyle-viewer ${isLoading ? 'loading' : ''}`}
        style={{ height: '500px', width: '100%' }}
      ></div>
    </div>
  );
};

interface MarkdownContentProps {
  content: string;
  className?: string;
  threadId?: string;
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Libertarian, monospace',
});

// Helper functions for Typst parsing
const parseTypstMarkup = (content: string): string => {
  // Process inline formatting
  let result = content;
  // Bold: *text*
  result = result.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  // Italic: _text_
  result = result.replace(/_(.*?)_/g, '<em>$1</em>');
  // Code: `code`
  result = result.replace(/`(.*?)`/g, '<code>$1</code>');
  // Math: $x = y$
  result = result.replace(/\$(.*?)\$/g, '<span class="typst-math">$1</span>');
  
  return result;
};

// Function to handle Typst code blocks
const processTypstBlock = (content: string, isDarkMode: boolean): JSX.Element => {
  const [showSource, setShowSource] = useState(false);
  
  // Process the content to extract title, author, etc.
  const lines = content.split('\n');
  let title = "Untitled Document";
  let author = "";
  let hasTitle = false;
  
  // Try to extract document metadata
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    
    // Look for #set document(title: "Title")
    if (line.includes('#set document') && line.includes('title:')) {
      const titleMatch = line.match(/title:\s*"([^"]+)"/);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1];
        hasTitle = true;
      }
    }
    
    // Look for #set document(author: "Author")
    if (line.includes('#set document') && line.includes('author:')) {
      const authorMatch = line.match(/author:\s*"([^"]+)"/);
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1];
      }
    }
    
    // Alternative: = Title
    if (!hasTitle && line.trim().startsWith('= ')) {
      title = line.trim().substring(2);
      hasTitle = true;
    }
  }
  
  // Process the content for rendering
  const processContent = () => {
    let inListBlock = false;
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLanguage = '';
    
    return (
      <div className="typst-document">
        {hasTitle && <h1 className="typst-document-title">{title}</h1>}
        {author && <p className="typst-document-author">by {author}</p>}
        
        <div className="typst-document-content">
          {lines.map((line, index) => {
            // Handle code blocks
            if (line.trim().startsWith('#raw(') || line.trim() === '```') {
              inCodeBlock = !inCodeBlock;
              if (inCodeBlock) {
                // Extract language if specified
                const langMatch = line.match(/#raw\("([^"]+)"/);
                codeBlockLanguage = langMatch ? langMatch[1] : '';
                codeBlockContent = '';
                return null;
              } else {
                // End of code block
                const result = (
                  <div key={`code-${index}`} className="typst-code-block">
                    <pre className="typst-code">
                      <code className={codeBlockLanguage ? `language-${codeBlockLanguage}` : ''}>
                        {codeBlockContent}
                      </code>
                    </pre>
                  </div>
                );
                codeBlockContent = '';
                return result;
              }
            }
            
            if (inCodeBlock) {
              codeBlockContent += line + '\n';
              return null;
            }
            
            // Process normal lines
            
            // Headings
            if (line.trim().startsWith('= ')) {
              return <h1 key={index} className="typst-heading-1">{line.trim().substring(2)}</h1>;
            }
            
            if (line.trim().startsWith('== ')) {
              return <h2 key={index} className="typst-heading-2">{line.trim().substring(3)}</h2>;
            }
            
            if (line.trim().startsWith('=== ')) {
              return <h3 key={index} className="typst-heading-3">{line.trim().substring(4)}</h3>;
            }
            
            // Lists
            if (line.trim().startsWith('- ')) {
              if (!inListBlock) {
                inListBlock = true;
                return (
                  <ul key={`list-${index}`} className="typst-list">
                    <li className="typst-list-item" dangerouslySetInnerHTML={{
                      __html: parseTypstMarkup(line.trim().substring(2))
                    }} />
                  </ul>
                );
              } else {
                return (
                  <li key={index} className="typst-list-item" dangerouslySetInnerHTML={{
                    __html: parseTypstMarkup(line.trim().substring(2))
                  }} />
                );
              }
            } else if (inListBlock) {
              inListBlock = false;
            }
            
            // Block elements
            if (line.trim().startsWith('#')) {
              const blockMatch = line.match(/#([a-zA-Z]+)(\(.*?\))?\s*{?(.*)?$/);
              if (blockMatch) {
                const blockType = blockMatch[1];
                const blockContent = blockMatch[3] || '';
                
                switch(blockType) {
                  case 'figure':
                    return (
                      <figure key={index} className="typst-figure">
                        <div className="typst-figure-content">{blockContent}</div>
                        <figcaption className="typst-figure-caption">Figure</figcaption>
                      </figure>
                    );
                  case 'table':
                    return (
                      <div key={index} className="typst-table-container">
                        <div className="typst-table-placeholder">
                          [Table: {blockContent}]
                        </div>
                      </div>
                    );
                  case 'box':
                  case 'block':
                    return (
                      <div key={index} className="typst-box">
                        <div className="typst-box-content" dangerouslySetInnerHTML={{
                          __html: parseTypstMarkup(blockContent)
                        }} />
                      </div>
                    );
                  default:
                    return (
                      <div key={index} className="typst-block typst-block-generic">
                        <div className="typst-block-type">#{blockType}</div>
                        <div className="typst-block-content">{blockContent}</div>
                      </div>
                    );
                }
              }
            }
            
            // Paragraph with formatting
            if (line.trim() !== '') {
              return (
                <p key={index} className="typst-paragraph" dangerouslySetInnerHTML={{
                  __html: parseTypstMarkup(line)
                }} />
              );
            }
            
            // Empty line
            return <div key={index} className="typst-empty-line"></div>;
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className={`typst-container ${isDarkMode ? 'typst-dark' : 'typst-light'}`}>
      <div className="typst-header">
        <div className="typst-title text-primary-foreground">Typst Document</div>
        <div className="typst-action-buttons">
          <button 
            className="typst-action-button text-primary-foreground" 
            title="Copy Typst code" 
            onClick={() => navigator.clipboard.writeText(content)}
          >
            Copy
          </button>
          <button
            className="typst-action-button text-primary-foreground"
            title={showSource ? "Show Preview" : "Show Source"}
            onClick={() => setShowSource(!showSource)}
          >
            {showSource ? "Show Preview" : "Show Source"}
          </button>
          <a 
            href={`https://typst.app/project?snippet=${encodeURIComponent(content)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="typst-action-button text-primary-foreground"
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
              <h3 className="text-primary-foreground">Document Preview</h3>
              <p className="text-secondary-foreground">Formatted with Vivliostyle</p>
            </div>
            <div className="typst-content">
              <TypstVivliostyleViewer content={content} isDarkMode={isDarkMode} />
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
        <div className="mermaid-title text-primary-foreground">Mermaid Diagram</div>
        <div className="mermaid-action-buttons">
          <button 
            className="mermaid-action-button text-primary-foreground" 
            title="Copy Mermaid code" 
            onClick={() => navigator.clipboard.writeText(chart)}
          >
            Copy
          </button>
          <a 
            href={`https://mermaid.live/edit#${encodeURIComponent(chart)}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mermaid-action-button text-primary-foreground"
          >
            Edit Live
          </a>
        </div>
      </div>
      {error ? (
        <div className="mermaid-error">
          <p className="text-destructive-foreground">Error rendering Mermaid diagram:</p>
          <pre className="text-destructive-foreground">{error}</pre>
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

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '', threadId }) => {
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
  
  // Process post references in the content (>>postID format)
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    
    // Replace >>postID with a special marker that ReactMarkdown won't mess with
    return content.replace(/>>([\w-]+)/g, (match, postId) => {
      return `[${match}](#__POSTREFERENCE__${postId}__)`;
    });
  }, [content]);
  
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Handle special link format for post references
          a({ node, href, children, ...props }) {
            // Check if this is a post reference link
            const refMatch = href?.match(/#__POSTREFERENCE__([\w-]+)__/);
            
            if (refMatch && refMatch[1] && threadId) {
              const postId = refMatch[1];
              return (
                <PostReference postId={postId} threadId={threadId} />
              );
            }
            
            // Regular link
            return <a href={href} {...props}>{children}</a>;
          },
          
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
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};