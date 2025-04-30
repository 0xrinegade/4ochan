import { Page } from '@playwright/test';

// Helper functions for interacting with user profiles

// Navigate to a user profile
export async function navigateToProfile(page: Page, userId: string) {
  await page.goto(`/profile/${userId}`);
  
  // Wait for profile to load
  await page.waitForSelector('[data-testid="user-profile"]');
}

// Edit user profile
export async function editProfile(page: Page, profileData: {
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
}) {
  // Assume we're already on profile page
  await page.getByRole('button', { name: 'Edit Profile' }).click();
  
  // Fill in profile form
  if (profileData.displayName) {
    await page.getByLabel('Display Name').fill(profileData.displayName);
  }
  
  if (profileData.bio) {
    await page.getByLabel('Bio').fill(profileData.bio);
  }
  
  if (profileData.location) {
    await page.getByLabel('Location').fill(profileData.location);
  }
  
  if (profileData.website) {
    await page.getByLabel('Website').fill(profileData.website);
  }
  
  // Save changes
  await page.getByRole('button', { name: 'Save Changes' }).click();
  
  // Wait for success message
  await page.waitForSelector('text="Profile updated successfully"', { timeout: 5000 });
}

// Follow a user
export async function followUser(page: Page, userId: string) {
  await navigateToProfile(page, userId);
  
  // Click follow button
  await page.getByRole('button', { name: 'Follow' }).click();
  
  // Wait for button to change to "Following"
  await page.waitForSelector('button:has-text("Following")');
}

// Unfollow a user
export async function unfollowUser(page: Page, userId: string) {
  await navigateToProfile(page, userId);
  
  // First ensure we're following, then unfollow
  const followingButton = page.getByRole('button', { name: 'Following' });
  
  if (await followingButton.isVisible()) {
    await followingButton.click();
    
    // Confirm unfollow (if there's a confirmation dialog)
    const confirmButton = page.getByRole('button', { name: 'Unfollow' });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Wait for button to change back to "Follow"
    await page.waitForSelector('button:has-text("Follow")');
  }
}

// Check if badges are visible on profile
export async function checkProfileBadges(page: Page) {
  return await page.locator('[data-testid="user-badges"]').isVisible();
}

// Check user's reputation score
export async function getReputationScore(page: Page) {
  const reputationText = await page.locator('[data-testid="reputation-score"]').textContent();
  return reputationText ? parseInt(reputationText.replace(/\D/g, '')) : 0;
}