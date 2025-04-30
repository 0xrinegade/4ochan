# E2E Testing with Playwright

This directory contains end-to-end tests for the decentralized communication platform using Playwright.

## Test Structure

- **Helper files**: Reusable functions for common test operations
  - `auth.ts`: Authentication helpers
  - `nostr.ts`: Nostr-related operations
  - `profile.ts`: User profile interactions

- **Test suites**:
  - `home.spec.ts`: Homepage and basic navigation tests
  - `auth.spec.ts`: User authentication tests
  - `threads.spec.ts`: Thread and post functionality
  - `profiles.spec.ts`: User profile tests
  - `pwa.spec.ts`: Progressive Web App features
  - `token-analysis.spec.ts`: Cryptocurrency token analysis features
  - `ai-features.spec.ts`: AI integration tests
  - `accessibility.spec.ts`: Accessibility and user settings tests

## Running Tests

### Prerequisites

Before running the tests, make sure you have:

1. Node.js and npm installed
2. Installed the project dependencies with `npm install`
3. Installed Playwright browser dependencies with `npx playwright install`

### Running All Tests

```bash
npx playwright test
```

### Running a Specific Test File

```bash
npx playwright test tests/home.spec.ts
```

### Running Tests with UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Running Tests with Visible Browser

```bash
npx playwright test --headed
```

### Using the Test Runner Script

We've included a convenient test runner script that provides additional options:

```bash
# Run all tests and generate an HTML report
ts-node tests/run-tests.ts --report

# Run a specific test file in headed mode
ts-node tests/run-tests.ts tests/home.spec.ts --headed

# Run tests in debug mode
ts-node tests/run-tests.ts --debug
```

### Viewing Test Reports

After running tests with the `--report` flag:

```bash
npx playwright show-report
```

## Test Design Principles

1. **Resilient to UI changes**: Tests use data-testid attributes where possible
2. **Graceful fallbacks**: Tests handle both positive and negative cases
3. **Isolated tests**: Each test is independent and doesn't rely on other tests
4. **Comprehensive coverage**: Tests cover all major user flows

## Adding New Tests

When adding new tests:

1. Use existing helper functions when appropriate
2. Create new helper functions for reusable operations
3. Follow the existing structure of test files
4. Add clear test descriptions using `test('description', async...)` syntax
5. Include proper assertions with `expect()`

## Troubleshooting

- **Tests failing inconsistently**: May indicate race conditions or timing issues
- **Element not found errors**: Check if the UI has changed or if selectors need updating
- **Authentication failures**: Verify the auth helpers are working with current implementation