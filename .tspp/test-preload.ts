import { plugin } from 'bun';
import { createPlugins } from './plugin.ts';

for (const currentPlugin of createPlugins(process.cwd())) {
  plugin(currentPlugin);
}
