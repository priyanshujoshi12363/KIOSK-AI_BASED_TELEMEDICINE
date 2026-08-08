const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cloudAI", {
  configured: () => ipcRenderer.invoke("ai:configured"),
  reachable: () => ipcRenderer.invoke("ai:reachable"),
  transcribe: (payload) => ipcRenderer.invoke("ai:transcribe", payload),
  chat: (payload) => ipcRenderer.invoke("ai:chat", payload),
  speak: (payload) => ipcRenderer.invoke("ai:speak", payload),
});
