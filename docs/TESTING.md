# Testing Guide for LASCMMG

## Overview

LASCMMG uses a comprehensive testing strategy with multiple layers of testing to ensure reliability and maintainability.

## Testing Stack

### Backend Testing

- **Vitest**: Fast unit testing framework
- **Supertest**: HTTP assertions for API testing
- **@testing-library/jest-dom**: Custom Jest matchers

### Frontend Testing

- **Vitest**: Unit and integration testing
- **React Testing Library**: Component testing
- **@testing-library/user-event**: User interaction simulation
- **MSW (Mock Service Worker)**: API mocking
- **Cypress**: End-to-end testing

## Test Structure

```text
backend/
  tests/
    unit/              # Unit tests for individual functions
    integration/       # API endpoint tests
    fixtures/          # Test data and mocks
    setup.js          # Test configuration

frontend-react/
  src/
    components/
      __tests__/      # Component tests
    hooks/
      __tests__/      # Custom hook tests
    utils/
      __tests__/      # Utility function tests
  cypress/
    e2e/              # End-to-end tests
    fixtures/         # Test data
```

## Running Tests

### Backend Tests

```bash
# Run all backend tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- bracketUtils.test.js

# Watch mode
npm test -- --watch
```

### Frontend Tests

```bash
cd frontend-react

# Run all tests
npm test

# Run with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Open Cypress
npm run cypress:open
```

## Writing Tests

### Backend Unit Test Example

```javascript
// backend/tests/unit/validationUtils.test.js
const { describe, it, expect } = require('vitest');
const { validatePassword } = require('../../lib/utils/validationUtils');

describe('validationUtils', () => {
  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const result = validatePassword('SecurePass123!');
      expect(result.valid).toBe(true);
    });

    it('should reject short password', () => {
      const result = validatePassword('Short1!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('8 caracteres');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('SecurePass123');
      expect(result.valid).toBe(false);
    });
  });
});
```

### Backend Integration Test Example

```javascript
// backend/tests/integration/auth.test.js
const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const request = require('supertest');
const app = require('../../server');

describe('Authentication API', () => {
  let authToken;

  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'TestPass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      authToken = response.body.token;
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should rate limit after multiple failures', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: 'admin@test.com',
            password: 'Wrong'
          });
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'Wrong'
        })
        .expect(429);
    });
  });
});
```

### Frontend Component Test Example

```javascript
// frontend-react/src/components/__tests__/LoginForm.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../auth/LoginForm';

describe('LoginForm', () => {
  it('renders login form', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!'
      });
    });
  });
});
```

### Frontend Hook Test Example

```javascript
// frontend-react/src/hooks/__tests__/useAuth.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await result.current.login('test@example.com', 'Password123!');

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
```

### E2E Test Example

```javascript
// frontend-react/cypress/e2e/tournament-flow.cy.js
describe('Tournament Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should complete tournament creation flow', () => {
    // Login
    cy.get('[data-testid="login-email"]').type('admin@test.com');
    cy.get('[data-testid="login-password"]').type('Password123!');
    cy.get('[data-testid="login-submit"]').click();

    // Navigate to tournaments
    cy.contains('Torneios').click();
    cy.contains('Novo Torneio').click();

    // Fill form
    cy.get('[name="name"]').type('Campeonato Teste 2025');
    cy.get('[name="description"]').type('Torneio de teste automático');
    cy.get('[name="bracket_type"]').select('single-elimination');
    cy.get('[name="num_players_expected"]').type('8');

    // Submit
    cy.get('[type="submit"]').click();

    // Verify
    cy.contains('Torneio criado com sucesso');
    cy.contains('Campeonato Teste 2025').should('be.visible');
  });
});
```

## Test Coverage Goals

### Backend

- **Unit Tests**: 80%+ coverage for utils, models, middleware
- **Integration Tests**: All API endpoints
- **Security Tests**: Authentication, authorization, validation

### Frontend

- **Component Tests**: All interactive components
- **Hook Tests**: All custom hooks
- **E2E Tests**: Critical user flows

## Testing Best Practices

### General

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **One assertion per test (when possible)**
4. **Setup and teardown properly**
5. **Mock external dependencies**

### Backend

1. **Use test database** (`NODE_ENV=test`)
2. **Clean database between tests**
3. **Test error cases**
4. **Verify security middleware**
5. **Test validation schemas**

### Frontend

1. **Test user interactions**
2. **Mock API calls with MSW**
3. **Test accessibility**
4. **Test loading and error states**
5. **Use semantic queries**

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend-react && npm ci
      - run: npm test -- --coverage

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: cd frontend-react && npm ci
      - run: npm start &
      - run: cd frontend-react && npm run test:e2e:ci
```

## Next Steps

1. **Expand unit test coverage** for existing utilities
2. **Add integration tests** for all API routes
3. **Write component tests** for critical UI components
4. **Create E2E tests** for main user flows
5. **Set up CI/CD** with automated testing
6. **Add performance tests** for slow queries
7. **Implement visual regression testing**

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Documentation](https://docs.cypress.io/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Last Updated**: October 2025
