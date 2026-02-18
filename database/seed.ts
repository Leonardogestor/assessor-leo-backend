import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../src/config/database';

async function runSeed() {
  try {
    console.log('🌱 Starting database seeding...');

    const seedPath = join(__dirname, 'seed.sql');
    const seed = readFileSync(seedPath, 'utf-8');

    await pool.query(seed);

    console.log('✅ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
