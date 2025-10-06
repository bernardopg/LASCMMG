# Database Migrations Guide

## Overview

LASCMMG uses a simple but effective migration system for SQLite database schema changes. The migration system ensures that databases can be safely upgraded from older versions without data loss.

## Architecture

### Migration Components

1. **`backend/lib/db/db-init.js`** - Initial database schema creation for new installations
2. **`backend/lib/db/schema.js`** - Migration system for existing databases
3. **`backend/lib/db/database.js`** - Database connection and query wrapper

### Migration Flow

```text
Application Start
      ↓
db-init.js creates tables if they don't exist
      ↓
schema.js runs migrations (ALTER TABLE operations)
      ↓
Database ready for use
```

## How Migrations Work

### Current System

The migration system uses a **non-versioned, additive approach**:

1. **Idempotent Operations**: All migrations check if a change is already applied before executing
2. **Additive Only**: Migrations only add new columns/indexes, never remove or modify existing ones
3. **Automatic Execution**: Migrations run automatically on server startup

### Key Function: `addColumnIfNotExistsSync()`

```javascript
addColumnIfNotExistsSync(db, tableName, columnName, columnDef)
```

- Checks if column exists using `PRAGMA table_info(tableName)`
- If column doesn't exist, adds it with `ALTER TABLE ADD COLUMN`
- Logs all operations for audit trail
- Returns `true` if column was added, `false` if it already existed

## Creating New Migrations

### Step 1: Update Initial Schema (`db-init.js`)

Always update the initial schema first so new installations have the correct structure:

```javascript
// In backend/lib/db/db-init.js
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS your_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    existing_column TEXT NOT NULL,
    new_column TEXT DEFAULT 'default_value',  -- Add your new column here
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`;
```

### Step 2: Add Migration (`schema.js`)

Then add the migration for existing databases:

```javascript
// In backend/lib/db/schema.js, inside runMigrations()
function runMigrations() {
  logger.info({ component: 'SchemaMigration' }, 'Executando migrações do banco de dados...');
  const db = getSyncConnection();

  try {
    // ... existing migrations ...

    // Add your new migration here
    addColumnIfNotExistsSync(db, 'your_table', 'new_column', "TEXT DEFAULT 'default_value'");

    logger.info(
      { component: 'SchemaMigration' },
      'Migrações do banco de dados verificadas/executadas com sucesso.'
    );
  } catch (error) {
    logger.error(
      { component: 'SchemaMigration', err: error },
      'Erro durante as migrações do banco de dados.'
    );
    throw error;
  }
}
```

### Step 3: Update Models

Update the corresponding model file to use the new column:

```javascript
// In backend/lib/models/yourModel.js
const YourModel = {
  create(data) {
    const sql = `
      INSERT INTO your_table (existing_column, new_column)
      VALUES (?, ?)
    `;
    return runAsync(sql, [data.existingColumn, data.newColumn]);
  },
  // ... other methods
};
```

## Column Definition Examples

### Text Columns

```javascript
// Simple text column
addColumnIfNotExistsSync(db, 'users', 'bio', 'TEXT');

// Text with default value
addColumnIfNotExistsSync(db, 'users', 'role', "TEXT DEFAULT 'user'");

// Required text (NOT NULL)
addColumnIfNotExistsSync(db, 'users', 'username', 'TEXT NOT NULL');
```

### Numeric Columns

```javascript
// Integer
addColumnIfNotExistsSync(db, 'players', 'rating', 'INTEGER DEFAULT 1000');

// Real (floating point)
addColumnIfNotExistsSync(db, 'tournaments', 'entry_fee', 'REAL DEFAULT 0.0');

// Boolean (stored as INTEGER 0/1)
addColumnIfNotExistsSync(db, 'scores', 'is_deleted', 'INTEGER DEFAULT 0');
```

### Timestamp Columns

```javascript
// Auto-set to current time
addColumnIfNotExistsSync(db, 'tournaments', 'created_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');

