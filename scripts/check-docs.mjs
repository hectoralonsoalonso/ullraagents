// Documentation/catalog integrity only; execute node:test separately for implemented demo checks.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
function files(dir) { return readdirSync(dir).filter(n => n !== '.git').flatMap(n => { const p=join(dir,n); return statSync(p).isDirectory() ? files(p) : [p]; }); }
const all = files(root);
for (const p of all.filter(p => p.endsWith('.md'))) {
  const text = readFileSync(p,'utf8');
  for (const [,link] of text.matchAll(/!?\[[^\]]*\]\(([^\s)]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    const target = resolve(dirname(p), decodeURIComponent(link.split('#')[0]));
    if (relative(root,target).startsWith('..')) errors.push('Link escapes repository: '+link);
    else if (!all.includes(target)) errors.push('Missing link: '+relative(root,p)+' -> '+link);
  }
}
const required=['README.md','docs/PROPUESTA.md','docs/REQUISITOS.md','docs/ARQUITECTURA.md','docs/SEGURIDAD.md','docs/BACKLOG.md','docs/PRUEBAS.md','docs/DECISIONES.md','docs/FORMULA.md','docs/DEMO.md'];
for (const p of required) if (!all.includes(join(root,p))) errors.push('Missing document '+p);
const req = readFileSync(join(root,'docs/REQUISITOS.md'),'utf8');
const cases = JSON.parse(readFileSync(join(root,'tests/scenarios.json'),'utf8'));
const ids = new Set();
for (const c of cases) {
  if (!/^H\d{2}$/.test(c.id) || ids.has(c.id)) errors.push('Invalid/duplicate scenario ID '+c.id);
  ids.add(c.id);
  if (!c.stimulus || !c.expected || !['planned','partial','automated'].includes(c.status)) errors.push('Invalid scenario '+c.id);
  if (c.status !== 'planned' && (!c.testFile || !all.includes(join(root,c.testFile)))) errors.push('Missing test reference '+c.id);
  if (!Array.isArray(c.requirements) || !c.requirements.length) errors.push('Missing requirement '+c.id);
  else for (const r of c.requirements) if (!req.includes('| '+r+' |')) errors.push('Unknown requirement '+r);
}
for (const id of req.match(/H\d{2}/g) ?? []) if (!ids.has(id)) errors.push('Missing scenario '+id);
for (const p of all) {
  const content=readFileSync(p,'utf8');
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}/.test(content)) errors.push('Possible secret in '+relative(root,p));
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode=1; }
else console.log('PASS: '+all.filter(p=>p.endsWith('.md')).length+' Markdown files; relative links; '+cases.length+' catalog scenarios; required docs; basic secret-pattern check. Demo tests execute separately with node --test; future production policies remain pending.');
