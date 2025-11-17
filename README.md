# Lendsqr Wallet Backend

A production-grade wallet service backend for Demo Credit, built with Node.js, TypeScript, Express.js, and MySQL.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Design Decisions](#design-decisions)
- [Project Structure](#project-structure)

## Overview

Demo Credit is a mobile lending app that requires wallet functionality. This backend service provides:

- User registration with blacklist verification via Lendsqr Adjutor Karma API
- Wallet management (fund, withdraw, transfer)
- Transaction-safe money operations with MySQL row-level locking
- Faux token-based authentication
- Comprehensive transaction logging

## Features

✅ **User Onboarding**
- Signup with Adjutor Karma blacklist check
- BVN validation (not stored, only used for verification)
- Automatic wallet creation
- Blacklisted users are blocked from onboarding

✅ **Wallet Operations**
- Fund wallet (credit)
- Withdraw from wallet (debit with balance validation)
- Transfer between users
- Real-time balance inquiries

✅ **Transaction Safety**
- MySQL ACID transactions
- Row-level locking with `SELECT FOR UPDATE`
- Ordered locking to prevent deadlocks
- Idempotency via unique references
- DECIMAL precision for money values

✅ **Security & Best Practices**
- HMAC-SHA256 signed tokens
- Request validation with Zod
- Centralized error handling
- Comprehensive logging
- Environment-based configuration

## Tech Stack

- **Runtime:** Node.js 20.x LTS
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Database:** MySQL 8.4 LTS
- **ORM:** Knex.js with mysql2 driver
- **Validation:** Zod
- **Testing:** Vitest
- **External API:** Lendsqr Adjutor Karma

## Architecture

### High-Level Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP/JSON
       ▼
┌─────────────────────────────────────┐
│         Express.js API              │
├─────────────────────────────────────┤
│  Routes → Controllers → Services    │
│         ↓                           │
│    Middlewares (Auth, Validation)   │
└──────┬──────────────────┬───────────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│    MySQL     │   │   Adjutor    │
│   Database   │   │     API      │
└──────────────┘   └──────────────┘
```

### Application Layers

1. **Routes Layer** (`src/routes/`)
   - Define API endpoints
   - Apply middleware
   - Map to controllers

2. **Controllers Layer** (`src/controllers/`)
   - Handle HTTP requests/responses
   - Request validation
   - Call business logic services

3. **Services Layer** (`src/services/`)
   - Business logic implementation
   - Database operations
   - External API integration

4. **Middlewares** (`src/middlewares/`)
   - Authentication
   - Request validation
   - Error handling

5. **Database Layer** (`src/db/`)
   - Knex connection
   - Migrations
   - Transaction utilities

### Database Schema (ER Diagram)

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │◄──┐
│ name            │   │
│ email (unique)  │   │
│ phone (unique)  │   │
│ status          │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │
          1:1         │
                      │
┌─────────────────┐   │
│    wallets      │   │
├─────────────────┤   │
│ id (PK)         │   │
│ user_id (FK)    │───┘
│ balance_decimal │
│ currency        │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│  transactions   │
├─────────────────┤
│ id (PK)         │
│ wallet_id (FK)  │
│ type            │
│ amount_decimal  │
│ balance_after   │
│ reference (UQ)  │
│ metadata        │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│   transfers     │
├─────────────────┤
│ id (PK)         │
│ from_wallet_id  │
│ to_wallet_id    │
│ amount_decimal  │
│ status          │
│ reference (UQ)  │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│ adjutor_checks  │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ identity_type   │
│ raw_response    │
│ is_flagged      │
│ checked_at      │
└─────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 20.x LTS
- MySQL 8.4+
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd lendsqr-wallet-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Create MySQL database**

```sql
CREATE DATABASE lendsqr_wallet;
```

5. **Run database migrations**

```bash
npm run migrate
```

6. **Start development server**

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the project root:

```bash
# Application
NODE_ENV=development
PORT=3000

# Database (MySQL)
DATABASE_URL=mysql://username:password@localhost:3306/lendsqr_wallet

# Authentication
HMAC_SECRET=your-secret-key-minimum-32-characters

# Adjutor API
ADJUTOR_BASE_URL=https://adjutor.lendsqr.com
ADJUTOR_API_KEY=your-adjutor-api-key
ADJUTOR_MODE=mock  # Use 'live' for production
ADJUTOR_TIMEOUT=5000

# Logging
LOG_LEVEL=debug
```

### Getting Adjutor API Key

1. Visit [Lendsqr Adjutor Portal](https://app.adjutor.io)
2. Sign up and complete KYC verification
3. Generate an API key from your dashboard
4. Add the key to your `.env` file

## Database Schema

### Tables

#### users
- Stores user identity and account status
- BVN is NOT stored (only used during signup for Adjutor check)

#### wallets
- One wallet per user (one-to-one relationship)
- Uses DECIMAL(20,6) for precise money representation
- Default currency: NGN (Nigerian Naira)

#### transactions
- Immutable transaction ledger
- Records all money movements
- Includes balance snapshot after each transaction

#### transfers
- High-level view of wallet-to-wallet transfers
- Links two transaction records (debit + credit)

#### adjutor_checks
- Audit trail of Karma blacklist verifications
- Stores API responses for compliance

## API Documentation

Base URL: `http://localhost:3000/api/v1`

### Authentication Endpoints

#### POST /auth/signup
Register a new user with Adjutor blacklist check.

**Request:**
```json
{
  "name": "John Doe",
  "email": "[email protected]",
  "phone": "+2347012345678",
  "bvn": "22212345678"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "[email protected]",
      "phone": "+2347012345678",
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "candidate:uuid:nonce:signature"
  }
}
```

#### POST /auth/login
Login with email or phone.

**Request:**
```json
{
  "email": "[email protected]"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "candidate:uuid:nonce:signature"
  }
}
```

### Wallet Endpoints

All wallet endpoints require authentication. Include the token in the Authorization header:
```
Authorization: Bearer candidate:uuid:nonce:signature
```

#### POST /wallets/:userId/fund
Add money to a wallet.

**Request:**
```json
{
  "amount": 10000.50,
  "reference": "FUND-2024-001",
  "metadata": {
    "source": "bank_transfer"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Wallet funded successfully",
  "data": {
    "balance": "10000.500000",
    "currency": "NGN",
    "transaction": {
      "id": "uuid",
      "type": "credit",
      "amount": "10000.500000",
      "balance_after": "10000.500000",
      "reference": "FUND-2024-001",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST /wallets/:userId/withdraw
Withdraw money from a wallet.

**Request:**
```json
{
  "amount": 5000.00,
  "reference": "WITHDRAW-2024-001"
}
```

#### POST /wallets/transfer
Transfer money between wallets.

**Request:**
```json
{
  "fromUserId": "uuid1",
  "toUserId": "uuid2",
  "amount": 1000.00,
  "reference": "TRANSFER-2024-001",
  "metadata": {
    "description": "Payment for services"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "data": {
    "transfer": {
      "id": "uuid",
      "from_wallet_id": "uuid1",
      "to_wallet_id": "uuid2",
      "amount": "1000.000000",
      "status": "completed",
      "reference": "TRANSFER-2024-001"
    },
    "from_balance": "4000.500000",
    "to_balance": "1000.000000"
  }
}
```

#### GET /wallets/:userId/balance
Get wallet balance.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": "10000.500000",
    "currency": "NGN",
    "wallet_id": "uuid"
  }
}
```

### Adjutor Endpoints

#### GET /adjutor/karma/:identityType/:identity
Check Karma blacklist (for testing/debugging).

**Example:**
```
GET /adjutor/karma/bvn/22212345678
```

**Response (200):**
```json
{
  "success": true,
  "message": "Identity is clean",
  "data": {
    "is_flagged": false,
    "identity_type": "bvn",
    "checked_at": "2024-01-01T00:00:00.000Z",
    "raw_response": { ... }
  }
}
```

### Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common error codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (blacklisted user)
- `404` - Not Found
- `409` - Conflict (duplicate reference)
- `500` - Internal Server Error

## Testing

### Run Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Database Setup

```sql
CREATE DATABASE lendsqr_wallet_test;
```

```bash
NODE_ENV=test npm run migrate
```

See `tests/README.md` for detailed testing documentation.

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `HMAC_SECRET` (32+ characters)
- [ ] Set `ADJUTOR_MODE=live`
- [ ] Configure production database
- [ ] Run migrations
- [ ] Set up SSL/TLS
- [ ] Configure logging
- [ ] Set up monitoring

### Render Deployment

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure build settings:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Add environment variables** (see Environment Variables section)

5. **Add MySQL database:**
   - Use Render's managed MySQL or external provider
   - Set `DATABASE_URL` in environment variables

6. **Deploy!**

The service will be available at:
```
https://<your-name>-lendsqr-be-test.onrender.com
```

## Design Decisions

### 1. MySQL with DECIMAL for Money

**Decision:** Use MySQL with DECIMAL(20,6) for all monetary values.

**Rationale:**
- Avoids floating-point precision errors
- Industry standard for financial applications
- 20 digits total, 6 decimal places allows for large amounts with precision

### 2. Row-Level Locking with FOR UPDATE

**Decision:** Use `SELECT ... FOR UPDATE` for wallet operations.

**Rationale:**
- Prevents race conditions in concurrent transactions
- Ensures balance integrity
- MySQL-native pessimistic locking

### 3. Ordered Locking for Transfers

**Decision:** Lock wallets in ascending order by user ID.

**Rationale:**
- Prevents deadlocks in concurrent transfers
- Deterministic locking order
- Database-agnostic approach

### 4. Idempotency via Unique References

**Decision:** Require unique `reference` for all money operations.

**Rationale:**
- Prevents duplicate transactions
- Enables safe retries
- Audit trail compliance

### 5. Immutable Transaction Log

**Decision:** Never update or delete transaction records.

**Rationale:**
- Regulatory compliance
- Complete audit trail
- Forensic analysis capability

### 6. BVN Not Stored

**Decision:** BVN is only used during signup for Adjutor check, never stored.

**Rationale:**
- Privacy compliance
- Data minimization principle
- Reduces security liability

### 7. Faux Token Authentication

**Decision:** HMAC-SHA256 signed tokens with format `candidate:<userId>:<nonce>:<signature>`.

**Rationale:**
- Assessment requirement (faux auth acceptable)
- Still cryptographically secure
- Stateless (no session storage)

### 8. Fail-Open for Adjutor API

**Decision:** If Adjutor API fails, allow signup with warning log.

**Rationale:**
- Availability over strict security
- User experience priority
- Logged for manual review

## Project Structure

```
lendsqr-wallet-backend/
├── src/
│   ├── config/
│   │   └── env.ts                 # Environment configuration
│   ├── db/
│   │   ├── index.ts               # Database connection
│   │   ├── migrations/            # Database migrations
│   │   └── seeds/                 # Seed data
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── wallets.ts
│   │   └── adjutor.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── wallet.controller.ts
│   │   └── adjutor.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── wallet.service.ts
│   │   └── adjutor.service.ts
│   ├── middlewares/
│   │   ├── auth.ts                # Authentication middleware
│   │   ├── error.ts               # Error handler
│   │   └── validator.ts           # Request validation
│   ├── utils/
│   │   ├── token.ts               # Token utilities
│   │   ├── logger.ts              # Logging
│   │   └── validation.ts          # Zod schemas
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # HTTP server
├── tests/
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── setup.ts                   # Test configuration
├── knexfile.ts                    # Knex configuration
├── tsconfig.json                  # TypeScript configuration
├── vitest.config.ts               # Test configuration
├── package.json
├── env.example                    # Environment template
└── README.md
```

## Contributing

This is an assessment project and is not open for contributions.

## License

MIT License - see LICENSE file for details.

## Author

Built for Lendsqr Backend Engineering Assessment

## Contact & Support

For questions or support, contact [careers@lendsqr.com](mailto:careers@lendsqr.com)

---

**Assessment Compliance Checklist:**

✅ Node.js 20.x LTS  
✅ Express.js  
✅ TypeScript  
✅ MySQL 8.4 LTS  
✅ Knex.js ORM  
✅ Faux token authentication  
✅ Adjutor Karma blacklist integration  
✅ Wallet operations (fund, withdraw, transfer)  
✅ Transaction safety with row-level locking  
✅ Unit tests with Vitest  
✅ Clean code with JSDoc comments  
✅ Comprehensive README with ER diagram  
✅ Deployment-ready structure  

**Live Demo:** [Deployment URL will be added after deployment]

**GitHub Repository:** [Repository URL]

