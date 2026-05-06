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
  '.br': 'application/octet-stream',
  '.gz': 'application/gzip',
};

const COMPRESSIBLE_EXTENSIONS = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt']);
const LONG_CACHE_EXTENSIONS = new Set([
  '.avif',
  '.br',
  '.css',
  '.gif',
  '.gz',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.png',
  '.svg',
  '.webp',
]);

const apiMiddleware = createApiMiddleware({
  dataFilePath: path.join(rootDir, 'data', 'orders.json'),
});

const setCacheHeaders = (res, filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  const normalizedPath = filePath.split(path.sep).join('/');

  if (extension === '.html') {
    res.setHeader('Cache-Control', 'no-cache');
    return;
  }

  if (normalizedPath.includes('/assets/') || LONG_CACHE_EXTENSIONS.has(extension)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=3600');
};

const getEncodedFile = (req, filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  const acceptEncoding = String(req.headers['accept-encoding'] || '');

  if (!COMPRESSIBLE_EXTENSIONS.has(extension)) return { filePath };

  if (acceptEncoding.includes('br') && existsSync(`${filePath}.br`)) {
    return { filePath: `${filePath}.br`, contentEncoding: 'br', originalExtension: extension };
  }

  if (acceptEncoding.includes('gzip') && existsSync(`${filePath}.gz`)) {
    return { filePath: `${filePath}.gz`, contentEncoding: 'gzip', originalExtension: extension };
  }

  return { filePath };
};

const sendFile = async (req, res, requestedFilePath) => {
  const encoded = getEncodedFile(req, requestedFilePath);

  try {
    const fileStats = await stat(encoded.filePath);
    if (!fileStats.isFile()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const extension = encoded.originalExtension || path.extname(encoded.filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[extension] || 'application/octet-stream');
    if (encoded.contentEncoding) {
      res.setHeader('Content-Encoding', encoded.contentEncoding);
      res.setHeader('Vary', 'Accept-Encoding');
    }
    setCacheHeaders(res, requestedFilePath);
    createReadStream(encoded.filePath).pipe(res);
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

  try {
    const fileStats = await stat(staticPath);
    if (fileStats.isFile()) {
      await sendFile(req, res, staticPath);
      return;
    }
  } catch {
    // Fall through to the SPA entry point.
  }

  await sendFile(req, res, path.join(distDir, 'index.html'));
});

server.listen(PORT, HOST, () => {
  console.log(`BLANK storefront running on http://${HOST}:${PORT}`);
});