// Nullable timestamp
addColumnIfNotExistsSync(db, 'users', 'last_login', 'TEXT');
```

### Foreign Key Columns

```javascript
// Reference with cascade
addColumnIfNotExistsSync(
  db,
  'scores',
  'winner_id',
  'INTEGER REFERENCES players(id) ON DELETE CASCADE'
);

// Reference with set null
addColumnIfNotExistsSync(
  db,
  'scores',
  'winner_id',
  'INTEGER REFERENCES players(id) ON DELETE SET NULL'
);
```

## Creating Indexes

For columns that need uniqueness or performance optimization:

```javascript
const emailColumnAdded = addColumnIfNotExistsSync(db, 'players', 'email', 'TEXT');

if (emailColumnAdded) {
  try {
    // UNIQUE index allowing multiple NULLs
    db.exec(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email_unique ON players (email) WHERE email IS NOT NULL;'
    );
    logger.info({ component: 'SchemaMigration' }, "Índice UNIQUE para 'email' criado.");
  } catch (indexErr) {
    logger.error({ component: 'SchemaMigration', err: indexErr }, 'Erro ao criar índice UNIQUE.');
  }
}
```

### Index Types

```sql
-- Simple index for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Composite index
CREATE INDEX IF NOT EXISTS idx_scores_tournament_player ON scores(tournament_id, player_id);

-- Unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Partial index (conditional)
CREATE INDEX IF NOT EXISTS idx_active_tournaments ON tournaments(status) WHERE deleted_at IS NULL;
```

## Best Practices

### ✅ DO

1. **Always use `IF NOT EXISTS`** when creating indexes
2. **Add migrations in chronological order** in `schema.js`
3. **Provide sensible default values** for new columns
4. **Log all migration operations** for debugging
5. **Test migrations on a copy of production data** before deploying
6. **Update both `db-init.js` and `schema.js`** for consistency
7. **Document complex migrations** with inline comments

### ❌ DON'T

1. **Never remove or modify existing migrations** - they may have already run
2. **Don't use destructive operations** (DROP COLUMN, DROP TABLE) in automated migrations
3. **Don't assume column order** - SQLite may reorder columns
4. **Don't use database-specific features** without checking SQLite compatibility
5. **Don't forget to handle migration errors** - they should fail loudly

## Migration Examples

### Example 1: Adding Soft Delete

```javascript
// Step 1: Add deleted_at column
addColumnIfNotExistsSync(db, 'tournaments', 'deleted_at', 'TEXT');

// Step 2: Add is_deleted flag for faster queries
addColumnIfNotExistsSync(db, 'tournaments', 'is_deleted', 'INTEGER DEFAULT 0');

