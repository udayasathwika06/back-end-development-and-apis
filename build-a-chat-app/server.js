
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Create the HTTP server
const server = http.createServer((req, res) => {
  fs.readFile(
    path.join(__dirname, 'public', 'index.html'),
    (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading page');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  );
});

// 2. Create the WebSocket server
const wss = new WebSocketServer({ server });

// Helper function to broadcast messages to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

// 3. Handle WebSocket connections
wss.on('connection', (socket, req) => {
  // 4. Get the username from the URL
  const username = new URL(
    req.url,
    'http://localhost'
  ).searchParams.get('username');

  // Broadcast the join message
  broadcast({
    type: 'system',
    text: `${username} joined`
  });

  // 5. Handle incoming chat messages
  socket.on('message', (message) => {
    try {
      const { username, text } = JSON.parse(message.toString());

      broadcast({
        type: 'chat',
        username,
        text
      });
    } catch (error) {
      console.error('Invalid message:', error.message);
    }
  });

  // 6. Handle client disconnection
  socket.on('close', () => {
    broadcast({
      type: 'system',
      text: `${username} left`
    });
  });
});

// 7. Start the server
server.listen(PORT, () => {
  console.log('Chat server running at http://localhost:3001');
});