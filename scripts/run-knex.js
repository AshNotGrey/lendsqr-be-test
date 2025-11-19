/**
 * Small helper to run Knex commands in both TS (dev) and compiled (prod) envs.
 * If ts-node is unavailable (e.g. Render installs without dev deps) it falls back to dist/knexfile.js.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const projectRoot = path.resolve(__dirname, '..');
const tsKnexfile = path.join(projectRoot, 'knexfile.ts');
const distKnexfile = path.join(projectRoot, 'dist', 'knexfile.js');
const hasTsNode = fs.existsSync(path.join(projectRoot, 'node_modules', 'ts-node'));

const shouldUseDist =
  process.env.NODE_ENV === 'production' ||
  process.env.FORCE_JS_MIGRATIONS === 'true' ||
  !hasTsNode;

const knexfileToUse =
  shouldUseDist && fs.existsSync(distKnexfile) ? distKnexfile : tsKnexfile;

if (knexfileToUse === tsKnexfile && !hasTsNode) {
  console.warn(
    '⚠️  ts-node not found; falling back to TypeScript knexfile because no compiled file exists.'
  );
}

const [, , ...cliArgs] = process.argv;
const knexArgs = cliArgs.length > 0 ? cliArgs : ['migrate:latest'];

const commandArgs = ['knex', ...knexArgs, '--knexfile', knexfileToUse];
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const result = spawnSync(npxCommand, commandArgs, {
  stdio: 'inherit',
  cwd: projectRoot,
});

if (result.error) {
  console.error('Failed to run Knex command:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);