// Step 3: Create index for active records
db.exec(
  'CREATE INDEX IF NOT EXISTS idx_tournaments_active ON tournaments(is_deleted) WHERE is_deleted = 0;'
);
```

### Example 2: Adding Audit Trail

```javascript
// Add audit columns
addColumnIfNotExistsSync(db, 'players', 'created_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
addColumnIfNotExistsSync(db, 'players', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
addColumnIfNotExistsSync(db, 'players', 'created_by', 'INTEGER REFERENCES users(id)');
addColumnIfNotExistsSync(db, 'players', 'updated_by', 'INTEGER REFERENCES users(id)');
```

### Example 3: Adding Enum-like Column

```javascript
// Add status column with CHECK constraint
addColumnIfNotExistsSync(
  db,
  'tournaments',
  'status',
  "TEXT DEFAULT 'Pendente' CHECK(status IN ('Pendente', 'Ativo', 'Concluído', 'Cancelado'))"
);

// Create index for common queries
db.exec(
  "CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);"
);
```

## Testing Migrations

### Manual Testing

1. **Create a backup** of your database:

   ```bash
   cp backend/data/database.sqlite backend/data/database.backup.sqlite
   ```

2. **Run the application** to execute migrations:

   ```bash
   npm start
   ```

3. **Check logs** for migration execution:

   ```text
   {"component":"SchemaMigration","msg":"Coluna 'new_column' adicionada à tabela 'your_table'."}
   ```

4. **Verify schema** using SQLite CLI:

   ```bash
   sqlite3 backend/data/database.sqlite "PRAGMA table_info(your_table);"
   ```

### Automated Testing

Create test cases in `backend/tests/unit/migrations.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { getSyncConnection } from '../../lib/db/database.js';
import { runMigrations } from '../../lib/db/schema.js';

describe('Database Migrations', () => {
  it('should add new column without errors', () => {
    const db = getSyncConnection();

    // Run migrations
    runMigrations();

    // Check column exists
    const columns = db.prepare('PRAGMA table_info(your_table)').all();
    const hasNewColumn = columns.some(col => col.name === 'new_column');

    expect(hasNewColumn).toBe(true);
  });
});
```

## Rollback Strategy

Since our migration system is additive-only, rollbacks are handled differently:

### Option 1: Restore from Backup

```bash
# Stop the application
npm stop

# Restore database
cp backend/data/database.backup.sqlite backend/data/database.sqlite

# Restart application with old code
git checkout <previous-version>
npm start
```

### Option 2: Manual Rollback (SQLite)

⚠️ **WARNING**: SQLite doesn't support `DROP COLUMN` directly. Manual rollbacks require recreating the table.

```sql
-- 1. Rename original table
ALTER TABLE your_table RENAME TO your_table_old;

-- 2. Create new table without the problematic column
CREATE TABLE your_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  existing_column TEXT NOT NULL,
  -- new_column is omitted
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Copy data
INSERT INTO your_table (id, existing_column, created_at)
SELECT id, existing_column, created_at FROM your_table_old;

-- 4. Drop old table
DROP TABLE your_table_old;
```

## Troubleshooting

### Migration Fails on Startup

**Symptom**: Application crashes with SQLite error during startup

**Solutions**:

1. Check logs for specific error message
2. Verify column definition syntax
3. Check for data conflicts (e.g., adding NOT NULL to column with existing NULLs)
4. Test migration on a database copy first

### Column Already Exists Error

**Symptom**: Error "duplicate column name"

**Cause**: Migration was partially applied or column was manually added

**Solution**: The `addColumnIfNotExistsSync()` function should prevent this. If it occurs:

```javascript
// Wrap in try-catch for legacy compatibility
try {
  addColumnIfNotExistsSync(db, 'table', 'column', 'TEXT');
} catch (err) {
  if (!err.message.includes('duplicate column')) {
    throw err; // Re-throw if it's not a duplicate column error
  }
  logger.warn({ component: 'SchemaMigration' }, 'Column already exists, skipping.');
}
```

### Data Type Mismatch

**Symptom**: Incorrect data being stored or retrieved

**Cause**: SQLite has dynamic typing but application expects specific types

**Solution**: Use consistent type definitions:

- Text: `TEXT`
- Integer: `INTEGER`
- Float: `REAL`
- Boolean: `INTEGER` (0 or 1)
- Timestamp: `TEXT` (ISO 8601 format)

## Future Improvements

### Versioned Migrations

For more complex migration needs, consider implementing a versioned system:

```javascript
// migrations/001_add_user_role.js
module.exports = {
  version: 1,
  up(db) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
  },
  description: 'Add role column to users table'
};

// Track applied migrations in database
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Data Migrations

For complex data transformations:

```javascript
// After adding column, transform existing data
addColumnIfNotExistsSync(db, 'players', 'full_name', 'TEXT');

// Populate from existing data
db.exec(`
  UPDATE players
  SET full_name = first_name || ' ' || last_name
  WHERE full_name IS NULL
`);
```

## Related Documentation

- [Testing Guide](./TESTING.md) - Unit and integration testing
- [TypeScript Migration](./TYPESCRIPT_MIGRATION.md) - Type safety for database operations
- [Database Schema](../backend/lib/db/db-init.js) - Initial table definitions
- [Migration System](../backend/lib/db/schema.js) - Current migration implementation

## Support

For migration-related questions or issues:

1. Check logs in `backend/lib/audit/audit_log.jsonl`
2. Review [SQLite documentation](https://www.sqlite.org/lang_altertable.html)
3. Consult the team or create an issue in the repository

---

**Last Updated**: October 2025
**Maintained By**: LASCMMG Development Team
