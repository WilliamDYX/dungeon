// ============================================================
// Shadow Dungeon 本地服务器（静态托管 + AI对话代理）
// 解决 file:// 下浏览器 CORS 拦截 + WSL 网络问题
// 启动: node server.js
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // 绑定所有网卡，确保 WSL→Windows 可达

// AI 配置（代理后前端无需关心，也避免 file:// 跨域问题）
const AI_API = 'https://token.sensenova.cn/v1/chat/completions';
const AI_MODEL = 'deepseek-v4-flash';
const AI_KEY = 'sk-5UQHaMXsotPetObMiF3Z6GHOs1Kf4t1X';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function sendJSON(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1 << 20) { req.destroy(); reject(new Error('payload too large')); } });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// 代理调用 AI
function proxyChat(messages) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ model: AI_MODEL, messages });
    const lib = require('https');
    const req = lib.request(AI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + AI_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (upstream) => {
      let raw = '';
      upstream.on('data', c => { raw += c; });
      upstream.on('end', () => {
        if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
          resolve({ error: true, msg: 'AI 返回 HTTP ' + upstream.statusCode + ': ' + raw.slice(0, 200) });
          return;
        }
        try {
          const data = JSON.parse(raw);
          const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
          if (typeof text !== 'string') { resolve({ error: true, msg: 'AI 返回格式异常' }); return; }
          resolve({ error: false, text });
        } catch (e) {
          resolve({ error: true, msg: '解析失败: ' + e.message });
        }
      });
    });
    req.on('error', e => resolve({ error: true, msg: '网络错误: ' + e.message }));
    req.setTimeout(30000, () => { req.destroy(); resolve({ error: true, msg: 'AI 请求超时' }); });
    req.write(body);
    req.end();
  });
}

const ROOT = __dirname;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  // API: AI 对话代理
  if (pathname === '/api/chat' && req.method === 'POST') {
    let payload;
    try { payload = JSON.parse(await readBody(req) || '{}'); }
    catch (e) { sendJSON(res, 400, { error: true, msg: '请求体无效' }); return; }
    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      sendJSON(res, 400, { error: true, msg: '缺少 messages' }); return;
    }
    const result = await proxyChat(payload.messages);
    sendJSON(res, result.error ? 502 : 200, result);
    return;
  }

  // 静态文件托管
  let fp = pathname === '/' ? '/roguelike.html' : pathname;
  fp = path.normalize(fp).replace(/^(\.\.[/\\])+/, '');
  const abs = path.join(ROOT, fp);
  if (!abs.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(abs, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 Not Found: ' + pathname); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Shadow Dungeon 已启动                       ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  在浏览器(Edge/Chrome)打开下面任一地址:       ║');
  console.log('║                                              ║');
  console.log('║  本机:   http://localhost:' + PORT + '                ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  // 打印所有网卡IP，WSL用户用对应IP访问
  const nets = os.networkInterfaces();
  console.log('其他可用地址(WSL→Windows 用这些IP):');
  Object.keys(nets).forEach(name => {
    nets[name].forEach(net => {
      if (net.family === 'IPv4' && !net.internal) {
        console.log('  http://' + net.address + ':' + PORT + '/roguelike.html   (' + name + ')');
      }
    });
  });
  console.log('');
  console.log('提示: 保持此窗口开着。按 Ctrl+C 停止。');
});
