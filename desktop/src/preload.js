const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron, {
  generateSession: () => ipcRenderer.invoke('generate-session'),
  joinSession: (data) => ipcRenderer.invoke('join-session', data),
  sendCode: (data) => ipcRenderer.invoke('send-code', data),
  saveHistory: (data) => ipcRenderer.invoke('save-history', data),
  getHistory: (sessionId) => ipcRenderer.invoke('get-history', sessionId),
});