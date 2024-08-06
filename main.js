const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const { isWithinInterval, startOfDay, endOfDay,} = require('date-fns');
const storage = require('node-persist');

let isPhotoEnabled = false;
let isVideoEnabled = false;
let isRawEnabled = false;

storage.initSync();

function isTypePhoto(file) {
  const photoExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.heic', '.heif'];
  const extension = path.extname(file).toLowerCase();
  return photoExtensions.includes(extension);
}

function isTypeVideo(file) {
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.webm', '.mpeg', '.mpg'];
  const extension = path.extname(file).toLowerCase();
  return videoExtensions.includes(extension);
}

function isTypeRaw(file) {
  const rawExtensions = ['.raw'];
  const extension = path.extname(file).toLowerCase();
  return rawExtensions.includes(extension);
}

function checkMediaType(file) {
  let isMatch = false;
  if (isPhotoEnabled && isTypePhoto(file)) {
    return true;
  }
  
  if (isVideoEnabled && isTypeVideo(file)) {
    return true;
  }
  
  if (isRawEnabled && isTypeRaw(file)) {
    return true;
  }
}


async function setLastDirectory(directory) {
  await storage.setItem('lastDir', directory);
}

async function getLastDirectory() {
  const lastDirectory = await storage.getItem('lastDir');
  return lastDirectory || null;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    selectedDir = result.filePaths[0];
    setLastDirectory(selectedDir);

    return selectedDir;
  });

  ipcMain.handle('get-last-directory', async () => {
    try {
      let lastDir = getLastDirectory();
      if (lastDir) {
        return lastDir;
      }
    } catch (err) {
      console.error('Error reading last directory:', err);
    }
    return null; // Return null if there's no file or an error occurs
  });

  ipcMain.handle('set-last-directory', async (event, directory) => {
    await storage.setItem('lastDir', directory);
  });

  ipcMain.handle('set-photos', (event, val) => {
    isPhotoEnabled = val;
  });
  
  ipcMain.handle('set-videos', async (event, val) => {
    isVideoEnabled = val;
  });
  
  ipcMain.handle('set-raw', async (event, val) => {
    isRawEnabled = val;
  });

  ipcMain.handle('files:copyJpg', async (event, sourcePath, startDate, endDate) => {
    try {
      const start = startOfDay(startDate);
      const end = endOfDay(endDate); 
      const isPhotoEnabled = await storage.get('photos');
      const isVideoEnabled = await storage.get('videos');
      const isRawEnabled = await storage.get('raw');

      const today = new Date().toISOString().split('T')[0];
      const desktopPath = path.join(os.homedir(), 'Desktop');
      const targetFolder = path.join(desktopPath, today);
      await fsp.mkdir(targetFolder, { recursive: true });

      const files = await fsp.readdir(sourcePath);
      let numberOfFilesCopied = 0;
      for (const file of files) {
        if (checkMediaType(file, isPhotoEnabled, isVideoEnabled, isRawEnabled)) {
          const sourceFile = path.join(sourcePath, file);
          const stats = await fsp.stat(sourceFile);
          const fileModifiedDate = new Date(stats.mtime);
          if (isWithinInterval(fileModifiedDate, { start, end })) {
            const targetFile = path.join(targetFolder, file);
            await fsp.copyFile(sourceFile, targetFile);
            numberOfFilesCopied++;
            // Send progress update
            event.sender.send('copy-progress');
          }
        }
      }
      event.sender.send('copy-progress-finished', {
        files: numberOfFilesCopied
      });
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
