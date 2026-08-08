const { app, BrowserWindow, session, globalShortcut, ipcMain } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");
const online = require("./online.cjs");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const startUrl = process.env.ELECTRON_START_URL;
const isDev = !!startUrl;

let ollamaProc = null;
let startedOllama = false;

function isOllamaUp() {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:11434/api/tags", (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForOllama(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isOllamaUp()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function startOllama() {
  if (await isOllamaUp()) return;
  ollamaProc = spawn("ollama", ["serve"], {
    env: { ...process.env, OLLAMA_ORIGINS: "*" },
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  startedOllama = true;
  ollamaProc.on("error", () => {
    ollamaProc = null;
    startedOllama = false;
  });
  await waitForOllama(20000);
}

function stopOllama() {
  if (!startedOllama || !ollamaProc || !ollamaProc.pid) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(ollamaProc.pid), "/f", "/t"]);
    } else {
      process.kill(ollamaProc.pid, "SIGTERM");
    }
  } catch {}
  ollamaProc = null;
  startedOllama = false;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    fullscreen: !isDev,
    kiosk: !isDev,
    autoHideMenuBar: true,
    backgroundColor: "#ffffff",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  if (isDev) {
    win.loadURL(startUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

function registerAIHandlers() {
  const wrap = (fn) => async (_event, payload) => {
    try {
      return { ok: true, ...(await fn(payload || {})) };
    } catch (err) {
      return { ok: false, error: err.message || "failed" };
    }
  };

  ipcMain.handle("pdf:save", async (_event, payload) => {
    const { html, fileName } = payload || {};
    if (!html) return { ok: false, error: "no_html" };

    const win = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false },
    });

    try {
      await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
      const pdf = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
        margins: { marginType: "custom", top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
      });

      const dir = path.join(app.getPath("documents"), "Aarogya Prescriptions");
      fs.mkdirSync(dir, { recursive: true });
      const target = path.join(dir, fileName || `prescription-${Date.now()}.pdf`);
      fs.writeFileSync(target, pdf);

      return { ok: true, path: target };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      win.destroy();
    }
  });

  ipcMain.handle("ai:configured", async () => ({ ok: true, ...online.configured() }));
  ipcMain.handle("ai:reachable", async () => ({ ok: true, reachable: await online.reachable() }));
  ipcMain.handle("ai:transcribe", wrap(online.transcribe));
  ipcMain.handle("ai:chat", wrap(online.chat));
  ipcMain.handle("ai:speak", wrap(online.speak));
}

app.whenReady().then(() => {
  registerAIHandlers();
  startOllama();
  createWindow();

  globalShortcut.register("CommandOrControl+Shift+Q", () => app.quit());
  globalShortcut.register("Escape", () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win && win.isKiosk()) app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  stopOllama();
});

app.on("window-all-closed", () => {
  stopOllama();
  if (process.platform !== "darwin") app.quit();
});
