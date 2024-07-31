const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises; // Promisified version of fs for async/await
const os = require('os');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.filePaths[0];
  });

  ipcMain.handle('files:copyJpg', async (event, sourcePath) => {
    try {
      // Create target folder on the desktop with today's date
      const today = new Date().toISOString().split('T')[0]; // Format yyyy-mm-dd
      const desktopPath = path.join(os.homedir(), 'Desktop');
      const targetFolder = path.join(desktopPath, today);
      await fsp.mkdir(targetFolder, { recursive: true });

      // Read source folder and copy .jpg files
      const files = await fsp.readdir(sourcePath);
      for (const file of files) {
        if (path.extname(file).toLowerCase() === '.jpg') {
          const sourceFile = path.join(sourcePath, file);
          const targetFile = path.join(targetFolder, file);
          await fsp.copyFile(sourceFile, targetFile);
        }
      }

      return { success: true, message: 'Files copied successfully!' };
    } catch (error) {
      console.error('Error copying files:', error);
      return { success: false, message: 'Error copying files' };
    }
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
