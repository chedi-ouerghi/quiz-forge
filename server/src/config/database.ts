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
    connectionLimit: 10,
    queueLimit: 0,
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