#!/usr/bin/env ts-node

/**
 * Test runner utility for the Nostr application
 * 
 * This script provides a simple way to run e2e tests with different configurations:
 * - Run all tests
 * - Run a specific test file
 * - Run tests in headed mode (visible browser)
 * - Generate a detailed HTML report
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const isHeaded = args.includes('--headed');
const generateReport = args.includes('--report');
const debug = args.includes('--debug');

// Get test file if specified
let testFile = args.find(arg => arg.endsWith('.spec.ts'));
const testPath = testFile ? path.resolve(testFile) : undefined;

// Prepare command
let command = 'npx playwright test';

// Add test path if specified
if (testPath) {
  command += ` ${testPath}`;
}

// Add headed mode if requested
if (isHeaded) {
  command += ' --headed';
}

// Add debug mode if requested
if (debug) {
  command += ' --debug';
}

// Add report options
if (generateReport) {
  // Ensure reports directory exists
  const reportsDir = path.resolve('playwright-report');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  
  command += ' --reporter=html';
}

// Show command being executed
console.log(`Executing: ${command}`);

try {
  // Run the command
  execSync(command, { stdio: 'inherit' });
  
  if (generateReport) {
    console.log('\nTest report generated in playwright-report directory');
    console.log('To view the report, run: npx playwright show-report\n');
  }
} catch (error) {
  // Tests failed, but we still want to show the report path if generated
  if (generateReport) {
    console.log('\nSome tests failed. Report generated in playwright-report directory');
    console.log('To view the report, run: npx playwright show-report\n');
  }
  
  process.exit(1);
}