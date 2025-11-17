/**
 * Test Setup
 * 
 * Global setup for all tests.
 * Runs before all test suites.
 */

// Set test environment
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "mysql://root:password@localhost:3306/lendsqr_wallet_test";
process.env.HMAC_SECRET = "test-secret-key-for-testing-only-minimum-32-chars";
process.env.ADJUTOR_MODE = "mock";
process.env.ADJUTOR_BASE_URL = "https://adjutor.lendsqr.com";
process.env.ADJUTOR_API_KEY = "test-api-key";
process.env.ADJUTOR_TIMEOUT = "5000";
process.env.LOG_LEVEL = "error"; // Reduce noise in tests

