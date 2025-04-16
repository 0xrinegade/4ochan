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
      // Get the redirect URL from our backend
      const response = await apiRequest({
        method: "GET",
        url: "/api/auth/openai-redirect"
      });
      
      if (response && response.redirectUrl) {
        // Redirect to OpenAI's OAuth endpoint
        window.location.href = response.redirectUrl;
      } else {
        console.error("Failed to get OAuth redirect URL");
      }
    } catch (error) {
      console.error("Failed to initiate OpenAI login:", error);
    }
  };
  
  // Check for login success on component mount
  React.useEffect(() => {
    // Check if this is a callback from OAuth (URL contains login_success)
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login_success');
    const username = urlParams.get('username');
    const pubkey = urlParams.get('pubkey');
    
    if (loginSuccess === 'true' && username) {
      // Store user info in localStorage
      localStorage.setItem("aiUser", JSON.stringify({
        username: username,
        pubkey: pubkey || "",
        loginTime: new Date().toISOString()
      }));
      
      // Call the success handler
      onLoginSuccess(username);
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onLoginSuccess]);
  
  return (
    <Button 
      onClick={handleLogin}
      className={`flex items-center gap-2 bg-white hover:bg-gray-100 text-primary border border-black ${className || ""}`}
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