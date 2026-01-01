// server/schema.ts
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const artworks = pgTable('artworks', {
  id: serial('id').primaryKey(), // 主キー [cite: 82]
  anonymousUserId: text('anonymous_user_id').notNull(), // ユーザーID [cite: 81]
  title: text('title').notNull(), // 作品タイトル [cite: 84]
  strokesData: text('strokes_data').notNull(), // 描画データ（JSON文字列） [cite: 86]
  isDarkBg: integer('is_dark_bg').default(0), // ダークモード（0: 偽, 1: 真） [cite: 88]
  createdAt: timestamp('created_at').defaultNow(), // 作成日時 [cite: 89]
});
