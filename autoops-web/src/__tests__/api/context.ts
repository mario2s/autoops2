/**
 * Shared test context — populated by the auth setup tests, consumed by every
 * subsequent test file.
 *
 * Jest loads each test file in its own module context, so a plain in-memory
 * object would reset between files. We back the context with a JSON file in
 * the OS temp directory; reads happen on module load, and a Proxy persists
 * mutations on every assignment.
 *
 * The file is reset by globalSetup before each test run.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type SharedContext = {
  adminToken: string;
  mechanicToken: string;
  mechanic2Token: string;
  pendingToken: string;
  adminUserId: string;
  mechanicUserId: string;
  mechanic2UserId: string;
  orderId: string;
  clientId: string;
  vehicleId: string;
  partId: string;
  deletableVehicleId: string;
};

export const CONTEXT_FILE = join(tmpdir(), 'autoops-api-test-context.json');

const initial: SharedContext = {
  adminToken: '',
  mechanicToken: '',
  mechanic2Token: '',
  pendingToken: '',
  adminUserId: '',
  mechanicUserId: '',
  mechanic2UserId: '',
  orderId: '',
  clientId: '',
  vehicleId: '',
  partId: '',
  deletableVehicleId: '',
};

function load(): SharedContext {
  if (!existsSync(CONTEXT_FILE)) return { ...initial };
  try {
    const parsed = JSON.parse(readFileSync(CONTEXT_FILE, 'utf-8'));
    return { ...initial, ...parsed };
  } catch {
    return { ...initial };
  }
}

const data = load();

export const context: SharedContext = new Proxy(data, {
  set(target, prop, value) {
    (target as any)[prop] = value;
    writeFileSync(CONTEXT_FILE, JSON.stringify(target, null, 2));
    return true;
  },
}) as SharedContext;
