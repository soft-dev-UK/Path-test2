// server/schema.ts
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const artworks = pgTable('artworks', {
  id: serial('id').primaryKey(), // 主キー
  anonymousUserId: text('anonymous_user_id').notNull(), // ユーザーID
  title: text('title').notNull(), // 作品タイトル
  strokesData: text('strokes_data').notNull(), // 描画データ（JSON文字列）
  isDarkBg: integer('is_dark_bg').default(0), // ダークモード（0: 偽, 1: 真）
  createdAt: timestamp('created_at').defaultNow(), // 作成日時
});

export const receivedArtworks = pgTable('received_artworks', {
  id: serial('id').primaryKey(),
  receiverId: text('receiver_id').notNull(), // 受け取った人のanonymousUserId
  artworkId: integer('artwork_id').references(() => artworks.id).notNull(), // 受け取った作品のID
  receivedAt: timestamp('received_at').defaultNow(), // 受け取った日時
});
