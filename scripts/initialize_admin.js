// Simple script to initialize the admin user if it doesn't exist.
// Run this manually after setting the real password hash in admin_credentials.json
// and after the database and users table have been created by starting the server once.

const path = require('path');
// const bcrypt = require('bcrypt'); // Not needed here, hash is pre-generated
const { readJsonFile } = require('../lib/fileUtils'); // Assuming fileUtils exists
const db = require('../lib/database'); // Import the promisified functions

const CREDENTIALS_FILE_PATH = path.join(
  __dirname,
  '..',
  'admin_credentials.json'
);
// const SALT_ROUNDS = 10; // Not needed here

async function initializeAdmin() {
  console.log('Checking admin user...');
  let credentials;
  try {
    credentials = await readJsonFile(CREDENTIALS_FILE_PATH);
    if (
      !credentials ||
      !credentials.username ||
      !credentials.hashedPassword ||
      credentials.hashedPassword === 'PLACEHOLDER_BCRYPT_HASH_REPLACE_ME'
    ) {
      console.error(
        'Error: admin_credentials.json is missing, incomplete, or still contains the placeholder hash.'
      );
      console.error(
        'Please create the file, add your desired admin username, generate a bcrypt hash for your password, and replace the placeholder.'
      );
      return; // Stop execution
    }
  } catch (err) {
    console.error('Error reading admin_credentials.json:', err.message);
    return; // Stop execution
  }

  const adminUsername = credentials.username;
  const adminHashedPassword = credentials.hashedPassword;

  try {
    // Check if admin user already exists
    const existingUser = await db.get(
      'SELECT username FROM users WHERE username = ?',
      [adminUsername]
    );

    if (existingUser) {
      console.log(`Admin user '${adminUsername}' already exists.`);
      // Optional: Update password if needed, but be careful with this logic
      // console.log('Updating password for existing admin user...');
      // await db.run('UPDATE users SET hashedPassword = ? WHERE username = ?', [adminHashedPassword, adminUsername]);
      // console.log('Admin password updated (if different).');
    } else {
      console.log(`Admin user '${adminUsername}' not found, creating...`);
      // Ensure the hash provided is valid before inserting (basic check)
      if (!adminHashedPassword.startsWith('$2b$')) {
        console.error(
          'Error: The hashedPassword in admin_credentials.json does not look like a valid bcrypt hash.'
        );
        return;
      }
      await db.run(
        'INSERT INTO users (username, hashedPassword) VALUES (?, ?)',
        [adminUsername, adminHashedPassword]
      );
      console.log(`Admin user '${adminUsername}' created successfully.`);
    }
  } catch (err) {
    console.error('Database error during admin initialization:', err.message);
  } finally {
    // Close the database connection if the script is standalone
    // db.db.close(); // Assuming db exports the raw sqlite3 instance as 'db' if needed
  }
}

initializeAdmin();
