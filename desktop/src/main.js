const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('generate-session', async () => {
  const sessionId = require('crypto').randomBytes(4).toString('hex').substring(0, 8);
  const code = Math.floor(100000 + Math.random() * 900000);
  return { sessionId, code };
});

ipcMain.handle('join-session', async (_, { sessionId, code }) => {
  // Notify server to join this session
  mainWindow.webContents.send('session-joined', { sessionId, code });
});

ipcMain.handle('send-code', async (_, { sessionId, code }) => {
  mainWindow.webContents.send('code-received', { sessionId, code });
});

ipcMain.handle('save-history', async (_, { sessionId, codes }) => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.env.HOME, 'barcode-history', `${sessionId}.json`);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(codes));
});

ipcMain.handle('get-history', async (_, sessionId) => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.env.HOME, 'barcode-history', `${sessionId}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return [];
});