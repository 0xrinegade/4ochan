import { Page } from '@playwright/test';
import { generatePrivateKey, getPublicKey } from 'nostr-tools';

// Generate test user data
export function generateTestUser() {
  const privateKey = generatePrivateKey();
  const publicKey = getPublicKey(privateKey);
  const username = `test_user_${Math.floor(Math.random() * 100000)}`;
  
  return {
    username,
    password: 'Test@12345',
    nostrPubkey: publicKey,
    nostrPrivkey: privateKey,
    displayName: `Test User ${Math.floor(Math.random() * 1000)}`,
  };
}

// Authenticate using Nostr key
export async function authenticateWithNostr(page: Page, privateKey: string) {
  await page.goto('/');
  
  // Look for authentication elements and authenticate
  if (await page.getByText('Login or Create Account').isVisible()) {
    await page.getByText('Login or Create Account').click();
    
    // If there's option to use Nostr key
    if (await page.getByText('Connect with Nostr').isVisible()) {
      await page.getByText('Connect with Nostr').click();
      
      // Enter private key (in real tests, this might use browser extensions)
      await page.getByPlaceholder('Enter your Nostr private key').fill(privateKey);
      await page.getByRole('button', { name: 'Connect' }).click();
      
      // Wait for authentication to complete
      await page.waitForNavigation();
    }
  }
}

// API-based authentication helper - can be used to set up test state
export async function apiAuth(page: Page, username: string, password: string) {
  // Use context.request for authenticated API calls
  const response = await page.context().request.post('/api/auth/login', {
    data: {
      username,
      password
    }
  });
  
  return response.ok();
}