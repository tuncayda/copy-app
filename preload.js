const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  copyJpgFiles: (sourcePath, startDate, endDate) => ipcRenderer.invoke('files:copyJpg', sourcePath, startDate, endDate),
  getLastDirectory: () => ipcRenderer.invoke('get-last-directory'),
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data);
  },
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});
