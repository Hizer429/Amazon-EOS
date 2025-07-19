const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { Menu } = require('electron');
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});

// Disable the menu bar
Menu.setApplicationMenu(null);

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  const win = new BrowserWindow({
    width: Math.min(840, width),    // Use max width or available screen width
    height: Math.min(830, height),  // Use max height or available screen height
    resizable: true,                // Allow resizing for smaller screens
    maximizable: true,
    fullscreenable: false,
    backgroundColor: '#0b0b1f',
    icon: path.join(__dirname, 'assets/amazon_logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);