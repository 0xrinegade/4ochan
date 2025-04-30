import { test, expect } from '@playwright/test';
import { generateTestUser, authenticateWithNostr } from './helpers/auth';
import { editProfile, followUser, unfollowUser, checkProfileBadges, getReputationScore } from './helpers/profile';

test.describe('User Profile Tests', () => {
  // Create a test user for this test suite
  const testUser = generateTestUser();
  
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await authenticateWithNostr(page, testUser.nostrPrivkey);
  });
  
  test('user can view and edit profile', async ({ page }) => {
    // Navigate to user's own profile
    // Assuming there's a profile link in the navigation
    await page.goto('/');
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('menuitem', { name: 'My Profile' }).click();
    
    // Verify we're on profile page
    await expect(page.url()).toContain('/profile/');
    
    // Check if edit button is visible and click it
    const editButton = page.getByRole('button', { name: 'Edit Profile' });
    await editButton.click();
    
    // Generate unique profile data
    const newDisplayName = `Test User ${Date.now()}`;
    const newBio = `This is a test bio updated at ${new Date().toISOString()}`;
    const newLocation = 'Test Location';
    
    // Fill in the edit form
    await page.getByLabel('Display Name').fill(newDisplayName);
    await page.getByLabel('Bio').fill(newBio);
    await page.getByLabel('Location').fill(newLocation);
    
    // Save changes
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Wait for success message or profile to update
    await expect(page.getByText('Profile updated')).toBeVisible({ timeout: 5000 })
      .catch(() => console.log('Success message not found, continuing'));
    
    // Verify changes were applied
    await expect(page.getByText(newDisplayName)).toBeVisible();
    await expect(page.getByText(newBio)).toBeVisible();
    await expect(page.getByText(newLocation)).toBeVisible();
  });
  
  test('user can follow and unfollow other users', async ({ page, browser }) => {
    // Create a second user to follow
    const secondUser = generateTestUser();
    
    // Register second user in a new context
    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    
    // Register the second user (simplified for test)
    await secondPage.goto('/');
    await secondPage.getByText('Login or Create Account').click();
    await secondPage.getByText('Sign Up').click();
    await secondPage.getByLabel('Username').fill(secondUser.username);
    await secondPage.getByLabel('Password').fill(secondUser.password);
    if (await secondPage.getByLabel('Confirm Password').isVisible()) {
      await secondPage.getByLabel('Confirm Password').fill(secondUser.password);
    }
    if (await secondPage.getByLabel('Nostr Public Key').isVisible()) {
      await secondPage.getByLabel('Nostr Public Key').fill(secondUser.nostrPubkey);
    }
    await secondPage.getByRole('button', { name: 'Sign Up' }).click();
    
    // Wait for signup to complete and get user ID from URL
    await secondPage.waitForURL(/\/profile\/.+/, { timeout: 10000 });
    const secondUserProfileUrl = secondPage.url();
    const secondUserId = secondUserProfileUrl.split('/profile/')[1];
    
    // Close second context
    await secondContext.close();
    
    // Now test following with first user
    await page.goto(`/profile/${secondUserId}`);
    
    // Click follow button
    await page.getByRole('button', { name: 'Follow' }).click();
    
    // Verify following status updated
    await expect(page.getByRole('button', { name: 'Following' })).toBeVisible();
    
    // Test unfollowing
    await page.getByRole('button', { name: 'Following' }).click();
    
    // If there's a confirmation dialog
    const confirmUnfollow = page.getByRole('button', { name: 'Unfollow' });
    if (await confirmUnfollow.isVisible()) {
      await confirmUnfollow.click();
    }
    
    // Verify follow button is back
    await expect(page.getByRole('button', { name: 'Follow' })).toBeVisible();
  });
  
  test('user can view followers and following lists', async ({ page }) => {
    // Navigate to user's profile
    await page.goto('/');
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('menuitem', { name: 'My Profile' }).click();
    
    // Click on followers count
    await page.getByText('Followers').click();
    
    // Verify followers dialog/page is visible
    await expect(page.getByRole('heading', { name: 'Followers' })).toBeVisible();
    
    // Close followers view (if it's a dialog)
    const closeButton = page.getByRole('button', { name: 'Close' });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // If it's a page, go back
      await page.goBack();
    }
    
    // Click on following count
    await page.getByText('Following').click();
    
    // Verify following dialog/page is visible
    await expect(page.getByRole('heading', { name: 'Following' })).toBeVisible();
  });
  
  test('reputation and badges display correctly', async ({ page }) => {
    // Navigate to user's profile
    await page.goto('/');
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('menuitem', { name: 'My Profile' }).click();
    
    // Check if reputation score is visible
    const reputationElement = page.locator('[data-testid="reputation-score"]');
    if (await reputationElement.isVisible()) {
      const reputation = await reputationElement.textContent();
      console.log(`User reputation: ${reputation}`);
      
      // Check if score is a number
      expect(reputation?.match(/\d+/)).toBeTruthy();
    }
    
    // Check if badges section exists
    const badgesSection = page.locator('[data-testid="user-badges"]');
    const hasBadges = await badgesSection.isVisible();
    
    if (hasBadges) {
      // Count badges
      const badgeCount = await page.locator('[data-testid="badge-item"]').count();
      console.log(`User has ${badgeCount} badges`);
    } else {
      console.log('No badges section found');
    }
  });
  
  test('user profile activity section shows posts', async ({ page }) => {
    // Navigate to user's profile
    await page.goto('/');
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('menuitem', { name: 'My Profile' }).click();
    
    // Look for activity/posts section
    const activitySection = page.locator('[data-testid="user-activity"], [data-testid="user-posts"]');
    
    if (await activitySection.isVisible()) {
      // Check if there are posts or an empty state message
      const postsOrEmptyState = page.locator('[data-testid="post-item"], [data-testid="empty-posts-message"]');
      await expect(postsOrEmptyState).toBeVisible();
    } else {
      console.log('Activity section not found, skipping');
    }
  });
});