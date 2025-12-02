import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL to extract connection details
const databaseUrl = process.env.DATABASE_URL || '';
const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);

if (!urlMatch) {
  throw new Error('Invalid DATABASE_URL format. Expected: mysql://username:password@host:port/database');
}

const [, user, password, host, port, database] = urlMatch;

// Create MySQL connection pool
export const pool = mysql.createPool({
  host,
  port: parseInt(port),
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema, mode: 'default' });

// Export schema for use in queries
export { schema };
