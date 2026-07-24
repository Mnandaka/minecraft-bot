const axios = require('axios');
const WebSocket = require('ws');

const PANEL_URL = 'https://panel.zelpstore.com';
const API_KEY = 'ptlc_oet4rWErYzH0L7V0q4dAZk18QUYUXLIwcuhHRrW5KRU';
const SERVER_ID = 'fed6cd72';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1530193217096515624/bjzlVwQhKoXQNruvrw7saEjtnuhXlvMFEKhsiT7kZhKgbLoM6S27AfIOe2tyPGGfIshd';

async function startLogWatcher() {
  try {
    const response = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/websocket`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const { token, socket } = response.data.data;
    const ws = new WebSocket(socket, { headers: { Origin: PANEL_URL } });

    ws.on('open', () => {
      console.log('✅ Berhasil terhubung!');
      ws.send(JSON.stringify({ event: 'auth', args: [token] }));
    });

    ws.on('message', (data) => {
      const parsed = JSON.parse(data);
      if (parsed.event === 'console output') {
        const logLine = parsed.args[0];
        if (logLine.includes('Player connected:') || logLine.includes('Player disconnected:')) {
          sendToDiscord(`📢 **System:** \`${logLine.trim()}\``);
        } else if (logLine.includes('] Chat:')) {
          sendToDiscord(`💬 ${logLine.trim()}`);
        }
      }
    });

    ws.on('close', () => {
      console.log('Terputus, reconnect 5 detik...');
      setTimeout(startLogWatcher, 5000);
    });

  } catch (error) {
    console.error('❌ Gagal:', error.message);
    setTimeout(startLogWatcher, 5000);
  }
}

async function sendToDiscord(message) {
  try {
    await axios.post(WEBHOOK_URL, { content: message });
  } catch (err) {
    console.error('Discord error:', err.message);
  }
}

startLogWatcher();
