import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
});

export async function testDatabaseConnection() {
    try {
        const result = await pool.query('SELECT NOW()');

        console.log(' Database connected successfully');
    } catch (error) {
        console.error(' Database connection failed:', error.message);
        process.exit(1);
    }
}

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});