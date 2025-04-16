import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AILoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string) => void;
}

export const AILoginModal: React.FC<AILoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [loginText, setLoginText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hint, setHint] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginText.trim().length < 25) {
      toast({
        title: "Input too short",
        description: "Please write at least 25 characters that demonstrate your thoughts.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      interface LoginResponse {
        success: boolean;
        message: string;
        username?: string;
        userId?: number;
      }

      const response = await apiRequest<LoginResponse>({
        method: "POST",
        url: "/api/auth/ai-login",
        data: { loginText }
      });

      if (response.success) {
        toast({
          title: "Login Successful",
          description: `Welcome, ${response.username}!`,
        });
        onLoginSuccess(response.username || "anon");
        onClose();
      } else {
        toast({
          title: "Login Failed",
          description: response.message,
          variant: "destructive",
        });
        
        // Get a hint if login fails
        interface HintResponse {
          hint: string;
        }
        
        const hintResponse = await apiRequest<HintResponse>({
          method: "POST",
          url: "/api/auth/login-hint",
          data: { loginText }
        });
        
        setHint(hintResponse.hint);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border border-black shadow-none rounded-none bg-white">
        <DialogHeader className="bg-primary text-white p-2">
          <DialogTitle className="text-base font-bold">Login with AI</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <DialogDescription className="mb-4">
            Instead of passwords, our system uses AI to verify you're human. Write a thoughtful paragraph about any topic that interests you.
          </DialogDescription>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <Textarea
                  value={loginText}
                  onChange={(e) => setLoginText(e.target.value)}
                  rows={4}
                  placeholder="Write something thoughtful here (at least 25 characters)..."
                  className="w-full border-2 border-black p-2 focus:outline-none focus:ring-0"
                />
                <p className="text-xs mt-1">
                  {loginText.length} characters (minimum 25)
                </p>
              </div>
              
              {hint && (
                <div className="bg-yellow-100 border border-black p-2 text-sm">
                  <strong>Hint:</strong> {hint}
                </div>
              )}
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  onClick={onClose}
                  className="bg-gray-200 hover:bg-gray-300 text-black border border-black"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting || loginText.trim().length < 25}
                  className="bg-primary hover:bg-red-700 text-white border border-black"
                >
                  {isSubmitting ? "Thinking..." : "Verify with AI"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};