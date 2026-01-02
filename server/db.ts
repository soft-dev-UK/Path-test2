// server/db.ts
import { db } from './index.js';
import { artworks } from './schema.js';
import { desc, ne } from 'drizzle-orm';

// 作品を保存する関数
export async function saveArtwork(data: {
  anonymousUserId: string;
  title: string;
  strokesData: string;
  isDarkBg: number;
}) {
  return await db.insert(artworks).values({
    anonymousUserId: data.anonymousUserId,
    title: data.title,
    strokesData: data.strokesData,
    isDarkBg: data.isDarkBg,
  }).returning(); // Postgresはreturning()が使えます
}

// 作品をランダムに交換する関数
export async function exchangeArtwork(userId: string) {
  const results = await db
    .select()
    .from(artworks)
    .where(ne(artworks.anonymousUserId, userId)) // 自分以外の作品を選択
    .orderBy(desc(artworks.createdAt));

  if (results.length === 0) return null;

  // ランダムに1つ選んで返す
  const randomIndex = Math.floor(Math.random() * results.length);
  return results[randomIndex];
}