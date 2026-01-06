import { db } from './index.js';
import { artworks, receivedArtworks } from './schema.js';
import { desc, ne, eq, and } from 'drizzle-orm';

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
  // 1. まだ受け取っていない、かつ自分以外の作品を探す
  // Subquery constraint is improved by doing an anti-join logic or simple filtering.
  // For simplicity: Get all artworks not by user, then filter out ones already received.

  // First, get list of artwork IDs already received by this user
  const receivedRaw = await db
    .select({ artworkId: receivedArtworks.artworkId })
    .from(receivedArtworks)
    .where(eq(receivedArtworks.receiverId, userId));

  const receivedIds = new Set(receivedRaw.map(r => r.artworkId));

  const results = await db
    .select()
    .from(artworks)
    .where(ne(artworks.anonymousUserId, userId)) // 自分以外の作品
    .orderBy(desc(artworks.createdAt));

  // Filter out already received
  const candidates = results.filter(art => !receivedIds.has(art.id));

  if (candidates.length === 0) return null;

  // ランダムに1つ選ぶ
  const randomIndex = Math.floor(Math.random() * candidates.length);
  const selectedArtwork = candidates[randomIndex];

  // 受け取り履歴に保存
  await db.insert(receivedArtworks).values({
    receiverId: userId,
    artworkId: selectedArtwork.id,
  });

  return selectedArtwork;
}

// ユーザーの作品一覧を取得する関数（自分が描いたもの）
export async function getUserArtworks(userId: string) {
  return await db
    .select()
    .from(artworks)
    .where(eq(artworks.anonymousUserId, userId))
    .orderBy(desc(artworks.createdAt));
}

// 受け取った作品一覧を取得する関数（ギャラリー用）
export async function getReceivedArtworks(userId: string) {
  const results = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      strokesData: artworks.strokesData,
      isDarkBg: artworks.isDarkBg,
      createdAt: artworks.createdAt,
      receivedAt: receivedArtworks.receivedAt,
      authorId: artworks.anonymousUserId, // 作成者のIDも一応取得
    })
    .from(receivedArtworks)
    .leftJoin(artworks, eq(receivedArtworks.artworkId, artworks.id))
    .where(eq(receivedArtworks.receiverId, userId))
    .orderBy(desc(receivedArtworks.receivedAt));

  // leftJoinなので artworks が null の可能性（物理削除された場合など）を考慮してフィルタリング
  return results.filter(r => r.id !== null);
}