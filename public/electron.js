const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  win.loadURL(startUrl);
}

let pythonProcess = null;

function startPythonBackend() {
  pythonProcess = spawn('python', ['main.py']);
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python backend: ${data}`);
  });
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python backend error: ${data}`);
  });
  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    if (code !== 0) {
      app.quit();
    }
  });
}

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();
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