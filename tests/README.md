# Lendsqr Wallet Backend - Tests

This directory contains unit and integration tests for the Lendsqr Wallet Backend service.

## Test Structure

```
tests/
├── setup.ts              # Global test setup
├── unit/                 # Unit tests
│   ├── token.test.ts
│   └── adjutor.service.test.ts
├── integration/          # Integration tests (require DB)
│   └── ...
└── README.md            # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Database Setup

Integration tests require a MySQL test database. 

### Create Test Database

```sql
CREATE DATABASE lendsqr_wallet_test;
```

### Run Migrations

```bash
NODE_ENV=test npm run migrate
```

## Test Environment Variables

Tests use mock mode for Adjutor API by default. See `tests/setup.ts` for configuration.

## Writing Tests

### Unit Tests

Unit tests should:
- Test individual functions/methods
- Mock external dependencies
- Run quickly (<100ms per test)
- Not require database or external services

### Integration Tests

Integration tests should:
- Test complete flows
- Use actual database (test environment)
- Test API endpoints end-to-end
- Clean up after themselves

## Coverage Goals

- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

## Key Testing Patterns

### Testing Services
```typescript
import { AdjutorService } from "../../src/services/adjutor.service";

describe("AdjutorService", () => {
  it("should check karma", async () => {
    const result = await AdjutorService.checkKarma("22212345678", "bvn");
    expect(result.isFlagged).toBe(false);
  });
});
```

### Testing Controllers
```typescript
import request from "supertest";
import app from "../../src/app";

describe("Auth Controller", () => {
  it("should create a user", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send({ name: "Test", email: "[email protected]", phone: "+2347012345678", bvn: "22212345678" });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Testing Transaction Safety
```typescript
describe("WalletService - Concurrent Operations", () => {
  it("should handle concurrent transfers correctly", async () => {
    // Create two concurrent transfers
    const transfer1 = WalletService.transfer(userId1, userId2, 100, "ref1");
    const transfer2 = WalletService.transfer(userId1, userId2, 100, "ref2");
    
    await Promise.all([transfer1, transfer2]);
    
    // Verify final balances are correct
    const balance = await WalletService.getBalance(userId1);
    expect(parseFloat(balance.balance)).toBe(800); // Started with 1000, sent 200 total
  });
});
```

## CI/CD Integration

Tests run automatically on:
- Every pull request
- Before deployment
- On main branch commits

## Troubleshooting

### Database Connection Errors
- Ensure MySQL is running
- Check DATABASE_URL in tests/setup.ts
- Verify test database exists

### Timeout Errors
- Increase testTimeout in vitest.config.ts
- Check for hanging promises

### Mock Mode Issues
- Ensure ADJUTOR_MODE=mock in test environment
- Check mock response generation logic