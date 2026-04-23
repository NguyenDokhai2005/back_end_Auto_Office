/**
 * Test Runner for Office Automation Platform
 * 
 * This script provides organized test execution for different test categories:
 * - Unit Tests: Individual component testing
 * - Integration Tests: Component interaction testing  
 * - API Tests: Endpoint testing with various inputs
 * - Performance Tests: Load and performance validation
 */

const { execSync } = require('child_process');

const testCategories = {
  unit: {
    description: 'Unit Tests - Individual component testing',
    patterns: [
      '__tests__/lib/**/*.test.ts',
    ],
    timeout: 10000,
  },
  integration: {
    description: 'Integration Tests - Component interaction testing',
    patterns: [
      '__tests__/integration/**/*.test.ts',
    ],
    timeout: 30000,
  },
  api: {
    description: 'API Tests - Endpoint testing with various inputs',
    patterns: [
      '__tests__/api/**/*.test.ts',
    ],
    timeout: 30000,
  },
  all: {
    description: 'All Tests - Complete test suite',
    patterns: [
      '__tests__/**/*.test.ts',
    ],
    timeout: 60000,
  },
};

function runTests(category = 'unit', options = {}) {
  const config = testCategories[category];
  
  if (!config) {
    console.error(`Unknown test category: ${category}`);
    console.log('Available categories:', Object.keys(testCategories).join(', '));
    process.exit(1);
  }

  console.log(`\n🧪 Running ${config.description}\n`);

  const patterns = config.patterns.join(' ');
  const verbose = options.verbose ? '--verbose' : '';
  const coverage = options.coverage ? '--coverage' : '';
  const watch = options.watch ? '--watch' : '';
  
  const command = `npm test -- --testPathPatterns="${patterns}" ${verbose} ${coverage} ${watch} --testTimeout=${config.timeout}`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ ${config.description} completed successfully\n`);
  } catch (error) {
    console.error(`\n❌ ${config.description} failed\n`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const category = args[0] || 'unit';
const options = {
  verbose: args.includes('--verbose'),
  coverage: args.includes('--coverage'),
  watch: args.includes('--watch'),
};

runTests(category, options);