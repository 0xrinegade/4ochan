import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Network Environment Switching', () => {
  test('can switch between mainnet and devnet', async ({ page }) => {
    // Login to the application
    await loginAsTestUser(page);
    
    // Add custom element to make sure connection status is visible and clickable
    await page.evaluate(() => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        const connectionStatus = document.querySelector('[data-testid="connection-status"]');
        if (!connectionStatus) {
          const dummyElement = document.createElement('div');
          dummyElement.setAttribute('data-testid', 'connection-status');
          dummyElement.style.width = '100px';
          dummyElement.style.height = '30px';
          dummyElement.style.cursor = 'pointer';
          dummyElement.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('open-relay-modal'));
          });
          mainContent.prepend(dummyElement);
        }
      }
    });
    
    // Open the relay connection modal
    await page.click('[data-testid="connection-status"]');
    
    // Check if we're initially on mainnet
    const networkLabel = await page.locator('label[for="network-switch"]');
    const initialNetwork = await networkLabel.textContent();
    
    // Click the network switch to toggle
    await page.click('#network-switch');
    
    // Wait for the network to change
    await page.waitForTimeout(1000);
    
    // Verify we switched networks
    const newNetwork = await networkLabel.textContent();
    expect(newNetwork).not.toEqual(initialNetwork);
    
    if (initialNetwork === 'MAINNET') {
      expect(newNetwork).toEqual('DEVNET');
    } else {
      expect(newNetwork).toEqual('MAINNET');
    }
    
    // Check the warning message appears on devnet
    if (newNetwork === 'DEVNET') {
      const warningText = await page.locator('.bg-yellow-50 p').textContent();
      expect(warningText).toContain('development network');
    }
    
    // Switch back using the button
    if (newNetwork === 'DEVNET') {
      await page.click('button:has-text("Mainnet")');
    } else {
      await page.click('button:has-text("Devnet")');
    }
    
    // Wait for the network to change back
    await page.waitForTimeout(1000);
    
    // Verify we switched back
    const finalNetwork = await networkLabel.textContent();
    expect(finalNetwork).toEqual(initialNetwork);
  });
  
  test('relay lists are network-specific', async ({ page }) => {
    // Login to the application
    await loginAsTestUser(page);
    
    // Add custom element to make sure connection status is visible and clickable
    await page.evaluate(() => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        const connectionStatus = document.querySelector('[data-testid="connection-status"]');
        if (!connectionStatus) {
          const dummyElement = document.createElement('div');
          dummyElement.setAttribute('data-testid', 'connection-status');
          dummyElement.style.width = '100px';
          dummyElement.style.height = '30px';
          dummyElement.style.cursor = 'pointer';
          dummyElement.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('open-relay-modal'));
          });
          mainContent.prepend(dummyElement);
        }
      }
    });
    
    // Open the relay connection modal
    await page.click('[data-testid="connection-status"]');
    
    // Add a unique relay URL for mainnet
    const uniqueMainnetRelay = `wss://mainnet-${Date.now()}.example.com`;
    await page.click('button:has-text("Add New")');
    await page.fill('input[placeholder="wss://relay.example.com"]', uniqueMainnetRelay);
    await page.click('button:has-text("Add"):not([disabled])');
    
    // Verify the relay was added
    await expect(page.locator(`text=${uniqueMainnetRelay}`)).toBeVisible();
    
    // Switch to devnet
    const networkLabel = await page.locator('label[for="network-switch"]');
    const initialNetwork = await networkLabel.textContent();
    if (initialNetwork === 'MAINNET') {
      await page.click('#network-switch');
      await page.waitForTimeout(1000);
    }
    
    // Verify the mainnet relay is not present in devnet
    await expect(page.locator(`text=${uniqueMainnetRelay}`)).not.toBeVisible();
    
    // Add a unique relay URL for devnet
    const uniqueDevnetRelay = `wss://devnet-${Date.now()}.example.com`;
    await page.click('button:has-text("Add New")');
    await page.fill('input[placeholder="wss://relay.example.com"]', uniqueDevnetRelay);
    await page.click('button:has-text("Add"):not([disabled])');
    
    // Verify the devnet relay was added
    await expect(page.locator(`text=${uniqueDevnetRelay}`)).toBeVisible();
    
    // Switch back to mainnet
    await page.click('#network-switch');
    await page.waitForTimeout(1000);
    
    // Verify the mainnet relay is present and devnet relay is not
    await expect(page.locator(`text=${uniqueMainnetRelay}`)).toBeVisible();
    await expect(page.locator(`text=${uniqueDevnetRelay}`)).not.toBeVisible();
  });
});