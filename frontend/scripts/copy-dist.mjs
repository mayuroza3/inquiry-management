import { cpSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, '..', 'dist');
const target = join(root, '..', '..', 'backend', 'public');

for (const name of readdirSync(dist)) {
  cpSync(join(dist, name), join(target, name), { recursive: true, force: true });
}
