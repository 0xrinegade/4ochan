import React, { useState } from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, BrainCircuit, MousePointer, Keyboard, RotateCcw } from 'lucide-react';

export const AccessibilityButton: React.FC = () => {
  const {
    mode,
    largerText,
    reduceAnimations,
    screenReaderMode,
    monospaceFonts,
    setMode,
    toggleLargerText,
    toggleReduceAnimations,
    toggleScreenReaderMode,
    toggleMonospaceFonts,
    applyAccessibilityPreset,
  } = useAccessibility();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // For quick accessibility popover
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <>
      {/* Fixed accessibility button in the corner */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed bottom-5 left-5 z-50 rounded-full h-12 w-12 shadow-lg bg-primary text-primary-foreground"
            aria-label="Accessibility Options"
          >
            <span className="sr-only">Accessibility Options</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-60">
          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <h4 className="font-medium leading-none">Quick Accessibility</h4>
              <p className="text-sm text-muted-foreground">One-click accessibility presets</p>
            </div>
            <div className="grid gap-2">
              <Button 
                onClick={() => applyAccessibilityPreset('vision')}
                variant="outline" 
                className="justify-start"
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>Vision Assistance</span>
              </Button>
              <Button 
                onClick={() => applyAccessibilityPreset('cognitive')}
                variant="outline" 
                className="justify-start"
              >
                <BrainCircuit className="mr-2 h-4 w-4" />
                <span>Cognitive Assistance</span>
              </Button>
              <Button 
                onClick={() => applyAccessibilityPreset('motor')}
                variant="outline" 
                className="justify-start"
              >
                <MousePointer className="mr-2 h-4 w-4" />
                <span>Motor Assistance</span>
              </Button>
            </div>
            <Button
              variant="default"
              onClick={() => {
                setIsPopoverOpen(false);
                setIsDialogOpen(true);
              }}
            >
              Advanced Options
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Advanced accessibility dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Accessibility Settings</DialogTitle>
            <DialogDescription>
              Customize how the page appears and functions to suit your needs.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="visual">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
            </TabsList>
            
            {/* Visual settings tab */}
            <TabsContent value="visual" className="mt-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="larger-text">Larger Text</Label>
                    <p className="text-sm text-muted-foreground">Increase the font size</p>
                  </div>
                  <Switch
                    id="larger-text"
                    checked={largerText}
                    onCheckedChange={toggleLargerText}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="high-contrast">High Contrast</Label>
                    <p className="text-sm text-muted-foreground">Use high contrast colors</p>
                  </div>
                  <Switch
                    id="high-contrast"
                    checked={mode === 'high-contrast'}
                    onCheckedChange={() => setMode(mode === 'high-contrast' ? 'default' : 'high-contrast')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reduce-animations">Reduce Animations</Label>
                    <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                  </div>
                  <Switch
                    id="reduce-animations"
                    checked={reduceAnimations}
                    onCheckedChange={toggleReduceAnimations}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Content settings tab */}
            <TabsContent value="content" className="mt-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="screen-reader">Screen Reader Optimization</Label>
                    <p className="text-sm text-muted-foreground">Improve compatibility with screen readers</p>
                  </div>
                  <Switch
                    id="screen-reader"
                    checked={screenReaderMode}
                    onCheckedChange={toggleScreenReaderMode}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="monospace-fonts">Monospace Fonts</Label>
                    <p className="text-sm text-muted-foreground">Use monospace fonts for code and technical content</p>
                  </div>
                  <Switch
                    id="monospace-fonts"
                    checked={monospaceFonts}
                    onCheckedChange={toggleMonospaceFonts}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dyslexia-friendly">Dyslexia-Friendly Mode</Label>
                    <p className="text-sm text-muted-foreground">Use fonts and spacing that are easier to read</p>
                  </div>
                  <Switch
                    id="dyslexia-friendly"
                    checked={mode === 'dyslexia-friendly'}
                    onCheckedChange={() => setMode(mode === 'dyslexia-friendly' ? 'default' : 'dyslexia-friendly')}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Controls settings tab */}
            <TabsContent value="controls" className="mt-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="simplified-interface">Simplified Interface</Label>
                    <p className="text-sm text-muted-foreground">Reduce visual complexity and distractions</p>
                  </div>
                  <Switch
                    id="simplified-interface"
                    checked={mode === 'simplified'}
                    onCheckedChange={() => setMode(mode === 'simplified' ? 'default' : 'simplified')}
                  />
                </div>
                
                <div className="flex flex-col gap-2 mt-4">
                  <Label>Quick Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => applyAccessibilityPreset('vision')}
                      variant="outline" 
                      className="justify-start"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Vision</span>
                    </Button>
                    <Button 
                      onClick={() => applyAccessibilityPreset('cognitive')}
                      variant="outline" 
                      className="justify-start"
                    >
                      <BrainCircuit className="mr-2 h-4 w-4" />
                      <span>Cognitive</span>
                    </Button>
                    <Button 
                      onClick={() => applyAccessibilityPreset('motor')}
                      variant="outline" 
                      className="justify-start"
                    >
                      <MousePointer className="mr-2 h-4 w-4" />
                      <span>Motor</span>
                    </Button>
                    <Button 
                      onClick={() => applyAccessibilityPreset('reset')}
                      variant="outline" 
                      className="justify-start"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      <span>Reset All</span>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button 
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};