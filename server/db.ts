// server/db.ts
import { db } from './index'; // 接続設定
import { artworks } from './schema';
import { eq, ne, sql } from 'drizzle-orm';

// 1. 作品を保存する [cite: 67-72]
export async function createArtwork(data: {
  anonymousUserId: string;
  title: string;
  strokesData: string;
  isDarkBg: number;
}) {
  return await db.insert(artworks).values(data).returning({ id: artworks.id });
}

// 2. 他人の作品をランダムに1つ取得する [cite: 73-74]
export async function getRandomArtwork(excludeUserId: string) {
  const result = await db
    .select()
    .from(artworks)
    .where(ne(artworks.anonymousUserId, excludeUserId)) // 自分以外の作品
    .orderBy(sql`RANDOM()`) // ランダムに並び替え
    .limit(1);
  return result[0] || null;
}

// 3. 特定のユーザーの作品一覧を取得する [cite: 75-77]
export async function getUserArtworks(userId: string) {
  return await db
    .select()
    .from(artworks)
    .where(eq(artworks.anonymousUserId, userId))
    .orderBy(artworks.createdAt);
}
