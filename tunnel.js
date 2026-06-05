/**
 * Run: node tunnel.js (from E:\gamesite)
 * Opens two localtunnel URLs so friends anywhere on the internet can join.
 * Press Ctrl+C to stop and clean up.
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLIENT_DIR = path.join(__dirname, 'client');
const ENV_LOCAL = path.join(CLIENT_DIR, '.env.local');

async function killPort(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { shell: 'cmd', encoding: 'utf8' });
    const pids = [...new Set(
      out.split('\n')
        .filter(l => l.includes('LISTENING'))
        .map(l => l.trim().split(/\s+/).pop())
        .filter(p => /^\d+$/.test(p))
    )];
    for (const pid of pids) {
      try { execSync(`taskkill /PID ${pid} /F`, { shell: 'cmd', stdio: 'ignore' }); } catch (_) {}
    }
  } catch (_) {}
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  // Install localtunnel if not yet installed
  if (!fs.existsSync(path.join(__dirname, 'node_modules', 'localtunnel'))) {
    console.log('Installing localtunnel...');
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
  }

  const localtunnel = require('localtunnel');

  console.log('\n[1/4] Opening tunnel for backend (port 3001)...');
  const backendTunnel = await localtunnel({ port: 3001 });
  const backendUrl = backendTunnel.url;
  console.log('      Backend:', backendUrl);

  console.log('\n[2/4] Writing client/.env.local...');
  fs.writeFileSync(ENV_LOCAL, `NEXT_PUBLIC_SERVER_URL=${backendUrl}\n`);

  console.log('\n[3/4] Restarting Next.js to pick up new server URL...');
  await killPort(3000);
  await wait(1000);
  spawn('cmd', ['/c', 'start', 'powershell', '-NoExit', '-Command',
    `Set-Location "${CLIENT_DIR}"; npm run dev`
  ], { detached: true, stdio: 'ignore' });

  console.log('      Waiting 12s for Next.js to boot...');
  await wait(12000);

  console.log('\n[4/4] Opening tunnel for frontend (port 3000)...');
  const frontendTunnel = await localtunnel({ port: 3000 });

  console.log('\n' + '═'.repeat(52));
  console.log('  SHARE THIS LINK WITH YOUR FRIEND:');
  console.log('  ' + frontendTunnel.url);
  console.log('═'.repeat(52));
  console.log('\n  Note: friend may see a "tunnel page" on first open —');
  console.log('  they just click "Click to Continue".\n');
  console.log('  Press Ctrl+C to stop tunnels.\n');

  const cleanup = () => {
    console.log('\nClosing tunnels...');
    backendTunnel.close();
    frontendTunnel.close();
    try { fs.unlinkSync(ENV_LOCAL); } catch (_) {}
    console.log('Done. .env.local removed.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  backendTunnel.on('error', err => console.error('Backend tunnel error:', err.message));
  frontendTunnel.on('error', err => console.error('Frontend tunnel error:', err.message));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
