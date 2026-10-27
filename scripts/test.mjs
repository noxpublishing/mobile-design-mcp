import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Enumerate without shell globs so PowerShell, cmd and Unix shells run the same suite.
const paths = (await readdir(new URL('../test/', import.meta.url)))
  .filter(name => name.endsWith('.test.mjs')).sort().map(name => fileURLToPath(new URL('../test/' + name, import.meta.url)));
const child = spawn(process.execPath, ['--test', ...paths], { stdio: 'inherit', shell: false });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
