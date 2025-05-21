// scripts/create_custom_admin.js
const adminModel = require('../backend/lib/models/adminModel');
const { db, closeSyncConnection } = require('../backend/lib/db/database'); // Ensure db is initialized

async function createNewAdmin() {
  const newAdminUsername = 'bernardopgomes@hotmail.com';
  const newAdminPassword = 'P@$$wOrd123!'; // The model will hash this

  // Ensure DB is initialized before trying to use it.
  // This is a simplified check; in a real script, you might need more robust DB setup if run completely standalone.
  if (!db || !db.open) {
    console.error(
      'Database connection is not open. Ensure the main app has initialized it or initialize here.'
    );
    // Attempt to initialize (basic version, might need more from server.js if complex setup)
    // This is a bit of a hack for a standalone script. Ideally, DB init is handled centrally.
    // For now, we assume the DB connection established by requiring database.js is sufficient if the main app isn't running.
    // If this script is run while the main server IS running, it shares the connection.
    // If run standalone, it establishes its own.
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
      });
      console.log('Admin user created successfully:');
      console.log(`  ID: ${createdAdmin.id}`);
      console.log(`  Username: ${createdAdmin.username}`);
      console.log(`  Role: ${createdAdmin.role}`);
      console.log('\nPassword was set to: P@$$wOrd123!');
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
    // For simplicity in a standalone script, we'll close.
    // If you run this while the main server is also running, this might cause issues for the server.
    // Best to run this script when the main backend server is stopped.
    if (db && db.open) {
      console.log('Closing database connection.');
      closeSyncConnection();
    }
  }
}

createNewAdmin();
