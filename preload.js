const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  copyJpgFiles: (sourcePath) => ipcRenderer.invoke('files:copyJpg', sourcePath)
});
