// scripts/create_admin_user.js
const adminModel = require('../backend/lib/models/adminModel');
const { db, closeSyncConnection } = require('../backend/lib/db/database'); // Ensure db is initialized

async function createNewAdmin() {
  const newAdminUsername = 'admin@example.com';
  const newAdminPassword = 'Admin123!'; // The model will hash this

  // Ensure DB is initialized before trying to use it.
  if (!db || !db.open) {
    console.error(
      'Database connection is not open. Ensure the main app has initialized it or initialize here.'
    );
  }

  try {
    console.log(`Attempting to create admin user: ${newAdminUsername}`);
    // Check if user already exists to provide a clearer message
    const existingAdmin = await adminModel.getAdminByUsername(newAdminUsername);
    if (existingAdmin) {
      console.log(
        `Admin user "${newAdminUsername}" already exists with ID: ${existingAdmin.id}.`
      );
      console.log(
        "If you need to change the password, please use the application's change password feature or another script."
      );
    } else {
      const createdAdmin = await adminModel.createAdmin({
        username: newAdminUsername,
        password: newAdminPassword,
        role: 'super_admin', // Ensure highest privileges for testing
        permissions: ['all'], // Grant all permissions
      });
      console.log('Admin user created successfully:');
      console.log(`  ID: ${createdAdmin.id}`);
      console.log(`  Username: ${createdAdmin.username}`);
      console.log(`  Role: ${createdAdmin.role}`);
      console.log('\nPassword was set to: Admin123!');
      console.log('Please change it after your first login for security.');
    }
  } catch (error) {
    console.error('Error creating admin user:');
    console.error(`  Message: ${error.message}`);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.error(
        `  Detail: The username "${newAdminUsername}" likely already exists.`
      );
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

createNewAdmin();
