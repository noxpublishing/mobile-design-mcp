import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const issues = [];
const secretPatterns = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bgh[pousr]_[A-Za-z0-9]{25,}\b/, /\bgithub_pat_[A-Za-z0-9_]{25,}\b/, /\bAKIA[A-Z0-9]{16}\b/];
for (const path of files) {
  if (/^(?:research|\.artifacts|node_modules|\.data)\//.test(path) || /(?:^|\/)\.env(?:\.|$)/.test(path) && path !== '.env.example' || /\.(?:db|db-wal|db-shm|tgz)$/.test(path)) issues.push({ path, issue: 'Local/private artifact in publication set' });
  const bytes = await readFile(resolve(root, path));
  if (bytes.length > 2 * 1024 * 1024) issues.push({ path, issue: 'Large file requires explicit publication review' });
  if (secretPatterns.some(pattern => pattern.test(bytes.toString('utf8')))) issues.push({ path, issue: 'Potential credential/private key; inspect locally' });
}
const license = await readFile(resolve(root, 'LICENSE'), 'utf8');
const notice = await readFile(resolve(root, 'NOTICE'), 'utf8');
const readme = await readFile(resolve(root, 'README.md'), 'utf8');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
if (!license.includes('Noncommercial Study License') || !license.includes("rights holder's own use")) issues.push({ path: 'LICENSE', issue: 'Study scope or own-use clarification missing' });
if (!notice.includes('Apache License 2.0') || !notice.includes('does not override')) issues.push({ path: 'NOTICE', issue: 'Upstream attribution/license scope missing' });
if (!readme.includes('For noncommercial studies') || pkg.license !== 'SEE LICENSE IN LICENSE') issues.push({ path: 'README.md/package.json', issue: 'Public study labeling inconsistent' });
await readFile(resolve(root, 'LICENSES/Apache-2.0.txt'));
await readFile(resolve(root, 'docs/usage-rights.md'));
console.log(JSON.stringify({ status: issues.length ? 'needs-review' : 'passed', files: files.length, issues, scope: 'License-label consistency and common publication leaks only; not legal clearance or an exhaustive secret/content-rights audit.' }, null, 2));
process.exitCode = issues.length ? 1 : 0;
