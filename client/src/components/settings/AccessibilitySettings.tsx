import React from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, BrainCircuit, MousePointer, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AccessibilitySettings: React.FC = () => {
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-medium">Accessibility Settings</h2>
        <p className="text-sm text-muted-foreground">
          Customize how the app appears and functions to suit your needs.
        </p>
      </div>
      
      <Tabs defaultValue="visual" className="w-full">
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
                <Label htmlFor="acc-larger-text">Larger Text</Label>
                <p className="text-sm text-muted-foreground">Increase the font size</p>
              </div>
              <Switch
                id="acc-larger-text"
                checked={largerText}
                onCheckedChange={toggleLargerText}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="acc-high-contrast">High Contrast</Label>
                <p className="text-sm text-muted-foreground">Use high contrast colors</p>
              </div>
              <Switch
                id="acc-high-contrast"
                checked={mode === 'high-contrast'}
                onCheckedChange={() => setMode(mode === 'high-contrast' ? 'default' : 'high-contrast')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="acc-reduce-animations">Reduce Animations</Label>
                <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
              </div>
              <Switch
                id="acc-reduce-animations"
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
                <Label htmlFor="acc-screen-reader">Screen Reader Optimization</Label>
                <p className="text-sm text-muted-foreground">Improve compatibility with screen readers</p>
              </div>
              <Switch
                id="acc-screen-reader"
                checked={screenReaderMode}
                onCheckedChange={toggleScreenReaderMode}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="acc-monospace-fonts">Monospace Fonts</Label>
                <p className="text-sm text-muted-foreground">Use monospace fonts for code and technical content</p>
              </div>
              <Switch
                id="acc-monospace-fonts"
                checked={monospaceFonts}
                onCheckedChange={toggleMonospaceFonts}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="acc-dyslexia-friendly">Dyslexia-Friendly Mode</Label>
                <p className="text-sm text-muted-foreground">Use fonts and spacing that are easier to read</p>
              </div>
              <Switch
                id="acc-dyslexia-friendly"
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
                <Label htmlFor="acc-simplified-interface">Simplified Interface</Label>
                <p className="text-sm text-muted-foreground">Reduce visual complexity and distractions</p>
              </div>
              <Switch
                id="acc-simplified-interface"
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
    </div>
  );
};