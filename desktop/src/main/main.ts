import { app, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron';
import * as path from 'path';
import { setupAudioHandlers } from './audioHandlers';
import { setupVoiceAssistant } from './voiceAssistant';
import { setupDocumentHandlers } from './documentHandlers';
import { setupDataHandlers } from './dataStore';
import { createTray } from './tray';

const isDev = !app.isPackaged;

// Install React DevTools in development mode
if (isDev) {
  app.whenReady().then(async () => {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import('electron-devtools-installer');
      await installExtension(REACT_DEVELOPER_TOOLS);
      console.log('React DevTools installed');
    } catch (error) {
      console.log('Failed to install React DevTools:', error);
    }
  });
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload path:', preloadPath);
  console.log('Preload exists:', require('fs').existsSync(preloadPath));
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Setup IPC handlers
  setupAudioHandlers();
  setupVoiceAssistant();
  setupDocumentHandlers();
  setupDataHandlers();

  // Create system tray
  if (mainWindow) {
    createTray(mainWindow);
  }

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    mainWindow?.webContents.send('start-recording-hotkey');
  });

  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow?.webContents.send('stop-recording-hotkey');
  });

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

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Handle file system access
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

// Handle app settings
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

// Handle file saving
ipcMain.handle('save-file', async (event, options: { path: string; content: string }) => {
  try {
    const fs = require('fs');
    fs.writeFileSync(options.path, options.content, 'utf8');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save file:', error);
    return { success: false, error: error.message };
  }
});
