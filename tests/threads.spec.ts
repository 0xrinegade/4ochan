import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateWithNostr } from './helpers/auth';
import { createThread, createReply, likePost, subscribeToThread } from './helpers/nostr';

test.describe('Thread and Post Tests', () => {
  // Create a test user for this test suite
  const testUser = generateTestUser();
  
  // Use a fixed boardId for testing
  // In a real test, you might query available boards first
  const testBoardId = 'general';
  
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await authenticateWithNostr(page, testUser.nostrPrivkey);
  });
  
  test('user can create a new thread', async ({ page }) => {
    // Navigate to a board
    await page.goto(`/board/${testBoardId}`);
    
    // Click new thread button
    await page.getByRole('button', { name: 'New Thread' }).click();
    
    // Generate unique thread content
    const threadTitle = `Test Thread ${Date.now()}`;
    const threadContent = `This is a test thread created at ${new Date().toISOString()}`;
    
    // Fill in thread details
    await page.getByLabel('Title').fill(threadTitle);
    await page.getByLabel('Content').fill(threadContent);
    
    // Submit the form
    await page.getByRole('button', { name: 'Create Thread' }).click();
    
    // Wait for redirect to thread page
    await page.waitForURL(/\/thread\/.+/);
    
    // Verify thread title and content are visible
    await expect(page.getByText(threadTitle)).toBeVisible();
    await expect(page.getByText(threadContent)).toBeVisible();
  });
  
  test('user can reply to a thread', async ({ page }) => {
    // First create a thread
    const threadTitle = `Reply Test Thread ${Date.now()}`;
    const threadContent = `Thread for testing replies ${new Date().toISOString()}`;
    
    await page.goto(`/board/${testBoardId}`);
    await page.getByRole('button', { name: 'New Thread' }).click();
    await page.getByLabel('Title').fill(threadTitle);
    await page.getByLabel('Content').fill(threadContent);
    await page.getByRole('button', { name: 'Create Thread' }).click();
    
    // Wait for thread page
    await page.waitForURL(/\/thread\/.+/);
    
    // Now create a reply
    const replyContent = `This is a test reply created at ${new Date().toISOString()}`;
    
    // Fill reply content
    await page.getByPlaceholder('Write your reply...').fill(replyContent);
    
    // Submit reply
    await page.getByRole('button', { name: 'Reply' }).click();
    
    // Wait for the reply to appear
    await expect(page.getByText(replyContent)).toBeVisible({ timeout: 10000 });
  });
  
  test('user can like posts', async ({ page }) => {
    // First create a thread
    const threadTitle = `Like Test Thread ${Date.now()}`;
    const threadContent = `Thread for testing likes ${new Date().toISOString()}`;
    
    await page.goto(`/board/${testBoardId}`);
    await page.getByRole('button', { name: 'New Thread' }).click();
    await page.getByLabel('Title').fill(threadTitle);
    await page.getByLabel('Content').fill(threadContent);
    await page.getByRole('button', { name: 'Create Thread' }).click();
    
    // Wait for thread page
    await page.waitForURL(/\/thread\/.+/);
    
    // Find the like button - implementation might vary depending on UI
    const likeButton = page.getByTestId('like-button').first();
    
    // Check initial like state
    let likeCount = 0;
    const likeCountEl = page.getByTestId('like-count').first();
    
    if (await likeCountEl.isVisible()) {
      const likeCountText = await likeCountEl.textContent();
      likeCount = likeCountText ? parseInt(likeCountText) : 0;
    }
    
    // Click like button
    await likeButton.click();
    
    // Check that like count increased
    await expect(async () => {
      const newCountText = await likeCountEl.textContent();
      const newCount = newCountText ? parseInt(newCountText) : 0;
      expect(newCount).toBeGreaterThan(likeCount);
    }).toPass();
  });
  
  test('user can subscribe to threads', async ({ page }) => {
    // First create a thread
    const threadTitle = `Subscribe Test Thread ${Date.now()}`;
    const threadContent = `Thread for testing subscriptions ${new Date().toISOString()}`;
    
    await page.goto(`/board/${testBoardId}`);
    await page.getByRole('button', { name: 'New Thread' }).click();
    await page.getByLabel('Title').fill(threadTitle);
    await page.getByLabel('Content').fill(threadContent);
    await page.getByRole('button', { name: 'Create Thread' }).click();
    
    // Wait for thread page
    await page.waitForURL(/\/thread\/.+/);
    
    // Find and click subscribe button
    const subscribeButton = page.getByRole('button', { name: 'Subscribe' });
    await subscribeButton.click();
    
    // Verify subscription status changed
    await expect(page.getByText('Subscribed')).toBeVisible();
    
    // Navigate to subscriptions page to confirm
    await page.goto('/subscriptions');
    
    // Verify the thread title appears in subscriptions
    await expect(page.getByText(threadTitle)).toBeVisible();
  });
  
  test('thread navigation and pagination works', async ({ page }) => {
    // Navigate to a board with multiple threads
    await page.goto(`/board/${testBoardId}`);
    
    // Check if there are threads
    const threadItems = page.locator('[data-testid="thread-item"]');
    
    if (await threadItems.count() > 0) {
      // Click on the first thread
      await threadItems.first().click();
      
      // Verify we navigated to a thread page
      await expect(page.url()).toMatch(/\/thread\/.+/);
      
      // Go back to the board
      await page.goBack();
      
      // Check if pagination exists
      const paginationNext = page.getByRole('button', { name: 'Next Page' });
      
      if (await paginationNext.isVisible()) {
        // Test pagination by clicking next
        await paginationNext.click();
        
        // Verify page number changed
        await expect(page.getByText('Page 2')).toBeVisible();
      }
    } else {
      console.log('No threads found, skipping thread navigation test');
    }
  });
});