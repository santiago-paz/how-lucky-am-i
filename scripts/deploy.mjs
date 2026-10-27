// Puts the site on Vercel.
//
// Only what the site needs is uploaded: index.html and assets/ (without assets/src, the 3D source). They are copied
// to a temporary folder first, so notes, scripts, tests and raw data never become public.
//
//   vercel link --yes --project how-lucky-am-i     once, to tie this folder to the Vercel project
//   npm run deploy                                 a production deploy
//   npm run deploy -- --preview                    a preview deploy instead
//   npm run deploy -- --stage-only                 only build the folder .deploy/, to look at what would go up
import { cpSync, rmSync, mkdirSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const OUT = '.deploy';
const args = process.argv.slice(2);
const preview = args.includes('--preview');
const stageOnly = args.includes('--stage-only');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
const keep = (src) => !/(^|[\\/])\.DS_Store$/.test(src) && !/^assets[\\/]src([\\/]|$)/.test(src);
cpSync('index.html', join(OUT, 'index.html'));
cpSync('assets', join(OUT, 'assets'), { recursive: true, filter: keep });
cpSync('vercel.json', join(OUT, 'vercel.json'));

const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(OUT);
const bytes = files.reduce((n, f) => n + statSync(f).size, 0);
console.log(`Staged ${files.length} files (${(bytes / 1048576).toFixed(1)} MB) in ${OUT}/`);
if (stageOnly) process.exit(0);

if (!existsSync('.vercel/project.json')) {
  console.error('This folder is not tied to a Vercel project yet. Run once:  vercel link --yes --project how-lucky-am-i');
  process.exit(1);
}
const { orgId, projectId } = JSON.parse(readFileSync('.vercel/project.json', 'utf8'));
const run = spawnSync('vercel', ['deploy', OUT, '--yes', ...(preview ? [] : ['--prod'])], {
  stdio: 'inherit',
  env: { ...process.env, VERCEL_ORG_ID: orgId, VERCEL_PROJECT_ID: projectId },
});
process.exit(run.status === null ? 1 : run.status);
