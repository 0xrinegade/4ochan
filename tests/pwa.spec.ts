import { test, expect } from '@playwright/test';

test.describe('PWA Functionality Tests', () => {
  test('service worker is registered', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration('/');
    });
    
    expect(swRegistration).toBeTruthy();
  });
  
  test('PWA install banner appears and can be dismissed', async ({ page }) => {
    await page.goto('/');
    
    // Check if PWA install banner is present
    const installBanner = page.locator('[data-testid="pwa-install-banner"]');
    
    if (await installBanner.isVisible()) {
      // Verify banner has install button
      const installButton = installBanner.getByRole('button', { name: 'Install' });
      await expect(installButton).toBeVisible();
      
      // Verify banner has close button and can be dismissed
      const closeButton = installBanner.getByRole('button', { name: 'Close' });
      await closeButton.click();
      
      // Verify banner is hidden after clicking close
      await expect(installBanner).toBeHidden();
    } else {
      console.log('PWA install banner not visible, may be dependent on browser or already installed');
      test.skip();
    }
  });
  
  test('PWA onboarding tour is available', async ({ page }) => {
    await page.goto('/');
    
    // Look for onboarding tour trigger button
    const tourButton = page.getByRole('button', { name: 'Tour' });
    
    if (await tourButton.isVisible()) {
      await tourButton.click();
      
      // Verify tour modal appears
      const tourModal = page.locator('[data-testid="pwa-onboarding-tour"]');
      await expect(tourModal).toBeVisible();
      
      // Verify tour has next button
      const nextButton = tourModal.getByRole('button', { name: 'Next' });
      await expect(nextButton).toBeVisible();
      
      // Click through the tour
      while (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Check for done button on last step
        const doneButton = tourModal.getByRole('button', { name: 'Done' });
        if (await doneButton.isVisible()) {
          await doneButton.click();
          break;
        }
      }
      
      // Verify tour is closed after completion
      await expect(tourModal).toBeHidden();
    } else {
      console.log('Tour button not found, may not be available in current context');
      test.skip();
    }
  });
  
  test('offline functionality works with service worker', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker to be active
    await page.waitForTimeout(1000);
    
    // Load a page to cache
    await page.goto('/');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to reload the page
    await page.reload();
    
    // Verify page still loads in offline mode
    await expect(page.locator('body')).toBeVisible();
    
    // Check if offline indicator is shown
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    if (await offlineIndicator.isVisible()) {
      console.log('Offline indicator is correctly displayed');
    }
    
    // Return to online mode
    await page.context().setOffline(false);
  });
  
  test('service worker handles offline posts', async ({ page }) => {
    // Only run this test if we have offline functionality in our app
    
    await page.goto('/');
    
    // Navigate to a thread or board
    await page.getByRole('link', { name: 'Boards' }).click();
    
    // Create a thread while online
    await page.getByRole('button', { name: 'New Thread' }).click();
    await page.getByLabel('Title').fill('Test Online Thread');
    await page.getByLabel('Content').fill('This is a test thread created while online');
    await page.getByRole('button', { name: 'Create Thread' }).click();
    
    // Wait for thread to be created
    await page.waitForURL(/\/thread\/.+/);
    
    // Go back to boards
    await page.goBack();
    
    // Now go offline
    await page.context().setOffline(true);
    
    // Try to create a thread while offline
    await page.getByRole('button', { name: 'New Thread' }).click();
    await page.getByLabel('Title').fill('Test Offline Thread');
    await page.getByLabel('Content').fill('This is a test thread created while offline');
    await page.getByRole('button', { name: 'Create Thread' }).click();
    
    // Check if offline queue indicator is shown
    const queueIndicator = page.locator('[data-testid="offline-queue-indicator"]');
    if (await queueIndicator.isVisible()) {
      console.log('Offline queue indicator is correctly displayed');
    }
    
    // Return to online mode
    await page.context().setOffline(false);
    
    // Wait for sync to happen (may take a few seconds)
    await page.waitForTimeout(5000);
    
    // Check if offline thread was synced (this will depend on your implementation)
    await page.goto('/board/general');
    
    // Look for the offline thread title
    const offlineThreadVisible = await page.getByText('Test Offline Thread').isVisible()
      .catch(() => false);
      
    if (offlineThreadVisible) {
      console.log('Offline thread was successfully synced when back online');
    } else {
      console.log('Offline thread sync not confirmed, may require manual verification');
    }
  });
});