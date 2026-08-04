/**
 * afterFileEdit: format the edited file with the repo Prettier config.
 * stdin: { file_path, workspace_roots?, ... }
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
  '.yml',
  '.yaml',
]);

const hookDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(hookDir, '../..');
const logFile = path.join(hookDir, 'format-after-edit.log');

function log(line) {
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} ${line}\n`, 'utf8');
  } catch {
    // ignore
  }
}

function resolveTarget(filePath, workspaceRoots) {
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
    return filePath;
  }

  // Cursor may send workspace roots like "/D:/foo" on Windows.
  const normalizeRoot = (wr) => {
    if (typeof wr !== 'string') return null;
    let r = wr;
    if (/^\/[A-Za-z]:\//.test(r)) r = r.slice(1);
    return r;
  };

  const candidates = [];
  if (Array.isArray(workspaceRoots)) {
    for (const wr of workspaceRoots) {
      const base = normalizeRoot(wr);
      if (base) candidates.push(path.resolve(base, filePath));
    }
  }
  candidates.push(path.resolve(root, filePath));
  candidates.push(path.resolve(process.cwd(), filePath));

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

let raw = '';
try {
  raw = fs.readFileSync(0, 'utf8');
} catch (err) {
  log(`stdin read failed: ${err}`);
  process.exit(0);
}

// Cursor on Windows may prefix stdin JSON with a UTF-8 BOM / zero-width chars.
raw = raw
  .replace(/^\uFEFF/, '')
  .replace(/^\u200B/, '')
  .trim();
if (raw.charCodeAt(0) === 0xfeff || raw.charCodeAt(0) === 65279) {
  raw = raw.slice(1);
}

let payload;
try {
  payload = JSON.parse(raw || '{}');
} catch (err) {
  log(`json parse failed: ${err}; raw=${raw.slice(0, 200)}`);
  process.exit(0);
}

const filePath = payload?.file_path;
log(
  `payload file_path=${filePath ?? '(missing)'} cwd=${process.cwd()} roots=${JSON.stringify(payload?.workspace_roots ?? [])}`,
);

if (!filePath || typeof filePath !== 'string') {
  process.exit(0);
}

const abs = resolveTarget(filePath, payload?.workspace_roots);
if (!abs) {
  log(`file not found: ${filePath}`);
  process.exit(0);
}

const ext = path.extname(abs).toLowerCase();
if (!EXT_OK.has(ext)) {
  log(`skip ext: ${ext} path=${abs}`);
  process.exit(0);
}

const prettierCli = path.join(
  root,
  'node_modules',
  'prettier',
  'bin',
  'prettier.cjs',
);
if (!fs.existsSync(prettierCli)) {
  log(`prettier missing: ${prettierCli}`);
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  [prettierCli, '--write', '--log-level', 'warn', abs],
  {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  },
);

log(
  `prettier status=${result.status} path=${abs} stderr=${(result.stderr || '').trim() || '(none)'}`,
);

process.exit(0);
