// scripts/initialize_admin.js
const adminModel = require('../backend/lib/models/adminModel');
const {
  db,
  runAsync,
  closeSyncConnection,
} = require('../backend/lib/db/database'); // Ensure db is initialized, added runAsync
const bcrypt = require('bcrypt'); // Added bcrypt for password hashing

// Function to parse command line arguments
function getArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (key && value) {
        args[key] = value;
      } else if (key) {
        // Handle boolean flags if needed in the future, or flags without explicit value
        const nextArg = process.argv[process.argv.indexOf(arg) + 1];
        if (nextArg && !nextArg.startsWith('--')) {
          args[key] = nextArg; // Assign next segment as value
        } else {
          args[key] = true; // Or treat as a boolean flag
        }
      }
    }
  });
  return args;
}

async function initializeAdmin() {
  const args = getArgs();
  const newAdminUsername = args.username;
  const newAdminPassword = args.password;

  if (!newAdminUsername || !newAdminPassword) {
    console.error('Error: Missing --username or --password argument.');
    console.log(
      'Usage: node scripts/initialize_admin.js --username <username> --password <password>'
    );
    return;
  }

  // Ensure DB is initialized before trying to use it.
  if (!db || !db.open) {
    console.error(
      'Database connection is not open. Ensure the main app has initialized it or initialize here.'
    );
    // Attempt to initialize if not open - this might be specific to your setup
    // For now, we assume it should be open or the main app handles it.
    // If you have a specific db init script for CLI, you might call it here.
    // e.g. require('../backend/lib/db/db-init').init();
    // This is a placeholder, adjust based on your project's DB initialization for scripts.
  }

  try {
    console.log(`Attempting to create admin user: ${newAdminUsername}`);
    const existingAdmin = await adminModel.getAdminByUsername(newAdminUsername);
    if (existingAdmin) {
      console.log(
        `Admin user "${newAdminUsername}" (ID: ${existingAdmin.id}) already exists. Updating password.`
      );
      const saltRounds = 10; // Same as in adminModel
      const hashedPassword = await bcrypt.hash(newAdminPassword, saltRounds);
      const sql = 'UPDATE users SET hashedPassword = ? WHERE id = ?';
      await runAsync(sql, [hashedPassword, existingAdmin.id]);
      console.log(
        `Password for admin user "${newAdminUsername}" has been updated.`
      );
      // Log action if audit logging is desired here, similar to adminModel
    } else {
      const createdAdmin = await adminModel.createAdmin({
        username: newAdminUsername,
        password: newAdminPassword, // The model will hash this
        role: 'super_admin', // Default role, can be parameterized if needed
        permissions: ['all'], // Default permissions
      });
      console.log('Admin user created successfully:');
      console.log(`  ID: ${createdAdmin.id}`);
      console.log(`  Username: ${createdAdmin.username}`);
      console.log(`  Role: ${createdAdmin.role}`);
      console.log(
        `\nPassword was set to: ${newAdminPassword} (this will be hashed)`
      );
      console.log(
        'Please ensure this password is secure and managed appropriately.'
      );
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
    if (db && db.open) {
      console.log('Closing database connection.');
      closeSyncConnection();
    }
  }
}

initializeAdmin();
