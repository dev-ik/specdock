import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  { name: 'api', args: ['run', 'dev', '-w', 'apps/api'] },
  { name: 'web', args: ['run', 'dev', '-w', 'apps/web'] },
];

let stopping = false;
let remaining = processes.length;
let exitCode = 0;
const children = [];

function stopChildren(signal = 'SIGTERM') {
  for (const child of children) {
    if (!child.killed && child.exitCode === null) {
      child.kill(signal);
    }
  }
}

for (const { name, args } of processes) {
  let settled = false;
  const child = spawn(npmCommand, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

  children.push(child);

  function finishChild(code, signal) {
    if (settled) {
      return;
    }

    settled = true;
    remaining -= 1;

    if (!stopping) {
      stopping = true;
      exitCode = code ?? (signal ? 1 : 0);
      stopChildren();
    }

    if (remaining === 0) {
      process.exit(exitCode);
    }
  }

  child.on('error', (error) => {
    console.error(`[${name}] failed to start: ${error.message}`);
    finishChild(1);
  });

  child.on('exit', finishChild);
}

process.on('SIGINT', () => {
  stopping = true;
  exitCode = 130;
  stopChildren('SIGINT');
});

process.on('SIGTERM', () => {
  stopping = true;
  exitCode = 143;
  stopChildren('SIGTERM');
});
