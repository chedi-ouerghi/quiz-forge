import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as schema from '../db/schema/index.js';
import * as relations from '../db/relations/index.js';

dotenv.config();

// Créer le pool de connexions
export const poolConnection = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    maxIdle: Number(process.env.DB_MAX_IDLE || 10),
    idleTimeout: Number(process.env.DB_IDLE_TIMEOUT_MS || 60000),
    queueLimit: Number(process.env.DB_QUEUE_LIMIT || 0),
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

export const db = drizzle(poolConnection, {
    schema: { ...schema, ...relations },
    mode: 'default',
    logger: process.env.NODE_ENV === 'development'
});

// Fonction pour tester la connexion
export async function testConnection() {
    try {
        const connection = await poolConnection.getConnection();
        console.log('✅ Connexion MySQL établie avec succès');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion MySQL:', error);
        return false;
    }
}
