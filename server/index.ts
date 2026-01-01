// server/index.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

// Vercelの設定画面で登録した DATABASE_URL を読み込みます [cite: 194-197]
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL が設定されていません。VercelのSettingsを確認してください。');
}

// データベース接続の作成
const connection = await mysql.createConnection(connectionString);
export const db = drizzle(connection, { schema });
