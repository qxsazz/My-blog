import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const wrangler = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const config = 'dist/server/wrangler.json';
// Separate from databases previously created manually and from every hosted database.
export const localState = '.wrangler/preview-state';

export function runNode(args, { stdin = 'inherit' } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: projectRoot,
      stdio: [stdin, 'inherit', 'inherit'],
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: process.env.WRANGLER_SEND_METRICS || 'false',
        CLOUDFLARE_CF_FETCH_ENABLED: process.env.CLOUDFLARE_CF_FETCH_ENABLED || 'false',
      },
    });
    // Forward termination to the development server, including when started by npm.
    const stop = signal => { if (!child.killed) child.kill(signal); };
    const interrupt = () => stop('SIGINT');
    const terminate = () => stop('SIGTERM');
    process.once('SIGINT', interrupt);
    process.once('SIGTERM', terminate);
    const cleanup = () => {
      process.removeListener('SIGINT', interrupt);
      process.removeListener('SIGTERM', terminate);
    };
    child.once('error', error => { cleanup(); reject(error); });
    child.once('exit', (code, signal) => {
      cleanup();
      if (code === 0) resolve();
      else {
        const error = new Error(`Command failed (${code ?? signal}): node ${args[0]}`);
        error.exitCode = signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : code || 1;
        reject(error);
      }
    });
  });
}

export async function migrateLocal() {
  try { await access(new URL('../dist/server/wrangler.json', import.meta.url)); }
  catch { throw new Error('Build output is missing. Run npm run build first, or use npm run preview.'); }
  // --local is deliberate: this command never changes the deployed site's database.
  await runNode([wrangler, 'd1', 'migrations', 'apply', 'DB', '--local', '--config', config, '--persist-to', localState], { stdin: 'ignore' });
}

export async function previewLocal(args = []) {
  let port = '4321';
  let host = '127.0.0.1';
  for (let i = 0; i < args.length; i++) {
    const [flag, inline] = args[i].split('=', 2);
    if (!['--port', '--host', '--ip'].includes(flag)) throw new Error(`Unknown preview option: ${flag}`);
    const value = inline ?? args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (flag === '--port') port = value;
    else host = value;
  }
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Port must be between 1 and 65535.');
  if (!/^[\w.:[\]-]+$/.test(host)) throw new Error('Invalid preview host.');
  if (!process.env.npm_execpath) throw new Error('Start this script with npm run preview.');
  await runNode([process.env.npm_execpath, 'run', 'build']);
  await migrateLocal();
  await runNode([wrangler, 'dev', '--config', config, '--local', '--persist-to', localState, '--ip', host, '--port', port, '--inspector-port', '0']);
}
