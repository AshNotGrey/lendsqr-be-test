/**
 * Test Script for Railway Database
 * 
 * This script performs CRUD operations to test the Railway MySQL database connection.
 * It creates users, funds wallets, transfers money, and withdraws funds.
 * 
 * Run with: npx ts-node scripts/test-railway-db.ts
 */

import { AuthService } from "../src/services/auth.service";
import { WalletService } from "../src/services/wallet.service";
import { UserService } from "../src/services/user.service";
import { knex, closeConnection } from "../src/db";

/**
 * Main test function
 */
async function runTests(): Promise<void> {
  try {
    console.log("\n🚀 Starting Railway Database CRUD Tests\n");

    // Test 1: Create Users
    console.log("📝 Test 1: Creating users...");
    // Use timestamp + random to ensure unique emails/phones for each run
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const uniqueId = `${timestamp}-${random}`;
    
    const user1Data = {
      name: "John Doe",
      email: `john.doe.${uniqueId}@example.com`,
      phone: `+234701234${random.toString().padStart(4, '0')}`,
      bvn: "22212345678",
    };

    const user2Data = {
      name: "Jane Smith",
      email: `jane.smith.${uniqueId}@example.com`,
      phone: `+234702345${random.toString().padStart(4, '0')}`,
      bvn: "22223456789",
    };

    const user1Result = await AuthService.createUser(user1Data);
    const user2Result = await AuthService.createUser(user2Data);

    console.log(`✅ User 1 created: ${user1Result.user.name} (ID: ${user1Result.user.id})`);
    console.log(`✅ User 2 created: ${user2Result.user.name} (ID: ${user2Result.user.id})`);

    const userId1 = user1Result.user.id;
    const userId2 = user2Result.user.id;

    // Test 2: Get User Wallets
    console.log("\n💰 Test 2: Fetching wallet balances...");
    const balance1 = await WalletService.getBalance(userId1);
    const balance2 = await WalletService.getBalance(userId2);

    console.log(`✅ Wallet 1 Balance: NGN ${balance1.balance}`);
    console.log(`✅ Wallet 2 Balance: NGN ${balance2.balance}`);

    // Test 3: Fund Wallets
    console.log("\n💵 Test 3: Funding wallets...");
    const fundAmount1 = 5000.00;
    const fundAmount2 = 3000.00;

    await WalletService.fund(userId1, fundAmount1, { description: "Initial funding" });
    await WalletService.fund(userId2, fundAmount2, { description: "Initial funding" });

    const balance1AfterFund = await WalletService.getBalance(userId1);
    const balance2AfterFund = await WalletService.getBalance(userId2);

    console.log(`✅ Wallet 1 funded: NGN ${fundAmount1}`);
    console.log(`   New balance: NGN ${balance1AfterFund.balance}`);
    console.log(`✅ Wallet 2 funded: NGN ${fundAmount2}`);
    console.log(`   New balance: NGN ${balance2AfterFund.balance}`);

    // Test 4: Transfer Between Users
    console.log("\n🔄 Test 4: Transferring funds between users...");
    const transferAmount = 1500.00;

    await WalletService.transfer(
      userId1,
      userId2,
      transferAmount,
      { description: "Test transfer" }
    );

    const balance1AfterTransfer = await WalletService.getBalance(userId1);
    const balance2AfterTransfer = await WalletService.getBalance(userId2);

    console.log(`✅ Transferred NGN ${transferAmount} from User 1 to User 2`);
    console.log(`   Wallet 1 balance: NGN ${balance1AfterTransfer.balance}`);
    console.log(`   Wallet 2 balance: NGN ${balance2AfterTransfer.balance}`);

    // Test 5: Withdraw Funds
    console.log("\n💸 Test 5: Withdrawing funds...");
    const withdrawAmount = 500.00;

    await WalletService.withdraw(userId1, withdrawAmount, { description: "Test withdrawal" });

    const balance1AfterWithdraw = await WalletService.getBalance(userId1);
    console.log(`✅ Withdrew NGN ${withdrawAmount} from Wallet 1`);
    console.log(`   New balance: NGN ${balance1AfterWithdraw.balance}`);

    // Test 6: Query Transactions
    console.log("\n📊 Test 6: Querying transaction history...");
    const transactions1 = await WalletService.getTransactionHistory(userId1, 10);
    const transactions2 = await WalletService.getTransactionHistory(userId2, 10);

    console.log(`✅ User 1 has ${transactions1.length} transactions:`);
    transactions1.forEach((tx, idx) => {
      console.log(
        `   ${idx + 1}. ${tx.type} - NGN ${tx.amount_decimal} (Ref: ${tx.reference})`
      );
    });

    console.log(`✅ User 2 has ${transactions2.length} transactions:`);
    transactions2.forEach((tx, idx) => {
      console.log(
        `   ${idx + 1}. ${tx.type} - NGN ${tx.amount_decimal} (Ref: ${tx.reference})`
      );
    });

    // Test 7: Query All Tables
    console.log("\n📋 Test 7: Querying all tables...");
    const users = await knex("users").select("*");
    const wallets = await knex("wallets").select("*");
    const transactions = await knex("transactions").select("*");
    const transfers = await knex("transfers").select("*");

    console.log(`✅ Users table: ${users.length} records`);
    console.log(`✅ Wallets table: ${wallets.length} records`);
    console.log(`✅ Transactions table: ${transactions.length} records`);
    console.log(`✅ Transfers table: ${transfers.length} records`);

    // Test 8: Get User by Email
    console.log("\n🔍 Test 8: Querying user by email...");
    const foundUser = await UserService.getUserByEmail(user1Data.email);
    if (foundUser) {
      console.log(`✅ Found user: ${foundUser.name} (${foundUser.email})`);
    }

    console.log("\n✅ All tests completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Users created: 2`);
    console.log(`   - Wallets funded: 2`);
    console.log(`   - Transfers completed: 1`);
    console.log(`   - Withdrawals completed: 1`);
    console.log(`   - Total transactions: ${transactions.length}`);
    console.log("\n💡 Check your Railway dashboard to see the data!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  } finally {
    await closeConnection();
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

