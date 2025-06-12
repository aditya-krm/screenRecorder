const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { v4: uuidv4 } = require('uuid');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Ensure videos directory exists
const videosDir = path.join(process.cwd(), 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// IPC handlers for recording functionality
ipcMain.handle('generate-session-id', () => {
  return uuidv4();
});

ipcMain.handle('save-recording', async (event, { buffer, type, sessionId }) => {
  try {
    // Create session directory
    const sessionDir = path.join(videosDir, sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Determine filename based on type
    const filename = type === 'screen' ? 'screen.webm' : 'webcam.webm';
    const filePath = path.join(sessionDir, filename);

    // Write buffer to file
    fs.writeFileSync(filePath, Buffer.from(buffer));

    console.log(`Saved ${type} recording to ${filePath}`);
    return {
      success: true,
      filePath: filePath,
      sessionId: sessionId,
      type: type
    };
  } catch (error) {
    console.error('Error saving recording:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('get-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 150, height: 150 }
    });

    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }));
  } catch (error) {
    console.error('Error getting screen sources in main process:', error);
    throw error;
  }
});
