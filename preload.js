const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  copyJpgFiles: (sourcePath, startDate, endDate) => ipcRenderer.invoke('files:copyJpg', sourcePath, startDate, endDate),
  getLastDirectory: () => ipcRenderer.invoke('get-last-directory'),
});
