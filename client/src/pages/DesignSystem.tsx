import React, { useState } from "react";
import { Link } from "wouter";
import {
  RetroContainer,
  RetroSection,
  RetroHeading,
  RetroSubheading,
  RetroButton,
  RetroInput,
  RetroTextarea,
  RetroGrid,
  RetroTable,
  RetroTh,
  RetroTd,
  RetroMarquee,
  RetroDivider,
  RetroBadge,
  MobileOnly,
  TabletUp,
  DesktopOnly
} from "@/components/ui/design-system";

const DesignSystem: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [textareaValue, setTextareaValue] = useState<string>("");

  return (
    <div className="max-w-4xl mx-auto p-4">
      <RetroContainer>
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Retro 90s Design System</h1>
          <p className="mb-4">A comprehensive guide to our nostalgic web design components</p>
          <RetroDivider />
          <RetroMarquee text="★ Welcome to our 90s design system! Feel free to use these components in your project. ★" />
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Link href="/">
              <RetroButton>Back to Home</RetroButton>
            </Link>
            <RetroBadge text="NEW!" color="new" />
            <RetroBadge text="HOT!" color="hot" />
            <RetroBadge text="UPDATED" color="primary" />
          </div>
        </header>

        <RetroSection title="RESPONSIVE GUIDELINES">
          <p className="mb-4">
            This design system follows these responsive breakpoints:
          </p>
          
          <RetroTable>
            <thead>
              <tr>
                <RetroTh>Breakpoint</RetroTh>
                <RetroTh>Size</RetroTh>
                <RetroTh>Description</RetroTh>
              </tr>
            </thead>
            <tbody>
              <tr>
                <RetroTd>Mobile</RetroTd>
                <RetroTd>&lt; 768px</RetroTd>
                <RetroTd>Single column layouts, simplified UIs</RetroTd>
              </tr>
              <tr>
                <RetroTd>Tablet</RetroTd>
                <RetroTd>≥ 768px</RetroTd>
                <RetroTd>Two column layouts, more complex UIs</RetroTd>
              </tr>
              <tr>
                <RetroTd>Desktop</RetroTd>
                <RetroTd>≥ 1024px</RetroTd>
                <RetroTd>Multi-column layouts, full feature set</RetroTd>
              </tr>
            </tbody>
          </RetroTable>

          <div className="mt-4">
            <MobileOnly>
              <div className="bg-green-100 border border-green-600 p-2 mb-2">
                You are viewing on a mobile device!
              </div>
            </MobileOnly>
            
            <TabletUp>
              <div className="bg-blue-100 border border-blue-600 p-2 mb-2">
                You are viewing on a tablet or larger device!
              </div>
            </TabletUp>
            
            <DesktopOnly>
              <div className="bg-purple-100 border border-purple-600 p-2">
                You are viewing on a desktop device!
              </div>
            </DesktopOnly>
          </div>
        </RetroSection>
        
        <RetroSection title="COLOR PALETTE">
          <RetroGrid columns={2} gap="medium">
            <div>
              <h4 className="font-bold mb-1">Primary Colors</h4>
              <div className="flex flex-col gap-2">
                <div className="h-10 bg-primary text-white p-2">Primary</div>
                <div className="h-10 bg-white border border-black p-2">Background</div>
                <div className="h-10 bg-secondary p-2">Secondary</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-1">Text & Accents</h4>
              <div className="flex flex-col gap-2">
                <div className="h-10 bg-black text-white p-2">Text</div>
                <div className="h-10 bg-accent text-white p-2">Accent</div>
                <div className="h-10 bg-muted text-muted-foreground p-2">Muted</div>
              </div>
            </div>
          </RetroGrid>
        </RetroSection>

        <RetroSection title="TYPOGRAPHY">
          <RetroHeading>This is a Heading (H2)</RetroHeading>
          <RetroSubheading>This is a Subheading (H3)</RetroSubheading>
          
          <p className="mb-4">
            This is regular paragraph text. Our design system uses the Libertarian
            font for that authentic 90s feel. All text is high contrast with
            good readability.
          </p>
          
          <div className="flex flex-col gap-2 mb-4">
            <code className="monaco bg-black text-green-400 p-2 text-sm">
              This is monospace text, like for code samples.
            </code>
            
            <div className="quote-text bg-gray-100 border-l-4 border-primary p-2 italic">
              This is a blockquote or quote text style.
            </div>
          </div>
          
          <ul className="retro-list mb-4">
            <li>This is a list item with retro styling</li>
            <li>Another list item with that 90s feel</li>
            <li>Lists use the » character as bullets</li>
          </ul>
        </RetroSection>

        <RetroSection title="COMPONENTS">
          <RetroSubheading>Buttons</RetroSubheading>
          <div className="flex flex-wrap gap-2 mb-4">
            <RetroButton>Default Button</RetroButton>
            <RetroButton className="bg-primary text-white">Primary Button</RetroButton>
            <RetroButton disabled>Disabled Button</RetroButton>
          </div>

          <RetroSubheading>Form Inputs</RetroSubheading>
          <div className="space-y-4 mb-4">
            <div>
              <label htmlFor="demo-input" className="block mb-1 font-bold">Text Input:</label>
              <RetroInput
                id="demo-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter some text..."
              />
            </div>
            
            <div>
              <label htmlFor="demo-textarea" className="block mb-1 font-bold">Textarea:</label>
              <RetroTextarea
                id="demo-textarea"
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                placeholder="Enter multiple lines of text..."
              />
            </div>
          </div>

          <RetroSubheading>Grid Layout (Responsive)</RetroSubheading>
          <RetroGrid columns={4} gap="small">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-black p-4 bg-white text-center">
                Grid Item {i}
              </div>
            ))}
          </RetroGrid>
        </RetroSection>

        <RetroSection title="DECORATIVE ELEMENTS">
          <RetroSubheading>Dividers</RetroSubheading>
          <div className="space-y-6 mb-4">
            <div>
              <p className="mb-2">Solid Divider:</p>
              <RetroDivider style="solid" />
            </div>
            
            <div>
              <p className="mb-2">Dashed Divider:</p>
              <RetroDivider style="dashed" />
            </div>
            
            <div>
              <p className="mb-2">Dotted Divider:</p>
              <RetroDivider style="dotted" />
            </div>
          </div>

          <RetroSubheading>Badges</RetroSubheading>
          <div className="flex flex-wrap gap-2 mb-4">
            <RetroBadge text="DEFAULT" />
            <RetroBadge text="PRIMARY" color="primary" />
            <RetroBadge text="NEW!" color="new" />
            <RetroBadge text="HOT!" color="hot" />
          </div>
        </RetroSection>
        
        <RetroSection title="USAGE GUIDELINES">
          <div className="space-y-4">
            <div>
              <RetroSubheading>Layout Structure</RetroSubheading>
              <p>
                Always use RetroContainer for main content areas and RetroSection for
                individual content sections. This maintains the consistent retro
                feel throughout the application.
              </p>
            </div>
            
            <div>
              <RetroSubheading>Form Elements</RetroSubheading>
              <p>
                Always pair form inputs with proper labels. Use RetroInput and
                RetroTextarea components instead of native HTML elements to
                maintain the consistent 90s aesthetic.
              </p>
            </div>
            
            <div>
              <RetroSubheading>Responsive Design</RetroSubheading>
              <p>
                Use RetroGrid with appropriate column settings for different layouts.
                Use the MobileOnly, TabletUp, and DesktopOnly components when you
                need completely different content for different viewports.
              </p>
            </div>
          </div>
        </RetroSection>
      </RetroContainer>
    </div>
  );
};

export default DesignSystem;