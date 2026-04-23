# Office Automation Platform - Test Suite

This directory contains comprehensive tests for the Office Automation Platform backend, implementing Task 12 requirements.

## Test Structure

### 📁 Unit Tests (`/lib/`)
Individual component testing focusing on isolated functionality:

- **AI Adapters** (`/lib/ai/`)
  - `adapter.test.ts` - AI provider factory tests
  - `gemini.test.ts` - Gemini API adapter unit tests
  - `gemini.integration.test.ts` - Gemini API integration tests (requires real API key)
  - `groq.test.ts` - Groq API adapter unit tests
  - `openai.test.ts` - OpenAI API adapter unit tests

- **Utilities** (`/lib/utils/`)
  - `errors.test.ts` - Error handling and validation utilities
  - `validation.test.ts` - Input validation functions
  - `response.test.ts` - API response formatting utilities
  - `rateLimit.test.ts` - Rate limiting logic and functionality

### 📁 Integration Tests (`/integration/`)
Component interaction and workflow testing:

- `auth.test.ts` - Authentication flow integration (signup → login → logout)
- `workflows.test.ts` - Workflow CRUD operations with database
- `ai-chat.test.ts` - AI chat endpoint with rate limiting and validation
- `executions.test.ts` - Execution tracking and lifecycle management
- `rls-policies.test.ts` - Row Level Security policy enforcement

### 📁 API Tests (`/api/`)
Comprehensive endpoint testing with valid and invalid inputs:

- `endpoints.test.ts` - All API endpoints with security and validation testing

## Test Categories

### 🔬 Unit Tests
**Focus**: Individual functions and classes in isolation
**Coverage**: 
- AI adapter functions (Gemini integration priority)
- Rate limiter logic
- Validation utilities
- Error handling
- Response formatting

**Requirements Validated**: 3.1, 3.2

### 🔗 Integration Tests  
**Focus**: Component interactions and workflows
**Coverage**:
- Authentication flow (signup, login, logout)
- Workflow CRUD operations
- AI chat endpoint (Gemini focus)
- Execution tracking
- RLS policies

**Requirements Validated**: 3.1, 4.1, 6.5, 10.1

### 🌐 API Endpoint Tests
**Focus**: Complete endpoint validation
**Coverage**:
- All endpoints with valid inputs
- All endpoints with invalid inputs
- Authentication failures
- Rate limiting
- Error responses
- Security (XSS, SQL injection attempts)

**Requirements Validated**: 3.2, 6.6, 8.4

## Running Tests

### Quick Start
```bash
# Run unit tests
npm test

# Run specific test file
npm test -- --testPathPatterns="validation.test.ts"

# Run with coverage
npm test -- --coverage

# Run with verbose output
npm test -- --verbose
```

### Using Test Runner
```bash
# Run unit tests
node __tests__/test-runner.js unit

# Run integration tests  
node __tests__/test-runner.js integration

# Run API tests
node __tests__/test-runner.js api

# Run all tests
node __tests__/test-runner.js all

# With options
node __tests__/test-runner.js unit --verbose --coverage
```

### Test Categories
- `unit` - Unit tests only
- `integration` - Integration tests only  
- `api` - API endpoint tests only
- `all` - Complete test suite

## Configuration

### Environment Variables
Tests use mocked environment variables by default (see `jest.setup.js`):
```javascript
process.env.GOOGLE_AI_API_KEY = 'test-google-key'
process.env.GROQ_API_KEY = 'test-groq-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
```

### Real API Testing
For integration tests with real APIs, set actual API keys:
```bash
export GOOGLE_AI_API_KEY="your-real-gemini-key"
```

Integration tests will skip real API calls if test keys are detected.

## Test Features

### 🛡️ Security Testing
- SQL injection attempt handling
- XSS input sanitization
- Authentication bypass attempts
- Rate limiting enforcement

### 🔄 Error Scenarios
- Network failures
- Invalid API keys
- Malformed requests
- Database connection issues
- Concurrent operations

### 📊 Performance Testing
- Large data handling
- Concurrent request processing
- Memory usage validation
- Response time verification

### 🔐 Authentication & Authorization
- User isolation (RLS policies)
- Permission validation
- Session management
- Cross-user data protection

## Mocking Strategy

### External Services
- **Supabase**: Mocked database operations with RLS simulation
- **AI APIs**: Mocked responses with realistic data structures
- **Rate Limiter**: Real implementation with test-friendly timeouts

### Test Data
- Realistic workflow structures
- Various user scenarios
- Edge case inputs
- Error conditions

## Coverage Goals

- **Unit Tests**: 80% code coverage
- **Integration Tests**: All critical user flows
- **API Tests**: All endpoints with success/failure scenarios
- **Security Tests**: Common attack vectors

## Continuous Integration

Tests are designed to run in CI environments:
- No external dependencies for unit tests
- Configurable API integration tests
- Deterministic test execution
- Clear pass/fail reporting

## Troubleshooting

### Common Issues

1. **Module Resolution**: Ensure `@/` path mapping is configured
2. **API Keys**: Use test keys for unit tests, real keys for integration
3. **Timeouts**: Increase timeout for slow integration tests
4. **Memory**: Large test suites may need increased Node.js memory

### Debug Mode
```bash
# Run with debug output
DEBUG=* npm test

# Run single test with full output
npm test -- --testPathPatterns="specific.test.ts" --verbose --no-coverage
```

## Contributing

When adding new tests:

1. **Unit Tests**: Test individual functions in isolation
2. **Integration Tests**: Test component interactions
3. **API Tests**: Test complete request/response cycles
4. **Follow Naming**: `*.test.ts` for all test files
5. **Mock External**: Mock all external dependencies
6. **Document**: Add test descriptions and comments

## Test Results

Expected test counts:
- **Unit Tests**: ~60 tests across utilities and adapters
- **Integration Tests**: ~40 tests across workflows and auth
- **API Tests**: ~30 tests across all endpoints
- **Total**: ~130 comprehensive tests

All tests should pass with proper mocking and configuration.