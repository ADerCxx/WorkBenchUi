/**
 * afterFileEdit: format the edited file with the repo Prettier config.
 * stdin: { file_path, ... }
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXT_OK = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.less',
  '.md',
  '.mdc',
  '.yml',
  '.yaml',
]);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

let payload;
try {
  payload = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const filePath = payload?.file_path;
if (!filePath || typeof filePath !== 'string') {
  process.exit(0);
}

const abs = path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
const ext = path.extname(abs).toLowerCase();
if (!EXT_OK.has(ext) || !fs.existsSync(abs)) {
  process.exit(0);
}

const prettierCli = path.join(root, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
const result = spawnSync(
  process.execPath,
  [prettierCli, '--write', '--log-level', 'warn', abs],
  {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  },
);

if (result.status !== 0) {
  const msg = (result.stderr || result.stdout || '').trim();
  if (msg) console.error(msg);
}

process.exit(0);
