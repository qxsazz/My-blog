import { migrateLocal } from './local-runtime.mjs';
try { await migrateLocal(); }
catch (error) {
  process.exitCode = error.exitCode || 1;
  if (![130, 143].includes(process.exitCode)) console.error(error instanceof Error ? error.message : String(error));
}
