import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { articlesRouter } from './routes/articles.js';
import { adminRouter } from './routes/admin.js';
import { userRouter } from './routes/user.js';
import { authorsRouter } from './routes/authors.js';
import { eventsRouter } from './routes/events.js';
import { newsRouter, generateRSSXML } from './routes/news.js';
import { discussionsRouter } from './routes/discussions.js';
import { pollsRouter } from './routes/polls.js';
import { notificationsRouter } from './routes/notifications.js';
import { inquiriesRouter } from './routes/inquiries.js';
import { startRSSAutomation } from './services/rssService.js';

import { setSocketIO, emitRealtime } from './realtime.js';
import { prisma } from './prisma.js';
export { emitRealtime };

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientPath = path.resolve(__dirname, '../../');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// HTTP server for Express and Socket.IO
export const httpServer = http.createServer(app);

// Initialize Socket.io with permissive CORS for development
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});
setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected to real-time engine: ${socket.id}`);
  socket.on('disconnect', () => {
    // client disconnected
  });
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Private-Network', 'true');
  next();
});

// CORS configuration - allow all origins for LAN and cross-device access
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting for public and authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests, please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(authenticateToken);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'OPEN MEDIA Backend API',
    realtime: 'Socket.io Active',
    rssAutomation: 'Active',
    timestamp: new Date().toISOString()
  });
});

// Mount modular routers
app.use('/api/auth', authRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/authors', authorsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/events', eventsRouter);
app.use('/api/news', newsRouter);
app.use('/api/discussions', discussionsRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/inquiries', inquiriesRouter);

// Public RSS Feed (XML) for external aggregators (all tabs or specific tab)
app.get(['/rss.xml', '/api/rss', '/rss/:category.xml'], async (req, res) => {
  try {
    const rawCat = (req.query.category as string) || (req.params as any)?.category;
    const xml = await generateRSSXML(rawCat);
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    return res.send(xml);
  } catch (err: any) {
    console.error('RSS XML generation error:', err);
    return res.status(500).send('Error generating RSS XML feed');
  }
});

function escapeHtmlAttr(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function renderIndexHtml(req: express.Request): Promise<string> {
  const indexPath = path.join(clientPath, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');

  // Check if article deep link requested via query or path
  const articleId = (req.query.article as string) || (req.query.id as string) || (req.params as any)?.id;
  if (articleId) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true, title: true, summary: true, image: true, category: true }
      });
      if (article) {
        const pageTitle = escapeHtmlAttr(`${article.title} — OPEN MEDIA`);
        const titleAttr = escapeHtmlAttr(article.title);
        const descAttr = escapeHtmlAttr(article.summary || article.title);
        const imgAttr = escapeHtmlAttr(article.image || 'https://openmedia.soxit.in/assets/open-media-logo.png');
        const articleUrl = `https://openmedia.soxit.in/?article=${encodeURIComponent(article.id)}#article-${encodeURIComponent(article.id)}`;

        html = html
          .replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`)
          .replace(/<meta property="og:title" content=".*?"\s*\/?>/, `<meta property="og:title" content="${titleAttr}">`)
          .replace(/<meta property="og:description" content=".*?"\s*\/?>/, `<meta property="og:description" content="${descAttr}">`)
          .replace(/<meta property="og:image" content=".*?"\s*\/?>/, `<meta property="og:image" content="${imgAttr}">`)
          .replace(/<meta property="og:url" content=".*?"\s*\/?>/, `<meta property="og:url" content="${articleUrl}">`)
          .replace(/<meta name="twitter:title" content=".*?"\s*\/?>/, `<meta name="twitter:title" content="${titleAttr}">`)
          .replace(/<meta name="twitter:description" content=".*?"\s*\/?>/, `<meta name="twitter:description" content="${descAttr}">`)
          .replace(/<meta name="twitter:image" content=".*?"\s*\/?>/, `<meta name="twitter:image" content="${imgAttr}">`);
      }
    } catch (_) {}
  }
  return html;
}

// Serve frontend static assets securely if present
if (fs.existsSync(path.join(clientPath, 'index.html'))) {
  app.use('/assets', express.static(path.join(clientPath, 'assets')));
  app.use('/css', express.static(path.join(clientPath, 'css')));
  app.use('/js', express.static(path.join(clientPath, 'js')));
  app.get(['/', '/index.html', '/article/:id'], async (req, res) => {
    try {
      const html = await renderIndexHtml(req);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err) {
      res.sendFile(path.join(clientPath, 'index.html'));
    }
  });
}

// Global 404 / SPA fallback handler for unmatched routes
app.use(async (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
  }
  if (fs.existsSync(path.join(clientPath, 'index.html'))) {
    try {
      const html = await renderIndexHtml(req);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (_) {
      return res.sendFile(path.join(clientPath, 'index.html'));
    }
  }
  return res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON payload in request body' });
  }
  return res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server explicitly bound to 0.0.0.0 for LAN access
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 OPEN MEDIA API server running on http://0.0.0.0:${PORT} (LAN accessible)`);
    console.log(`⚡ Socket.io real-time engine listening on port ${PORT}`);
    // Start automated recurring RSS background ingestion (2 mins in dev, 15 mins in prod)
    const interval = process.env.NODE_ENV === 'production' ? 15 : 2;
    startRSSAutomation(interval);
  });
}

export default app;
