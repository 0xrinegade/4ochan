import { Page, expect } from '@playwright/test';
import { generateSecretKey, getPublicKey } from 'nostr-tools';

// Generate test user data
export function generateTestUser() {
  const privateKey = generateSecretKey();
  const publicKey = getPublicKey(privateKey);
  const username = `test_user_${Math.floor(Math.random() * 100000)}`;
  
  // Convert Uint8Array to hex string for use in localStorage
  const privateKeyHex = Array.from(privateKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return {
    username,
    password: 'Test@12345',
    nostrPubkey: publicKey,
    nostrPrivkey: privateKeyHex, // Use hex string instead of Uint8Array
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

/**
 * Login as a test user for E2E tests
 * This function handles the entire login flow and makes sure we're authenticated
 * before proceeding with tests
 */
export async function loginAsTestUser(page: Page) {
  // Generate a test user with Nostr keys
  const testUser = generateTestUser();
  
  // Set localStorage to simulate having the private key
  await page.goto('/');
  await page.evaluate((key) => {
    localStorage.setItem('nostr-privkey', key);
  }, testUser.nostrPrivkey);
  
  // Also set a default display name for the test user
  await page.evaluate((displayName) => {
    localStorage.setItem('nostr-display-name', displayName);
  }, testUser.displayName);
  
  // Refresh to use the stored keys
  await page.reload();
  
  // Wait for the app to load with the user logged in
  await page.waitForSelector('[data-testid="app-content"]', { timeout: 5000 })
    .catch(async () => {
      // If we can't find the app content, try the Nostr auth flow
      await authenticateWithNostr(page, testUser.nostrPrivkey);
      
      // Wait again to confirm authentication worked
      await page.waitForSelector('[data-testid="app-content"]', { timeout: 5000 });
    });
  
  // Verify we're logged in by checking for user-specific elements
  const isLoggedIn = await page.isVisible('[data-testid="user-profile-link"]') || 
                     await page.isVisible('[data-testid="create-thread-button"]');
  
  expect(isLoggedIn).toBeTruthy();
  
  return testUser;
}