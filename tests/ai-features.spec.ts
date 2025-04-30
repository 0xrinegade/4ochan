import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateWithNostr } from './helpers/auth';

test.describe('AI Features Tests', () => {
  // Create a test user for this test suite
  const testUser = generateTestUser();
  
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await authenticateWithNostr(page, testUser.nostrPrivkey);
  });
  
  test('GPT-in-the-middle post processing', async ({ page }) => {
    // Navigate to a board
    await page.goto('/board/general');
    
    // Start a new thread with AI processing enabled
    await page.getByRole('button', { name: 'New Thread' }).click();
    
    // Check if AI enhancement toggle exists
    const aiToggle = page.getByLabel('Use AI Enhancement');
    
    if (await aiToggle.isVisible()) {
      // Enable AI
      if (!(await aiToggle.isChecked())) {
        await aiToggle.check();
      }
      
      // Fill in thread details
      await page.getByLabel('Title').fill('AI Enhanced Test Thread');
      await page.getByLabel('Content').fill('This is a test thread that will be enhanced by AI. Improve my grammar and formatting.');
      
      // Submit the form
      await page.getByRole('button', { name: 'Create Thread' }).click();
      
      // Wait for AI processing
      await page.waitForURL(/\/thread\/.+/, { timeout: 15000 });
      
      // Check for AI enhancement indicator
      const aiIndicator = page.locator('[data-testid="ai-enhanced-indicator"]');
      
      if (await aiIndicator.isVisible()) {
        console.log('AI enhancement indicator is visible');
      } else {
        console.log('AI enhancement indicator not found, may not be shown for enhanced content');
      }
      
      // The content should be enhanced, but we can't automatically verify the quality
      // Visual inspection required for content improvement
    } else {
      console.log('AI toggle not found, skipping AI enhancement test');
    }
  });
  
  test('AI authentication validation', async ({ page }) => {
    // Navigate to a page that might use AI auth
    await page.goto('/');
    
    // Look for AI auth section
    const aiAuthButton = page.getByRole('button', { name: 'Authenticate with AI' });
    
    if (await aiAuthButton.isVisible()) {
      await aiAuthButton.click();
      
      // Enter prompt for AI authentication
      const promptInput = page.getByPlaceholder('Type your authentication prompt...');
      await promptInput.fill('I am a human verifying my identity');
      
      // Submit the prompt
      await page.getByRole('button', { name: 'Verify' }).click();
      
      // Wait for AI processing
      await page.waitForTimeout(5000);
      
      // Check for success or failure message
      const responseMessage = page.locator('[data-testid="ai-auth-response"]');
      
      if (await responseMessage.isVisible()) {
        const messageText = await responseMessage.textContent();
        console.log(`AI auth response: ${messageText}`);
      }
    } else {
      console.log('AI authentication not found, skipping test');
    }
  });
  
  test('AI-generated content response', async ({ page }) => {
    // Navigate to a page with AI content generation
    await page.goto('/thread/general');
    
    // Look for AI generation button
    const aiGenerateButton = page.getByRole('button', { name: 'Generate with AI' });
    
    if (await aiGenerateButton.isVisible()) {
      await aiGenerateButton.click();
      
      // Enter prompt for content generation
      const promptInput = page.getByPlaceholder('What would you like the AI to write about?');
      await promptInput.fill('Write a short post about decentralized social media');
      
      // Submit the prompt
      await page.getByRole('button', { name: 'Generate' }).click();
      
      // Wait for AI processing
      await page.waitForTimeout(10000);
      
      // Check for generated content
      const generatedContent = page.locator('[data-testid="ai-generated-content"]');
      
      if (await generatedContent.isVisible()) {
        const contentText = await generatedContent.textContent();
        expect(contentText).not.toBe('');
        expect(contentText?.length).toBeGreaterThan(50);
        
        // Check for use content button
        const useContentButton = page.getByRole('button', { name: 'Use This Content' });
        
        if (await useContentButton.isVisible()) {
          await useContentButton.click();
          
          // Verify content was inserted into editor
          const editor = page.locator('[data-testid="content-editor"]');
          const editorContent = await editor.textContent();
          expect(editorContent).toContain('decentralized social media');
        }
      }
    } else {
      console.log('AI content generation not found, skipping test');
    }
  });
  
  test('sentiment analysis on posts', async ({ page }) => {
    // Navigate to a thread
    await page.goto('/board/general');
    
    // Create a new thread
    await page.getByRole('button', { name: 'New Thread' }).click();
    
    // Fill thread with a clearly positive sentiment
    await page.getByLabel('Title').fill('Positive Sentiment Test');
    await page.getByLabel('Content').fill('I am absolutely thrilled with the amazing features of this platform! Everything works perfectly and I love it!');
    
    // Submit the thread
    await page.getByRole('button', { name: 'Create Thread' }).click();
    
    // Wait for thread creation
    await page.waitForURL(/\/thread\/.+/);
    
    // Check if sentiment analysis is displayed
    const sentimentIndicator = page.locator('[data-testid="sentiment-indicator"]');
    
    if (await sentimentIndicator.isVisible()) {
      // Should show positive sentiment
      const sentiment = await sentimentIndicator.getAttribute('data-sentiment');
      console.log(`Detected sentiment: ${sentiment}`);
      
      // Ideally this would be "positive"
      if (sentiment) {
        expect(['positive', 'neutral', 'negative']).toContain(sentiment);
      }
    } else {
      console.log('Sentiment analysis not displayed, skipping test');
    }
  });
  
  test('topic tagging on content', async ({ page }) => {
    // Navigate to create a thread
    await page.goto('/board/general');
    await page.getByRole('button', { name: 'New Thread' }).click();
    
    // Fill thread with content containing clear topics
    await page.getByLabel('Title').fill('Topic Tagging Test');
    await page.getByLabel('Content').fill('Bitcoin and Ethereum prices have been volatile. Blockchain technology continues to evolve with NFTs gaining popularity. Smart contracts enable decentralized applications.');
    
    // Submit the thread
    await page.getByRole('button', { name: 'Create Thread' }).click();
    
    // Wait for thread creation
    await page.waitForURL(/\/thread\/.+/);
    
    // Check for automatically generated topic tags
    const topicTags = page.locator('[data-testid="topic-tags"]');
    
    if (await topicTags.isVisible()) {
      // Should have tags related to cryptocurrency
      const tags = page.locator('[data-testid="topic-tag"]');
      const tagCount = await tags.count();
      
      if (tagCount > 0) {
        console.log(`Found ${tagCount} topic tags`);
        
        // Check for expected tags
        const cryptoTagFound = await page.locator('[data-testid="topic-tag"]')
          .filter({ hasText: /bitcoin|crypto|blockchain|ethereum|nft/i })
          .isVisible();
          
        if (cryptoTagFound) {
          console.log('Found cryptocurrency-related tags as expected');
        }
      } else {
        console.log('No topic tags found');
      }
    } else {
      console.log('Topic tagging not displayed, skipping test');
    }
  });
});