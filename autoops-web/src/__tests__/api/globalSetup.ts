/**
 * Jest globalSetup — runs the test seed once before any test file.
 *
 * The seed is idempotent and resets any state that previous test runs
 * created (orders, vehicles, parts, clients owned by test users).
 */
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { CONTEXT_FILE } from './context';

export default async function globalSetup() {
  // Reset shared context file so prior runs don't leak tokens / IDs.
  if (existsSync(CONTEXT_FILE)) rmSync(CONTEXT_FILE);

  // Locate .env relative to this file (src/__tests__/api/globalSetup.ts → repo root is 3 up).
  const repoRoot = path.resolve(__dirname, '../../..');
  const envFile = path.join(repoRoot, '.env');
  const envArg = existsSync(envFile) ? `--env-file=${envFile} ` : '';

  // eslint-disable-next-line no-console
  console.log('[globalSetup] seeding test fixtures...');
  execSync(`npx tsx ${envArg}${path.join(repoRoot, 'src/db/seed-test.ts')}`, {
    stdio: 'inherit',
    cwd: repoRoot,
  });
}
