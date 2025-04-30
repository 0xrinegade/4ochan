import { Page } from '@playwright/test';

// Helper functions for interacting with Nostr-related components

// Create a new thread in a specific board
export async function createThread(page: Page, boardId: string, title: string, content: string) {
  await page.goto(`/board/${boardId}`);
  
  // Click new thread button
  await page.getByRole('button', { name: 'New Thread' }).click();
  
  // Fill in thread details
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Content').fill(content);
  
  // Submit the form
  await page.getByRole('button', { name: 'Create Thread' }).click();
  
  // Wait for redirect to thread page
  await page.waitForURL(/\/thread\/.+/);
  
  // Extract thread ID from URL
  const url = page.url();
  const threadId = url.split('/thread/')[1].split('/')[0];
  
  return threadId;
}

// Create a reply to a thread
export async function createReply(page: Page, threadId: string, content: string) {
  await page.goto(`/thread/${threadId}`);
  
  // Fill in reply content
  await page.getByPlaceholder('Write your reply...').fill(content);
  
  // Submit the reply
  await page.getByRole('button', { name: 'Reply' }).click();
  
  // Wait for the reply to appear
  await page.waitForSelector(`text="${content}"`);
}

// Like a post
export async function likePost(page: Page, postSelector: string) {
  // Find the like button within the post container
  const likeButton = page.locator(postSelector).getByRole('button', { name: 'Like' });
  
  // Get initial like count
  const initialCount = await getLikeCount(page, postSelector);
  
  // Click the like button
  await likeButton.click();
  
  // Wait for like count to increase
  await page.waitForFunction(
    ([selector, count]) => {
      const newCount = document.querySelector(selector)?.textContent;
      return newCount && parseInt(newCount.replace(/\D/g, '')) > count;
    },
    [postSelector + ' .like-count', initialCount]
  );
}

// Get like count for a post
export async function getLikeCount(page: Page, postSelector: string) {
  const likeCountText = await page.locator(postSelector + ' .like-count').textContent();
  return likeCountText ? parseInt(likeCountText.replace(/\D/g, '')) : 0;
}

// Subscribe to a thread
export async function subscribeToThread(page: Page, threadId: string) {
  await page.goto(`/thread/${threadId}`);
  
  // Find and click subscribe button
  await page.getByRole('button', { name: 'Subscribe' }).click();
  
  // Wait for confirmation
  await page.waitForSelector('text="Subscribed to thread"');
}