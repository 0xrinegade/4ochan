import React from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface OpenAILoginButtonProps {
  onLoginSuccess: (username: string) => void;
  className?: string;
}

export const OpenAILoginButton: React.FC<OpenAILoginButtonProps> = ({
  onLoginSuccess,
  className
}) => {
  const handleLogin = async () => {
    try {
      // In a real implementation, we would redirect to OpenAI's OAuth endpoint
      // For now, we'll simulate a successful OpenAI login
      const response = await apiRequest({
        method: "GET",
        url: "/api/auth/openai-redirect"
      });
      
      if (response && response.redirectUrl) {
        // In a real implementation, we would redirect to this URL
        // window.location.href = response.redirectUrl;
        
        // For demonstration, we'll simulate a successful OAuth callback
        simulateOAuthCallback();
      }
    } catch (error) {
      console.error("Failed to initiate OpenAI login:", error);
    }
  };
  
  // This function simulates what would happen after a successful OAuth redirect
  const simulateOAuthCallback = async () => {
    try {
      // In a real implementation, this would be a callback from OpenAI with an auth code
      // We'd send that code to our backend to exchange for tokens
      const mockResponse = {
        success: true,
        username: "openai_user_" + Math.floor(Math.random() * 1000),
        userId: Math.floor(Math.random() * 10000)
      };
      
      // Store user info in localStorage
      localStorage.setItem("aiUser", JSON.stringify({
        username: mockResponse.username,
        userId: mockResponse.userId,
        loginTime: new Date().toISOString()
      }));
      
      // Call the success handler
      onLoginSuccess(mockResponse.username);
    } catch (error) {
      console.error("OAuth callback simulation failed:", error);
    }
  };
  
  return (
    <Button 
      onClick={handleLogin}
      className={`flex items-center gap-2 bg-[#74AA9C] hover:bg-[#5B8B7D] text-white ${className || ""}`}
    >
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0Z" fill="#74AA9C"/>
        <path d="M8 2.5L1.75 6.25L8 10L14.25 6.25L8 2.5Z" stroke="white" strokeWidth="1.5"/>
        <path d="M1.75 9.75L8 13.5L14.25 9.75" stroke="white" strokeWidth="1.5"/>
        <path d="M1.75 8L8 11.75L14.25 8" stroke="white" strokeWidth="1.5"/>
      </svg>
      Login with OpenAI
    </Button>
  );
};