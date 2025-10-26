import { app, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';

let tray: Tray | null = null;

export function createTray(mainWindow: Electron.BrowserWindow) {
  // Create tray icon
  const icon = nativeImage.createFromPath(
    path.join(__dirname, '../../assets/tray-icon.png')
  ).resize({ width: 16, height: 16 });

  tray = new Tray(icon);

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: 'Start Recording',
      click: () => {
        mainWindow.webContents.send('start-recording-hotkey');
      },
    },
    {
      label: 'Stop Recording',
      click: () => {
        mainWindow.webContents.send('stop-recording-hotkey');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('IHC Conversation Recorder');
  tray.setContextMenu(contextMenu);

  // Handle click events
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  // Handle double click events
  tray.on('double-click', () => {
    mainWindow.show();
  });

  return tray;
}
