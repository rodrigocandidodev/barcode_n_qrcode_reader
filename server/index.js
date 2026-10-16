const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');

const sessions = new Map();
const tokens = new Map();

const certPath = path.join(__dirname, 'certs', 'cert.pem');
const keyPath = path.join(__dirname, 'certs', 'key.pem');

let httpsOptions;
try {
  const certExists = fs.existsSync(certPath) && fs.existsSync(keyPath);
  if (certExists) {
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    httpsOptions = { cert, key };
  }
} catch (e) {
  console.error('Cert setup error:', e.message);
}

const server = httpsOptions
  ? http.createServer(httpsOptions)
  : http.createServer();

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const sessionId = req.url.substring(1) || uuid.v4().substring(0, 8);
  if (!req.url.startsWith('/')) {
    ws.close();
    return;
  }

  sessions.set(sessionId, new Map());

  const token = uuid.v4().substring(0, 12);
  tokens.set(ws, { sessionId, token });

  ws.sessionId = sessionId;
  ws.token = token;

  sessions.get(sessionId).set(ws, { token });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'barcode' || data.type === 'qr') {
        const sessionWsMap = sessions.get(sessionId);
        if (sessionWsMap) {
          sessionWsMap.forEach((clientWs, _) => {
            if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: data.type,
                data: data.data,
                sessionId,
                token: ws.token,
              }));
            }
          });
        }
      }
    } catch (e) {
      console.error('Message parse error:', e.message);
    }
  });

  ws.on('close', () => {
    const sessionWsMap = sessions.get(sessionId);
    if (sessionWsMap) {
      sessionWsMap.delete(ws);
    }
    tokens.delete(ws);
    if (sessionWsMap && sessionWsMap.size === 0) {
      sessions.delete(sessionId);
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket relay server running on port ${PORT}`);
});

module.exports = { wss, server };