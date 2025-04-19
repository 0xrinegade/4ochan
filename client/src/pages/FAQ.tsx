import React from 'react';
import { Link, useLocation } from 'wouter';
import { Header } from '../components/Header';

const FAQ: React.FC = () => {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <Header />
        <main className="container mx-auto px-4 py-4">
          {/* FAQ Header */}
          <div className="mb-6">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> FREQUENTLY ASKED QUESTIONS
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h1 className="text-2xl font-bold mb-2">4ochan.org FAQ</h1>
              <p className="text-sm">
                Welcome to 4ochan.org - a decentralized imageboard built on the Nostr protocol. 
                This FAQ will help you understand how to use our platform and get the most out of its features.
              </p>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="mb-6">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> TABLE OF CONTENTS
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <ul className="list-disc pl-5 text-sm">
                <li><a href="#basics" className="text-primary underline">Basics and Navigation</a></li>
                <li><a href="#boards" className="text-primary underline">Boards and Threads</a></li>
                <li><a href="#posting" className="text-primary underline">Posting and Replying</a></li>
                <li><a href="#features" className="text-primary underline">Advanced Features</a></li>
                <li><a href="#markdown" className="text-primary underline">Markdown, Code, and Diagrams</a></li>
                <li><a href="#images" className="text-primary underline">Image Uploads and Pasting</a></li>
                <li><a href="#nostr" className="text-primary underline">Nostr Integration</a></li>
                <li><a href="#crypto" className="text-primary underline">Cryptocurrency Features</a></li>
                <li><a href="#threads" className="text-primary underline">Thread Visualization</a></li>
                <li><a href="#drawing" className="text-primary underline">Drawing Tool</a></li>
              </ul>
            </div>
          </div>

          {/* Basics and Navigation */}
          <div className="mb-6" id="basics">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> BASICS AND NAVIGATION
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h2 className="text-lg font-bold mb-3">How to Navigate 4ochan.org</h2>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: What is 4ochan.org?</h3>
                <p className="text-sm mt-1">
                  A: 4ochan.org is a decentralized imageboard built on the Nostr protocol. Unlike traditional websites, all content on 
                  4ochan is stored on the Nostr network through relays, not on centralized servers. This means the platform is censorship-resistant and user-controlled.
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: How do I navigate between boards?</h3>
                <p className="text-sm mt-1">
                  A: You can navigate between boards using the navigation bar at the top of the page. Click on a board name (like /b/, /tech/, /art/, etc.) 
                  to visit that board. On mobile, tap the hamburger menu icon to see all available boards.
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: What are relays and why do I see "Connected: X" at the top?</h3>
                <p className="text-sm mt-1">
                  A: Relays are servers that store and distribute Nostr content. The platform needs to connect to relays to fetch and post content. 
                  The "Connected: X" indicator shows how many relays you're currently connected to. More connections generally means better performance and content availability.
                </p>
                <p className="text-sm mt-1">
                  <strong>Example:</strong> If you see "Connected: 3/5", it means you're connected to 3 out of 5 configured relays.
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-bold">Q: The site looks like it's from the 90s. Is that intentional?</h3>
                <p className="text-sm mt-1">
                  A: Yes! 4ochan.org intentionally uses a retro design aesthetic inspired by early internet imageboards and websites. 
                  This includes square corners, pixel-perfect borders, and that classic beige background you know and love.
                </p>
              </div>
            </div>
          </div>

          {/* Boards and Threads */}
          <div className="mb-6" id="boards">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> BOARDS AND THREADS
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h2 className="text-lg font-bold mb-3">Understanding Boards and Threads</h2>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: What are boards?</h3>
                <p className="text-sm mt-1">
                  A: Boards are topic-specific sections of the site. Each board is dedicated to a particular subject, like Technology (/tech/), 
                  Random (/b/), Art (/art/), and others. Boards contain multiple threads on related topics.
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: How do threads work?</h3>
                <p className="text-sm mt-1">
                  A: Threads are conversations started by a user on a specific topic. Each thread begins with an initial post 
                  (sometimes with images) and other users can reply to it, creating a conversation. Active threads with new replies 
                  rise to the top in what we call a "king of the hill" system.
                </p>
                <p className="text-sm mt-1">
                  <strong>Example:</strong> If someone posts "What's your favorite programming language?" in the /tech/ board, others can reply with their answers,
                  creating a thread about programming languages.
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-bold">Q: What is the "Thread Popularity Heatmap"?</h3>
                <p className="text-sm mt-1">
                  A: The Thread Popularity Heatmap visually shows which threads are currently most active. 
                  Brighter colors indicate threads with more recent activity and engagement. It's a great way to find 
                  interesting conversations that are happening right now.
                </p>
              </div>
            </div>
          </div>

          {/* Posting and Replying */}
          <div className="mb-6" id="posting">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> POSTING AND REPLYING
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h2 className="text-lg font-bold mb-3">How to Post and Reply</h2>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: How do I create a new thread?</h3>
                <p className="text-sm mt-1">
                  A: To create a new thread:
                </p>
                <ol className="list-decimal pl-5 text-sm mt-1">
                  <li>Click the "CREATE NEW THREAD" button on the home page or within a board</li>
                  <li>Enter a title for your thread</li>
                  <li>Type your post content in the text box</li>
                  <li>Optionally add images by clicking "Upload Image" or pasting directly</li>
                  <li>Click "Post Thread" to publish</li>
                </ol>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: How do I reply to a thread?</h3>
                <p className="text-sm mt-1">
                  A: To reply to a thread:
                </p>
                <ol className="list-decimal pl-5 text-sm mt-1">
                  <li>Open the thread you want to reply to</li>
                  <li>Scroll to the reply form at the bottom</li>
                  <li>Type your reply in the text box</li>
                  <li>Optionally add images</li>
                  <li>Click "Post Reply" to publish your response</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-md font-bold">Q: How do I quote or reply to a specific post?</h3>
                <p className="text-sm mt-1">
                  A: To quote a specific post, click the "Reply" link on that post. This will automatically insert a reference to that post in your reply. 
                  You can also manually quote by typing "&gt;" followed by the text you want to quote.
                </p>
                <p className="text-sm mt-1">
                  <strong>Example:</strong> To quote someone who said "I love TypeScript", you would type:
                </p>
                <div className="bg-gray-100 p-2 text-sm font-mono mt-1">
                  &gt;I love TypeScript<br/>
                  I agree, static typing is great!
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Features */}
          <div className="mb-6" id="features">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> ADVANCED FEATURES
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h2 className="text-lg font-bold mb-3">Advanced Platform Features</h2>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: What is GPT-In-The-Middle?</h3>
                <p className="text-sm mt-1">
                  A: 4ochan.org features advanced AI enhancement of user interactions. When you post or reply, your message is processed 
                  to enhance clarity, correct errors, and improve formatting, all while preserving your original intent.
                </p>
                <p className="text-sm mt-1">
                  <strong>Example:</strong> If you type "make me a diagram of the OSI model", the platform might enhance your request by 
                  actually generating and including a diagram of the OSI network model in your post.
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: How do thread subscriptions work?</h3>
                <p className="text-sm mt-1">
                  A: You can subscribe to threads you're interested in to receive notifications when there are new replies. 
                  To subscribe, look for the "Subscribe" button in the thread options menu.
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-bold">Q: What are the site statistics for?</h3>
                <p className="text-sm mt-1">
                  A: The site statistics section on the home page shows:
                </p>
                <ul className="list-disc pl-5 text-sm mt-1">
                  <li><strong>Relays:</strong> Total number of configured Nostr relays</li>
                  <li><strong>Connected:</strong> Number of relays currently connected</li>
                  <li><strong>Boards:</strong> Total number of available boards</li>
                  <li><strong>Thread Views:</strong> Total number of thread views across the entire platform</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Markdown and Code */}
          <div className="mb-6" id="markdown">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> MARKDOWN, CODE, AND DIAGRAMS
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h2 className="text-lg font-bold mb-3">Using Markdown, Code Blocks, and Diagrams</h2>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: What formatting options are available in posts?</h3>
                <p className="text-sm mt-1">
                  A: 4ochan.org supports Markdown formatting in all posts. This includes:
                </p>
                <ul className="list-disc pl-5 text-sm mt-1">
                  <li><strong>Bold text:</strong> Use <code>**bold**</code> for <strong>bold text</strong></li>
                  <li><strong>Italic text:</strong> Use <code>*italic*</code> for <em>italic text</em></li>
                  <li><strong>Lists:</strong> Use <code>- item</code> for bullet lists</li>
                  <li><strong>Links:</strong> Use <code>[text](url)</code> for links</li>
                  <li><strong>Headers:</strong> Use <code># Header</code> for headers</li>
                </ul>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: How do I post code snippets?</h3>
                <p className="text-sm mt-1">
                  A: You can post code with syntax highlighting by using triple backticks followed by the language name:
                </p>
                <div className="bg-gray-100 p-2 text-sm font-mono mt-1">
                  ```javascript<br/>
                  function hello() {"{"}<br/>
                  {"  "}console.log("Hello world!");<br/>
                  {"}"}<br/>
                  ```
                </div>
                <p className="text-sm mt-1">
                  This will render as a formatted code block with JavaScript syntax highlighting.
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-bold">Q: Can I create diagrams in my posts?</h3>
                <p className="text-sm mt-1">
                  A: Yes! 4ochan.org supports Mermaid diagrams. Use the following format:
                </p>
                <div className="bg-gray-100 p-2 text-sm font-mono mt-1">
                  ```mermaid<br/>
                  graph TD;<br/>
                  {"  "}A--&gt;B;<br/>
                  {"  "}A--&gt;C;<br/>
                  {"  "}B--&gt;D;<br/>
                  {"  "}C--&gt;D;<br/>
                  ```
                </div>
                <p className="text-sm mt-1">
                  This will render as an interactive flowchart diagram showing connections between nodes A, B, C, and D.
                </p>
              </div>
            </div>
          </div>

          {/* Image Uploads */}
          <div className="mb-6" id="images">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> IMAGE UPLOADS AND PASTING
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h2 className="text-lg font-bold mb-3">Working with Images</h2>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: How do I add images to my posts?</h3>
                <p className="text-sm mt-1">
                  A: There are two ways to add images to your posts:
                </p>
                <ol className="list-decimal pl-5 text-sm mt-1">
                  <li><strong>Upload Button:</strong> Click the "Upload Image" button and select an image from your device</li>
                  <li><strong>Clipboard Paste:</strong> Copy an image to your clipboard and press Ctrl+V (or Cmd+V on Mac) in the post textarea</li>
                </ol>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: Where are images stored?</h3>
                <p className="text-sm mt-1">
                  A: Images are uploaded to nostr.build, a decentralized image hosting service that's compatible with the Nostr protocol. 
                  This means your images are not stored on 4ochan's servers, but in a distributed manner consistent with the decentralized nature of the platform.
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-bold">Q: Are there any restrictions on images?</h3>
                <p className="text-sm mt-1">
                  A: Yes, there are some limitations:
                </p>
                <ul className="list-disc pl-5 text-sm mt-1">
                  <li>Maximum file size: 5MB</li>
                  <li>Supported formats: JPG, PNG, GIF, WEBP</li>
                  <li>Content restrictions: Please don't upload illegal content</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Nostr Integration */}
          <div className="mb-6" id="nostr">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> NOSTR INTEGRATION
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h2 className="text-lg font-bold mb-3">Understanding Nostr Integration</h2>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: What is Nostr and how does it relate to 4ochan?</h3>
                <p className="text-sm mt-1">
                  A: Nostr (Notes and Other Stuff Transmitted by Relays) is a decentralized protocol that enables censorship-resistant 
                  communication. 4ochan.org is built entirely on Nostr, meaning all content (threads, posts, images) is stored on 
                  Nostr relays rather than a central server. This makes the platform resistant to censorship and single points of failure.
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: What happens if relays go down?</h3>
                <p className="text-sm mt-1">
                  A: If some relays become unavailable, 4ochan will automatically attempt to connect to alternative relays. Additionally, 
                  any posts you make while offline are saved locally and will be automatically published when connectivity is restored.
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-bold">Q: Can I use my existing Nostr identity?</h3>
                <p className="text-sm mt-1">
                  A: Yes! 4ochan.org supports Nostr authentication. If you have an existing Nostr identity (private/public key pair), 
                  you can import it to use across the platform. If you don't have one, the site will automatically generate one for you.
                </p>
              </div>
            </div>
          </div>

          {/* Cryptocurrency Features */}
          <div className="mb-6" id="crypto">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> CRYPTOCURRENCY FEATURES
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h2 className="text-lg font-bold mb-3">Cryptocurrency and Token Analysis</h2>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: What is the PumpFunWidget?</h3>
                <p className="text-sm mt-1">
                  A: The PumpFunWidget is a feature that automatically recognizes cryptocurrency token addresses mentioned in posts 
                  and displays detailed information about those tokens, including price, market cap, and other metrics.
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: How do I use the token analysis feature?</h3>
                <p className="text-sm mt-1">
                  A: Simply mention an Ethereum or Solana token address in your post, and the platform will automatically fetch and display 
                  information about that token. This works for both ERC-20 tokens on Ethereum and SPL tokens on Solana.
                </p>
                <p className="text-sm mt-1">
                  <strong>Example:</strong> Mentioning "0xdac17f958d2ee523a2206206994597c13d831ec7" in a post will display information about Tether (USDT).
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-bold">Q: What information is displayed about tokens?</h3>
                <p className="text-sm mt-1">
                  A: For recognized tokens, the widget displays:
                </p>
                <ul className="list-disc pl-5 text-sm mt-1">
                  <li>Token name and symbol</li>
                  <li>Current price in USD</li>
                  <li>Price change percentage (24h)</li>
                  <li>Market capitalization</li>
                  <li>Trading volume</li>
                  <li>Links to block explorers and decentralized exchanges</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Thread Visualization */}
          <div className="mb-6" id="threads">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> THREAD VISUALIZATION
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h2 className="text-lg font-bold mb-3">Thread Context Visualization</h2>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: What is the Thread Context Visualization?</h3>
                <p className="text-sm mt-1">
                  A: Thread Context Visualization is a feature that shows the relationship between posts in a thread in a tree-like structure. 
                  It helps you understand which posts are replies to others, making it easier to follow complex conversations.
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: How do I use the thread visualization?</h3>
                <p className="text-sm mt-1">
                  A: When viewing a thread, look for the tabs at the top of the content area. Click on the "Context View" tab to 
                  switch from the standard chronological view to the tree visualization. You can click on any post in the visualization 
                  to highlight it and its related posts.
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-bold">Q: What do the lines and connections mean?</h3>
                <p className="text-sm mt-1">
                  A: In the visualization:
                </p>
                <ul className="list-disc pl-5 text-sm mt-1">
                  <li>Vertical lines connect parent posts to their direct replies</li>
                  <li>Horizontal lines represent siblings (posts replying to the same parent)</li>
                  <li>The original post (OP) is at the top of the tree</li>
                  <li>Posts are arranged chronologically within their reply level</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Drawing Tool */}
          <div className="mb-6" id="drawing">
            <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
              <span className="mr-1">■</span> DRAWING TOOL
            </div>
            <div className="bg-white border border-black border-t-0 p-4">
              <h2 className="text-lg font-bold mb-3">Using the TLDraw Drawing Tool</h2>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: What is the drawing tool?</h3>
                <p className="text-sm mt-1">
                  A: 4ochan.org integrates TLDraw, a powerful drawing and diagramming tool that lets you create visual content directly in your posts. 
                  It's perfect for sketches, diagrams, and visual explanations.
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-bold">Q: How do I use the drawing tool?</h3>
                <p className="text-sm mt-1">
                  A: When creating a post or reply, click the "Open Drawing Tool" button. This will launch the TLDraw interface where you can:
                </p>
                <ul className="list-disc pl-5 text-sm mt-1">
                  <li>Draw freehand with various brushes</li>
                  <li>Add shapes, text, and arrows</li>
                  <li>Use multiple colors and styles</li>
                  <li>Create multi-layer illustrations</li>
                </ul>
                <p className="text-sm mt-1">
                  When you're done, click "Save" to add the drawing to your post.
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-bold">Q: Can I collaborate with others on drawings?</h3>
                <p className="text-sm mt-1">
                  A: Yes! The drawing tool supports multiplayer collaboration. This means you and other users can work on the same drawing 
                  simultaneously. This is great for brainstorming sessions or collaborative art projects.
                </p>
              </div>
            </div>
          </div>

          {/* Back to Home Button */}
          <div className="text-center mt-8 mb-4">
            <button 
              onClick={() => setLocation('/')}
              className="bg-gray-200 text-black font-bold py-1 px-4 border-2 border-black text-sm inline-block"
              style={{ boxShadow: "2px 2px 0 #000" }}
            >
              Return to Home
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FAQ;