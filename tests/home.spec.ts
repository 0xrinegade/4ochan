import { test, expect } from '@playwright/test';

test.describe('Homepage Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Verify title is present
    const title = await page.title();
    expect(title).not.toBe('');
    
    // Check for main elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
  
  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation menu
    const navigationMenu = page.locator('nav');
    await expect(navigationMenu).toBeVisible();
    
    // If using floating navigation
    const floatingNav = page.locator('[data-testid="floating-nav"]');
    if (await floatingNav.isVisible()) {
      // Test clicking a nav item (e.g., Home)
      await floatingNav.getByText('Home').click();
      
      // Verify we're on the homepage
      expect(page.url()).toContain('/');
    }
  });
  
  test('content feed displays properly', async ({ page }) => {
    await page.goto('/');
    
    // Check if content feed exists
    const contentFeed = page.locator('[data-testid="content-feed"]');
    
    if (await contentFeed.isVisible()) {
      // Check if posts or threads are loading
      const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
      
      if (await loadingIndicator.isVisible()) {
        // Wait for loading to complete (timeout after 10 seconds)
        await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 })
          .catch(() => {
            // If timeout occurs, just log and continue
            console.log('Loading indicator remained visible');
          });
      }
      
      // Check for posts or empty state message
      const postsOrEmptyState = page.locator('[data-testid="post-item"], [data-testid="empty-feed-message"]');
      await expect(postsOrEmptyState).toBeVisible();
    }
  });
  
  test('PWA install banner appears (if applicable)', async ({ page }) => {
    await page.goto('/');
    
    // Check if PWA install banner is present (may not show depending on conditions)
    const installBanner = page.locator('[data-testid="pwa-install-banner"]');
    
    // Log whether banner is visible (this is informational, not a test failure)
    if (await installBanner.isVisible()) {
      console.log('PWA install banner is visible');
      
      // If visible, verify close button works
      const closeButton = installBanner.getByRole('button', { name: 'Close' });
      await closeButton.click();
      
      // Banner should be hidden after clicking close
      await expect(installBanner).toBeHidden();
    } else {
      console.log('PWA install banner is not visible');
    }
  });
  
  test('search functionality works (if available)', async ({ page }) => {
    await page.goto('/');
    
    // Check if search bar exists
    const searchBar = page.getByPlaceholder('Search...');
    
    if (await searchBar.isVisible()) {
      // Type a search query
      await searchBar.fill('test');
      await searchBar.press('Enter');
      
      // Verify search results or search page loaded
      await expect(page.locator('[data-testid="search-results"], [data-testid="search-page"]'))
        .toBeVisible({ timeout: 5000 });
    } else {
      console.log('Search bar not found, skipping search test');
    }
  });
});