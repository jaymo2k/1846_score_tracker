const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const INDEX_FILE = path.join(__dirname, 'index.html');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  // Serve index.html
  if (method === 'GET' && url === '/') {
    try {
      const html = fs.readFileSync(INDEX_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      sendJSON(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  // Serve game-logic.js
  if (method === 'GET' && url === '/game-logic.js') {
    try {
      const js = fs.readFileSync(path.join(__dirname, 'game-logic.js'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(js);
    } catch (err) {
      sendJSON(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  // GET /list — return array of session file info
  if (method === 'GET' && url === '/list') {
    try {
      const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
      const sessions = files.map(f => ({
        id: f.replace('.json', ''),
        filename: f
      }));
      sendJSON(res, 200, sessions);
    } catch (err) {
      sendJSON(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  // GET /load/:id — read and return a session file
  const loadMatch = method === 'GET' && url.match(/^\/load\/([a-zA-Z0-9_-]+)$/);
  if (loadMatch) {
    const id = loadMatch[1];
    const filePath = path.join(DATA_DIR, `${id}.json`);
    try {
      if (!fs.existsSync(filePath)) {
        sendJSON(res, 404, { error: 'Session not found' });
        return;
      }
      const data = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (err) {
      sendJSON(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  // POST /save/:id — write request body to session file
  const saveMatch = method === 'POST' && url.match(/^\/save\/([a-zA-Z0-9_-]+)$/);
  if (saveMatch) {
    const id = saveMatch[1];
    const filePath = path.join(DATA_DIR, `${id}.json`);
    try {
      const body = await readBody(req);
      fs.writeFileSync(filePath, body, 'utf8');
      sendJSON(res, 200, { ok: true });
    } catch (err) {
      sendJSON(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  // DELETE /delete/:id — remove a session file
  const deleteMatch = method === 'DELETE' && url.match(/^\/delete\/([a-zA-Z0-9_-]+)$/);
  if (deleteMatch) {
    const id = deleteMatch[1];
    const filePath = path.join(DATA_DIR, `${id}.json`);
    try {
      if (!fs.existsSync(filePath)) {
        sendJSON(res, 404, { error: 'Session not found' });
        return;
      }
      fs.unlinkSync(filePath);
      sendJSON(res, 200, { ok: true });
    } catch (err) {
      sendJSON(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  // Unknown route
  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`1846 Score Tracker running at ${url}`);

  // Open default browser
  const platform = process.platform;
  const cmd = platform === 'win32' ? `start ${url}`
    : platform === 'darwin' ? `open ${url}`
    : `xdg-open ${url}`;
  exec(cmd, () => {});
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
