import { test, expect } from '@playwright/test';
import { generateTestUser } from './helpers/auth';

test.describe('Authentication Tests', () => {
  // Generate a unique test user for this test suite
  const testUser = generateTestUser();
  
  test('user registration with Nostr keys', async ({ page }) => {
    await page.goto('/');
    
    // Find and click on sign-up button or link
    await page.getByText('Login or Create Account').click();
    await page.getByText('Sign Up').click();
    
    // Fill in registration form
    await page.getByLabel('Username').fill(testUser.username);
    await page.getByLabel('Password').fill(testUser.password);
    
    // If there's a confirm password field
    if (await page.getByLabel('Confirm Password').isVisible()) {
      await page.getByLabel('Confirm Password').fill(testUser.password);
    }
    
    // Enter Nostr public key (assuming form has this field)
    if (await page.getByLabel('Nostr Public Key').isVisible()) {
      await page.getByLabel('Nostr Public Key').fill(testUser.nostrPubkey);
    }
    
    // Submit the form
    await page.getByRole('button', { name: 'Sign Up' }).click();
    
    // Wait for success or redirection
    await page.waitForURL('/', { timeout: 10000 });
    
    // Verify user is logged in
    await expect(page.getByText(testUser.username)).toBeVisible();
  });
  
  test('user login', async ({ page }) => {
    await page.goto('/');
    
    // Find and click on login button or link
    await page.getByText('Login or Create Account').click();
    
    // Fill in login form
    await page.getByLabel('Username').fill(testUser.username);
    await page.getByLabel('Password').fill(testUser.password);
    
    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for successful login redirect
    await page.waitForURL('/', { timeout: 10000 });
    
    // Verify user is logged in
    await expect(page.getByText(testUser.username)).toBeVisible();
  });
  
  test('user logout', async ({ page }) => {
    // First log in
    await page.goto('/');
    await page.getByText('Login or Create Account').click();
    await page.getByLabel('Username').fill(testUser.username);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for login to complete
    await page.waitForURL('/', { timeout: 10000 });
    
    // Now try to log out
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    
    // Verify logout was successful (login button is visible again)
    await expect(page.getByText('Login or Create Account')).toBeVisible();
  });
  
  test('login validation handles incorrect credentials', async ({ page }) => {
    await page.goto('/');
    
    // Find and click on login button or link
    await page.getByText('Login or Create Account').click();
    
    // Fill in login form with incorrect password
    await page.getByLabel('Username').fill(testUser.username);
    await page.getByLabel('Password').fill('wrong-password');
    
    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check for error message
    await expect(page.getByText('Invalid username or password')).toBeVisible();
    
    // Verify we're still on the login page
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
  
  test('Nostr key authentication', async ({ page }) => {
    await page.goto('/');
    
    // Find and click on login with Nostr
    await page.getByText('Login or Create Account').click();
    
    if (await page.getByText('Connect with Nostr').isVisible()) {
      await page.getByText('Connect with Nostr').click();
      
      // Enter Nostr private key (this is a test environment)
      // In real applications, this would use a browser extension or NIP-07 provider
      await page.getByPlaceholder('Enter your Nostr private key').fill(testUser.nostrPrivkey);
      
      await page.getByRole('button', { name: 'Connect' }).click();
      
      // Wait for login to complete
      await page.waitForURL('/', { timeout: 10000 });
      
      // Verify user is logged in
      await expect(page.getByText(testUser.username)).toBeVisible();
    } else {
      console.log('Nostr authentication option not available, skipping test');
    }
  });
});