// server/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL が設定されていません。Vercelの環境変数を確認してください。');
}

// SupabaseのConnection Pooler（ポート6543）を使う場合、
// prepare: false という設定を足すと接続が安定します
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });