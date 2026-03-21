import { db, poolConnection } from '../config/database';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🔄 Running migrations...');
  
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    await migrate(db, { migrationsFolder: migrationsDir });
    
    console.log('✅ Toutes les migrations ont été exécutées avec succès!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await poolConnection.end();
  }
}

runMigrations();