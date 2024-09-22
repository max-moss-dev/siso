const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');

let pythonProcess = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: width,
    height: height,
    icon: path.join(__dirname, '..', 'assets', 'icon.svg'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, './index.html'),
    protocol: 'file:',
    slashes: true
  });

  win.loadURL(startUrl);

  win.webContents.on('did-finish-load', () => {
    win.show();
  });
}

function startPythonBackend() {
  const pythonPath = process.env.PYTHON_PATH || 'python';
  const scriptPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'main.py')
    : path.join(__dirname, 'main.py');
  
  pythonProcess = spawn(pythonPath, [scriptPath], {
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python backend: ${data}`);
  });
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python backend error: ${data}`);
  });
  pythonProcess.on('error', (error) => {
    console.error(`Failed to start Python process: ${error}`);
  });
}

app.whenReady().then(() => {
  process.env.PATH = `${process.env.PATH}:/usr/local/bin:/usr/bin`;
  startPythonBackend();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});