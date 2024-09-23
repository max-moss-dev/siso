require('dotenv').config({path: '.env.local'});
const { spawn } = require('child_process');

const pythonPath = process.env.PYTHON_PATH || 'python';

// Start the Python backend
const pythonProcess = spawn(pythonPath, ['main.py'], { stdio: 'inherit', cwd: process.cwd() });

pythonProcess.on('error', (error) => {
  console.error('Error running Python script:', error.message);
});