import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiMiddleware } from './api-handler.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.webp': 'image/webp',
};

const apiMiddleware = createApiMiddleware({
  dataFilePath: path.join(rootDir, 'data', 'orders.json'),
});

const sendFile = async (res, filePath) => {
  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[extension] || 'application/octet-stream');
    createReadStream(filePath).pipe(res);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
};

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || 'localhost';
  const reqUrl = new URL(req.url || '/', `http://${host}`);

  if (reqUrl.pathname.startsWith('/api/')) {
    await apiMiddleware(req, res);
    return;
  }

  const requestedPath = decodeURIComponent(reqUrl.pathname);
  const safeRelativePath = requestedPath.replace(/^\/+/, '');
  const staticPath = path.join(distDir, safeRelativePath);

  if (existsSync(staticPath)) {
    await sendFile(res, staticPath);
    return;
  }

  await sendFile(res, path.join(distDir, 'index.html'));
});

server.listen(PORT, HOST, () => {
  console.log(`BLANK storefront running on http://${HOST}:${PORT}`);
});
