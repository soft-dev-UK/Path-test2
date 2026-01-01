import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== API エンドポイント =====

// 作品を保存
app.post('/api/artworks/save', async (req: Request, res: Response) => {
  try {
    const { anonymousUserId, title, strokesData, isDarkBg } = req.body;

    if (!anonymousUserId || !title || !strokesData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TODO: データベースに保存
    res.json({ id: Math.random(), success: true });
  } catch (error) {
    console.error('Error saving artwork:', error);
    res.status(500).json({ error: 'Failed to save artwork' });
  }
});

// ランダムな作品を取得（交換用）
app.post('/api/artworks/exchange', async (req: Request, res: Response) => {
  try {
    const { anonymousUserId } = req.body;

    if (!anonymousUserId) {
      return res.status(400).json({ error: 'Missing anonymousUserId' });
    }

    // TODO: データベースからランダムに取得
    res.json(null);
  } catch (error) {
    console.error('Error exchanging artwork:', error);
    res.status(500).json({ error: 'Failed to exchange artwork' });
  }
});

// ユーザーの作品一覧を取得
app.get('/api/artworks/list/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // TODO: データベースから取得
    res.json([]);
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
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
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Web server running on http://localhost:${PORT}`);
});
