import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWin = process.platform === 'win32';
const backendDir = path.resolve(__dirname, '..', 'backend');
const rootDir = path.resolve(__dirname, '..');

const venvDir = path.resolve(backendDir, '.venv');
const pythonPath = isWin
  ? path.resolve(venvDir, 'Scripts', 'python.exe')
  : path.resolve(venvDir, 'bin', 'python');

console.log('[Dev Runner] Initializing Company Scout development environment...');

// Ensure backend .env exists
const backendEnvPath = path.resolve(backendDir, '.env');
const backendEnvExamplePath = path.resolve(backendDir, '.env.example');
if (!fs.existsSync(backendEnvPath) && fs.existsSync(backendEnvExamplePath)) {
  console.log('[Dev Runner] Creating backend/.env from .env.example...');
  fs.copyFileSync(backendEnvExamplePath, backendEnvPath);
}

// Ensure Python virtual environment exists
if (!fs.existsSync(pythonPath)) {
  console.log('[Dev Runner] Creating Python virtual environment in backend/.venv...');
  try {
    execSync('python -m venv .venv', { cwd: backendDir, stdio: 'inherit' });
    console.log('[Dev Runner] Installing backend dependencies...');
    const pipPath = isWin
      ? path.resolve(venvDir, 'Scripts', 'pip.exe')
      : path.resolve(venvDir, 'bin', 'pip');
    execSync(`"${pipPath}" install -r requirements.txt`, { cwd: backendDir, stdio: 'inherit' });
  } catch (err) {
    console.warn('[Dev Runner] Failed to set up venv automatically. Falling back to system python if available.', err.message);
  }
}

const activePython = fs.existsSync(pythonPath) ? pythonPath : 'python';
console.log(`[Dev Runner] Using Python: ${activePython}`);

// Run migrations before starting server
try {
  console.log('[Dev Runner] Applying database migrations...');
  execSync(`"${activePython}" manage.py migrate --noinput`, { cwd: backendDir, stdio: 'inherit' });
} catch (err) {
  console.warn('[Dev Runner] Migration warning:', err.message);
}

// Start Django server
console.log('[Dev Runner] Starting Django backend on http://127.0.0.1:8000 ...');
const djangoProcess = spawn(
  activePython,
  ['manage.py', 'runserver', '127.0.0.1:8000'],
  {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true,
  }
);

// Start Vite server
console.log('[Dev Runner] Starting Vite frontend server...');
const viteCommand = isWin ? 'npx.cmd' : 'npx';
const viteProcess = spawn(viteCommand, ['vite', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('\n[Dev Runner] Shutting down servers...');
  try {
    djangoProcess.kill();
  } catch (e) {}
  try {
    viteProcess.kill();
  } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);