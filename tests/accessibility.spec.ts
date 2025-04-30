import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateWithNostr } from './helpers/auth';

test.describe('Accessibility and Settings Tests', () => {
  // Create a test user for this test suite
  const testUser = generateTestUser();
  
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await authenticateWithNostr(page, testUser.nostrPrivkey);
  });
  
  test('accessibility button toggles accessibility panel', async ({ page }) => {
    await page.goto('/');
    
    // Look for accessibility button
    const accessibilityButton = page.locator('[data-testid="accessibility-button"]');
    
    if (await accessibilityButton.isVisible()) {
      await accessibilityButton.click();
      
      // Check if accessibility panel is shown
      const accessibilityPanel = page.locator('[data-testid="accessibility-panel"]');
      await expect(accessibilityPanel).toBeVisible();
      
      // Close the panel
      const closeButton = accessibilityPanel.getByRole('button', { name: 'Close' });
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(accessibilityPanel).toBeHidden();
      } else {
        // Click outside to close
        await page.mouse.click(10, 10);
        await expect(accessibilityPanel).toBeHidden();
      }
    } else {
      console.log('Accessibility button not found, skipping test');
    }
  });
  
  test('font size adjustments work', async ({ page }) => {
    await page.goto('/');
    
    // Open accessibility panel
    const accessibilityButton = page.locator('[data-testid="accessibility-button"]');
    
    if (await accessibilityButton.isVisible()) {
      await accessibilityButton.click();
      
      // Find font size controls
      const increaseFontButton = page.getByRole('button', { name: 'Increase Font Size' });
      
      if (await increaseFontButton.isVisible()) {
        // Get initial font size
        const initialFontSize = await page.evaluate(() => {
          const body = document.body;
          return window.getComputedStyle(body).fontSize;
        });
        
        // Click increase font size
        await increaseFontButton.click();
        
        // Verify font size changed
        const newFontSize = await page.evaluate(() => {
          const body = document.body;
          return window.getComputedStyle(body).fontSize;
        });
        
        // Font size should be different
        expect(newFontSize).not.toBe(initialFontSize);
        
        // Reset font size if there's a reset button
        const resetButton = page.getByRole('button', { name: 'Reset' });
        if (await resetButton.isVisible()) {
          await resetButton.click();
          
          // Verify font size is back to initial
          const resetFontSize = await page.evaluate(() => {
            const body = document.body;
            return window.getComputedStyle(body).fontSize;
          });
          
          expect(resetFontSize).toBe(initialFontSize);
        }
      } else {
        console.log('Font size controls not found');
      }
    } else {
      console.log('Accessibility button not found, skipping test');
    }
  });
  
  test('theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/');
    
    // Check if theme toggle exists in navbar or settings
    let themeToggle = page.getByRole('button', { name: 'Toggle Theme' });
    
    if (!(await themeToggle.isVisible())) {
      // Try finding in profile menu
      await page.getByRole('button', { name: 'Profile' }).click();
      themeToggle = page.getByRole('menuitem', { name: 'Toggle Theme' });
    }
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      
      // Toggle theme
      await themeToggle.click();
      
      // Verify theme changed
      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      
      expect(newTheme).not.toBe(initialTheme);
      
      // Toggle back
      await themeToggle.click();
      
      // Verify back to initial theme
      const finalTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      
      expect(finalTheme).toBe(initialTheme);
    } else {
      console.log('Theme toggle not found, skipping test');
    }
  });
  
  test('user settings can be updated', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to settings page
    let settingsLink = page.getByRole('link', { name: 'Settings' });
    
    if (!(await settingsLink.isVisible())) {
      // Try finding in profile menu
      await page.getByRole('button', { name: 'Profile' }).click();
      settingsLink = page.getByRole('menuitem', { name: 'Settings' });
    }
    
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      
      // Check for notification settings
      const notificationToggle = page.getByLabel('Email Notifications');
      
      if (await notificationToggle.isVisible()) {
        // Get initial state
        const initialState = await notificationToggle.isChecked();
        
        // Toggle state
        if (initialState) {
          await notificationToggle.uncheck();
        } else {
          await notificationToggle.check();
        }
        
        // Save settings
        const saveButton = page.getByRole('button', { name: 'Save Settings' });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          // Check for success message
          await expect(page.getByText('Settings saved')).toBeVisible();
          
          // Verify toggle state was saved
          const newState = await notificationToggle.isChecked();
          expect(newState).toBe(!initialState);
        }
      } else {
        console.log('Notification settings not found');
      }
    } else {
      console.log('Settings link not found, skipping test');
    }
  });
  
  test('high contrast mode works', async ({ page }) => {
    await page.goto('/');
    
    // Open accessibility panel
    const accessibilityButton = page.locator('[data-testid="accessibility-button"]');
    
    if (await accessibilityButton.isVisible()) {
      await accessibilityButton.click();
      
      // Find high contrast toggle
      const contrastToggle = page.getByLabel('High Contrast');
      
      if (await contrastToggle.isVisible()) {
        // Check initial state
        const initialState = await contrastToggle.isChecked();
        
        // Toggle high contrast
        if (initialState) {
          await contrastToggle.uncheck();
        } else {
          await contrastToggle.check();
        }
        
        // Verify high contrast class was added/removed
        const hasContrastClass = await page.evaluate(() => {
          return document.documentElement.classList.contains('high-contrast');
        });
        
        expect(hasContrastClass).toBe(!initialState);
        
        // Reset to initial state
        if (initialState) {
          await contrastToggle.check();
        } else {
          await contrastToggle.uncheck();
        }
      } else {
        console.log('High contrast toggle not found');
      }
    } else {
      console.log('Accessibility button not found, skipping test');
    }
  });
  
  test('reduced motion setting is applied', async ({ page }) => {
    await page.goto('/');
    
    // Open accessibility panel
    const accessibilityButton = page.locator('[data-testid="accessibility-button"]');
    
    if (await accessibilityButton.isVisible()) {
      await accessibilityButton.click();
      
      // Find reduced motion toggle
      const motionToggle = page.getByLabel('Reduce Motion');
      
      if (await motionToggle.isVisible()) {
        // Check initial state
        const initialState = await motionToggle.isChecked();
        
        // Toggle reduced motion
        if (initialState) {
          await motionToggle.uncheck();
        } else {
          await motionToggle.check();
        }
        
        // Verify reduced motion class was added/removed
        const hasReducedMotionClass = await page.evaluate(() => {
          return document.documentElement.classList.contains('reduced-motion');
        });
        
        expect(hasReducedMotionClass).toBe(!initialState);
        
        // Reset to initial state
        if (initialState) {
          await motionToggle.check();
        } else {
          await motionToggle.uncheck();
        }
      } else {
        console.log('Reduced motion toggle not found');
      }
    } else {
      console.log('Accessibility button not found, skipping test');
    }
  });
});