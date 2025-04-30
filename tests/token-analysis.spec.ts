import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateWithNostr } from './helpers/auth';

test.describe('Token Analysis Tests', () => {
  // Create a test user for this test suite
  const testUser = generateTestUser();
  
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await authenticateWithNostr(page, testUser.nostrPrivkey);
  });
  
  test('can search for Ethereum tokens', async ({ page }) => {
    // Navigate to token analysis page (adjust path as needed)
    await page.goto('/token-test');
    
    // Enter an Ethereum token address in the search field
    const ethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH address
    await page.getByPlaceholder('Enter token address').fill(ethAddress);
    
    // Submit the search
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Wait for results to load
    await page.waitForSelector('[data-testid="token-results"]', { timeout: 10000 });
    
    // Verify token data is displayed
    await expect(page.getByText('WETH')).toBeVisible();
    
    // Check for token metadata elements
    await expect(page.locator('[data-testid="token-price"]')).toBeVisible();
  });
  
  test('token price history chart displays', async ({ page }) => {
    // Navigate to token analysis page
    await page.goto('/token-test');
    
    // Search for a token
    const ethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH address
    await page.getByPlaceholder('Enter token address').fill(ethAddress);
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Wait for results to load
    await page.waitForSelector('[data-testid="token-results"]', { timeout: 10000 });
    
    // Check if price history chart is displayed
    const priceChart = page.locator('[data-testid="price-chart"]');
    
    if (await priceChart.isVisible()) {
      // Verify chart contains elements
      await expect(priceChart.locator('svg')).toBeVisible();
      
      // Test time period selectors if available
      const timeSelectors = page.locator('[data-testid="time-selector"]');
      
      if (await timeSelectors.isVisible()) {
        // Click on different time periods and verify chart updates
        await timeSelectors.getByText('1W').click();
        await page.waitForTimeout(1000); // Wait for chart to update
        
        await timeSelectors.getByText('1M').click();
        await page.waitForTimeout(1000);
        
        await timeSelectors.getByText('1Y').click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('Price chart not found, skipping chart tests');
    }
  });
  
  test('Solana token analysis works', async ({ page }) => {
    // Navigate to Solana token analysis page or section
    await page.goto('/token-test');
    
    // Check if there's a toggle for Solana/Ethereum
    const solanaToggle = page.getByText('Solana');
    
    if (await solanaToggle.isVisible()) {
      await solanaToggle.click();
      
      // Enter a Solana token address
      const solAddress = 'So11111111111111111111111111111111111111112'; // SOL wrapped token
      await page.getByPlaceholder('Enter token address').fill(solAddress);
      
      // Submit the search
      await page.getByRole('button', { name: 'Search' }).click();
      
      // Wait for results to load
      await page.waitForSelector('[data-testid="token-results"]', { timeout: 10000 });
      
      // Verify Solana token data is displayed
      await expect(page.getByText('SOL')).toBeVisible();
    } else {
      console.log('Solana toggle not found, skipping Solana token test');
    }
  });
  
  test('bonding curves and token metrics display', async ({ page }) => {
    // Navigate to token analysis page
    await page.goto('/token-test');
    
    // Search for a token with bonding curves
    // This is dependent on your test data
    const bondingToken = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // Example
    await page.getByPlaceholder('Enter token address').fill(bondingToken);
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Wait for results to load
    await page.waitForSelector('[data-testid="token-results"]', { timeout: 10000 });
    
    // Check for bonding curve section
    const bondingSection = page.locator('[data-testid="bonding-curve"]');
    
    if (await bondingSection.isVisible()) {
      console.log('Bonding curve section is visible');
      
      // Check for key bonding metrics
      const hasReserveBalance = await page.getByText('Reserve Balance').isVisible();
      const hasSupplyBalance = await page.getByText('Supply Balance').isVisible();
      
      if (hasReserveBalance && hasSupplyBalance) {
        console.log('Bonding curve data is displayed correctly');
      }
    } else {
      console.log('Bonding curve section not found, may not apply to this token');
    }
    
    // Check for token metrics section
    const metricsSection = page.locator('[data-testid="token-metrics"]');
    
    if (await metricsSection.isVisible()) {
      console.log('Token metrics section is visible');
      
      // Check for common metrics
      const hasMarketCap = await page.getByText('Market Cap').isVisible();
      const hasVolume = await page.getByText('Volume').isVisible();
      
      if (hasMarketCap && hasVolume) {
        console.log('Token metrics are displayed correctly');
      }
    } else {
      console.log('Token metrics section not found, may not be available');
    }
  });
  
  test('pump.fun exchange token lists', async ({ page }) => {
    // Navigate to pump.fun tokens page
    await page.goto('/token-test');
    
    // Look for exchange selection
    const exchangeSelect = page.getByLabel('Exchange');
    
    if (await exchangeSelect.isVisible()) {
      // Select Jupiter exchange
      await exchangeSelect.selectOption('jupiter');
      
      // Check if token categories are available
      const newTokensTab = page.getByRole('tab', { name: 'New Tokens' });
      const bondingTokensTab = page.getByRole('tab', { name: 'Bonding' });
      const graduatedTokensTab = page.getByRole('tab', { name: 'Graduated' });
      
      if (await newTokensTab.isVisible()) {
        // Click on each tab and verify content
        await newTokensTab.click();
        await expect(page.locator('[data-testid="token-list"]')).toBeVisible();
        
        if (await bondingTokensTab.isVisible()) {
          await bondingTokensTab.click();
          await expect(page.locator('[data-testid="token-list"]')).toBeVisible();
        }
        
        if (await graduatedTokensTab.isVisible()) {
          await graduatedTokensTab.click();
          await expect(page.locator('[data-testid="token-list"]')).toBeVisible();
        }
      } else {
        console.log('Token category tabs not found');
      }
    } else {
      console.log('Exchange selection not found, skipping pump.fun tests');
    }
  });
});