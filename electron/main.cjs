const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL);

// Keep the original application-data directory after the public rename. Electron
// otherwise derives this path from package.json, which would make existing local
// saves appear to vanish when Idle Game Prototype becomes NDB Idle.
app.setPath("userData", path.join(app.getPath("appData"), "idle-game-prototype"));

function createWindow() {
  const window = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1040,
    minHeight: 700,
    backgroundColor: "#ffffff",
    title: "NDB Idle",
    icon: path.join(__dirname, "..", "build", "app-icon.png"),
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDevelopment) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
