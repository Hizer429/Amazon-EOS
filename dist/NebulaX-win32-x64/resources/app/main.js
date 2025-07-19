const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 840,
    height: 620,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: '#0b0b1f', // 🛡️ Match your CSS background
    icon: path.join(__dirname, 'assets/amazon_logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });


  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
