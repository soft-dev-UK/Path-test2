import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// データベース操作関数をインポート 
import { saveArtwork, exchangeArtwork, getUserArtworks, getReceivedArtworks } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
// 描画データは大きくなる可能性があるため、limit: '50mb' を維持します
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== API エンドポイント =====

// 作品を保存
app.post('/api/artworks/save', async (req: Request, res: Response) => {
  try {
    const { anonymousUserId, title, strokesData, isDarkBg } = req.body;

    if (!anonymousUserId || !title || !strokesData) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    // データベースに保存を実行
    const result = await saveArtwork({
      anonymousUserId,
      title,
      strokesData: typeof strokesData === 'string' ? strokesData : JSON.stringify(strokesData),
      isDarkBg: isDarkBg ? 1 : 0,
    });

    res.json({ id: result[0].id, success: true });
  } catch (error) {
    console.error('作品の保存中にエラーが発生しました:', error);
    res.status(500).json({ error: '作品の保存に失敗しました' });
  }
});

// ランダムな作品を取得（交換用）
app.post('/api/artworks/exchange', async (req: Request, res: Response) => {
  try {
    const { anonymousUserId } = req.body;

    if (!anonymousUserId) {
      return res.status(400).json({ error: 'anonymousUserIdが必要です' });
    }

    // データベースから自分以外の作品をランダムに取得
    const artwork = await exchangeArtwork(anonymousUserId);

    if (artwork) {
      res.json(artwork);
    } else {
      // まだ他人の作品がない場合
      res.status(404).json({ error: '交換できる作品がまだありません' });
    }
  } catch (error) {
    console.error('作品の交換中にエラーが発生しました:', error);
    res.status(500).json({ error: '作品の交換に失敗しました' });
  }
});

// ユーザーの作品一覧を取得
app.get('/api/artworks/list/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userIdが必要です' });
    }

    // データベースから特定ユーザーの作品を取得
    const artworks = await getUserArtworks(userId);
    res.json(artworks);
  } catch (error) {
    console.error('一覧の取得中にエラーが発生しました:', error);
    res.status(500).json({ error: '作品一覧の取得に失敗しました' });
  }
});

// 受け取った作品一覧を取得
app.get('/api/artworks/received/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userIdが必要です' });
    }

    const artworks = await getReceivedArtworks(userId);
    res.json(artworks);
  } catch (error) {
    console.error('一覧の取得中にエラーが発生しました:', error);
    res.status(500).json({ error: '作品一覧の取得に失敗しました' });
  }
});

// ヘルスチェック
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// SPA用のフォールバック
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// エラーハンドリング
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('サーバーエラー:', err);
  res.status(500).json({ error: '内部サーバーエラーが発生しました' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Web server running on http://localhost:${PORT}`);
});
