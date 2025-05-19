// scripts/create_test_admin.js
const adminModel = require('../backend/lib/models/adminModel');
const { db, closeSyncConnection } = require('../backend/lib/db/database'); // Ensure db is initialized

async function createTestAdmin() {
  const testAdminUsername = 'testadmin@example.com';
  const testAdminPassword = 'TestAdmin123!'; // The model will hash this

  // Ensure DB is initialized before trying to use it.
  if (!db || !db.open) {
    console.error('Database connection is not open. Ensure the main app has initialized it or initialize here.');
  }

  try {
    console.log(`Attempting to create test admin user: ${testAdminUsername}`);
    // Check if user already exists to provide a clearer message
    const existingAdmin = await adminModel.getAdminByUsername(testAdminUsername);
    if (existingAdmin) {
      console.log(`Admin user "${testAdminUsername}" already exists with ID: ${existingAdmin.id}.`);
      console.log('Test admin already exists, proceeding with the existing user.');
    } else {
      const createdAdmin = await adminModel.createAdmin({
        username: testAdminUsername,
        password: testAdminPassword,
      });
      console.log('Test admin user created successfully:');
      console.log(`  ID: ${createdAdmin.id}`);
      console.log(`  Username: ${createdAdmin.username}`);
      console.log(`  Role: ${createdAdmin.role}`);
      console.log('\nPassword was set to: TestAdmin123!');
      console.log('Please use these credentials for testing the system.');
    }

    // Write the credentials to a file for reference
    const fs = require('fs');
    const credentialsData = {
      username: testAdminUsername,
      password: testAdminPassword
    };
    fs.writeFileSync('../admin_credentials.json', JSON.stringify(credentialsData, null, 2));
    console.log('Credentials saved to admin_credentials.json for future reference.');

  } catch (error) {
    console.error('Error creating test admin user:');
    console.error(`  Message: ${error.message}`);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.error(`  Detail: The username "${testAdminUsername}" likely already exists.`);
    } else {
        console.error(`  Stack: ${error.stack}`);
    }
  } finally {
    // Only close if this script exclusively opened it.
    // If sharing a connection from a running server, don't close.
    if (db && db.open) {
        console.log('Closing database connection.');
        closeSyncConnection();
    }
  }
}

createTestAdmin();
