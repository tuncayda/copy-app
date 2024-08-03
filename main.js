const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const { format, parseISO, isWithinInterval, startOfDay, endOfDay, isBefore, isAfter } = require('date-fns');

async function saveLastUsedDirectory(directory) {
  try {
    await fsp.writeFile(path.join(app.getPath('userData'), 'lastDirectory.txt'), directory);
  } catch (err) {
    console.error('Error saving last used directory:', err);
  }
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
    saveLastUsedDirectory(selectedDir);

    return selectedDir;
  });

  ipcMain.handle('get-last-directory', () => {
    try {
      if (fs.existsSync('lastDirectory.txt')) {
        return fs.readFileSync('lastDirectory.txt', 'utf8').trim();
      }
    } catch (err) {
      console.error('Error reading last directory:', err);
    }
    return null; // Return null if there's no file or an error occurs
  });

  ipcMain.handle('files:copyJpg', async (event, sourcePath, startDate, endDate) => {
    try {
      // const start = new Date(startDate);
      // const end = new Date(endDate);
      // const start = new Date(startDate + 'T00:00:00.001Z');
      // const end = Date(endDate + 'T23:59:59.999Z');
      const start = startOfDay(startDate);
      const end = endOfDay(endDate); 

      const today = new Date().toISOString().split('T')[0];
      const desktopPath = path.join(os.homedir(), 'Desktop');
      const targetFolder = path.join(desktopPath, today);
      await fsp.mkdir(targetFolder, { recursive: true });

      const files = await fsp.readdir(sourcePath);
      let numberOfFilesCopied = 0;
      for (const file of files) {
        if (path.extname(file).toLowerCase() === '.jpg') {
          const sourceFile = path.join(sourcePath, file);
          const stats = await fsp.stat(sourceFile);
          const fileModifiedDate = new Date(stats.mtime);
          if (isWithinInterval(fileModifiedDate, { start, end })) {
            console.log(`FMD: ${fileModifiedDate}\n\nStart: ${start}\n\nEnd: ${end}`)
          console.log(fileModifiedDate < end)
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
