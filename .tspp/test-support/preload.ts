import { plugin } from 'bun';
import { createPlugins } from '../compiler/plugin';

for (const currentPlugin of createPlugins(process.cwd())) {
  plugin(currentPlugin);
}
