import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../src/config/database';

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...');

    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);

    console.log('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
