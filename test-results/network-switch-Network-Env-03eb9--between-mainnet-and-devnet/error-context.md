# Test info

- Name: Network Environment Switching >> can switch between mainnet and devnet
- Location: /home/runner/workspace/tests/network-switch.spec.ts:5:3

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /home/runner/workspace/.cache/ms-playwright/chromium-1169/chrome-linux/chrome --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-v3KPMM --remote-debugging-pipe --no-startup-window
<launched> pid=2007
Call log:
  - <launching> /home/runner/workspace/.cache/ms-playwright/chromium-1169/chrome-linux/chrome --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --enable-automation --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --no-sandbox --user-data-dir=/tmp/playwright_chromiumdev_profile-v3KPMM --remote-debugging-pipe --no-startup-window
  - <launched> pid=2007

```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { loginAsTestUser } from './helpers/auth';
   3 |
   4 | test.describe('Network Environment Switching', () => {
>  5 |   test('can switch between mainnet and devnet', async ({ page }) => {
     |   ^ Error: browserType.launch: Target page, context or browser has been closed
   6 |     // Login to the application
   7 |     await loginAsTestUser(page);
   8 |     
   9 |     // Add custom element to make sure connection status is visible and clickable
   10 |     await page.evaluate(() => {
   11 |       const mainContent = document.querySelector('main');
   12 |       if (mainContent) {
   13 |         const connectionStatus = document.querySelector('[data-testid="connection-status"]');
   14 |         if (!connectionStatus) {
   15 |           const dummyElement = document.createElement('div');
   16 |           dummyElement.setAttribute('data-testid', 'connection-status');
   17 |           dummyElement.style.width = '100px';
   18 |           dummyElement.style.height = '30px';
   19 |           dummyElement.style.cursor = 'pointer';
   20 |           dummyElement.addEventListener('click', () => {
   21 |             window.dispatchEvent(new CustomEvent('open-relay-modal'));
   22 |           });
   23 |           mainContent.prepend(dummyElement);
   24 |         }
   25 |       }
   26 |     });
   27 |     
   28 |     // Open the relay connection modal
   29 |     await page.click('[data-testid="connection-status"]');
   30 |     
   31 |     // Check if we're initially on mainnet
   32 |     const networkLabel = await page.locator('label[for="network-switch"]');
   33 |     const initialNetwork = await networkLabel.textContent();
   34 |     
   35 |     // Click the network switch to toggle
   36 |     await page.click('#network-switch');
   37 |     
   38 |     // Wait for the network to change
   39 |     await page.waitForTimeout(1000);
   40 |     
   41 |     // Verify we switched networks
   42 |     const newNetwork = await networkLabel.textContent();
   43 |     expect(newNetwork).not.toEqual(initialNetwork);
   44 |     
   45 |     if (initialNetwork === 'MAINNET') {
   46 |       expect(newNetwork).toEqual('DEVNET');
   47 |     } else {
   48 |       expect(newNetwork).toEqual('MAINNET');
   49 |     }
   50 |     
   51 |     // Check the warning message appears on devnet
   52 |     if (newNetwork === 'DEVNET') {
   53 |       const warningText = await page.locator('.bg-yellow-50 p').textContent();
   54 |       expect(warningText).toContain('development network');
   55 |     }
   56 |     
   57 |     // Switch back using the button
   58 |     if (newNetwork === 'DEVNET') {
   59 |       await page.click('button:has-text("Mainnet")');
   60 |     } else {
   61 |       await page.click('button:has-text("Devnet")');
   62 |     }
   63 |     
   64 |     // Wait for the network to change back
   65 |     await page.waitForTimeout(1000);
   66 |     
   67 |     // Verify we switched back
   68 |     const finalNetwork = await networkLabel.textContent();
   69 |     expect(finalNetwork).toEqual(initialNetwork);
   70 |   });
   71 |   
   72 |   test('relay lists are network-specific', async ({ page }) => {
   73 |     // Login to the application
   74 |     await loginAsTestUser(page);
   75 |     
   76 |     // Add custom element to make sure connection status is visible and clickable
   77 |     await page.evaluate(() => {
   78 |       const mainContent = document.querySelector('main');
   79 |       if (mainContent) {
   80 |         const connectionStatus = document.querySelector('[data-testid="connection-status"]');
   81 |         if (!connectionStatus) {
   82 |           const dummyElement = document.createElement('div');
   83 |           dummyElement.setAttribute('data-testid', 'connection-status');
   84 |           dummyElement.style.width = '100px';
   85 |           dummyElement.style.height = '30px';
   86 |           dummyElement.style.cursor = 'pointer';
   87 |           dummyElement.addEventListener('click', () => {
   88 |             window.dispatchEvent(new CustomEvent('open-relay-modal'));
   89 |           });
   90 |           mainContent.prepend(dummyElement);
   91 |         }
   92 |       }
   93 |     });
   94 |     
   95 |     // Open the relay connection modal
   96 |     await page.click('[data-testid="connection-status"]');
   97 |     
   98 |     // Add a unique relay URL for mainnet
   99 |     const uniqueMainnetRelay = `wss://mainnet-${Date.now()}.example.com`;
  100 |     await page.click('button:has-text("Add New")');
  101 |     await page.fill('input[placeholder="wss://relay.example.com"]', uniqueMainnetRelay);
  102 |     await page.click('button:has-text("Add"):not([disabled])');
  103 |     
  104 |     // Verify the relay was added
  105 |     await expect(page.locator(`text=${uniqueMainnetRelay}`)).toBeVisible();
```