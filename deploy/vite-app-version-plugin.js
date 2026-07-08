import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function resolveBuildId() {
  if (process.env.VITE_BUILD_ID) return process.env.VITE_BUILD_ID;
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return Date.now().toString(36);
  }
}

export function appVersionPlugin() {
  const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));
  const meta = {
    version: pkg.version || '1.0.0',
    buildId: resolveBuildId(),
    builtAt: new Date().toISOString(),
  };

  return {
    name: 'app-version-meta',
    config() {
      return {
        define: {
          'import.meta.env.VITE_APP_VERSION': JSON.stringify(meta.version),
          'import.meta.env.VITE_BUILD_ID': JSON.stringify(meta.buildId),
          'import.meta.env.VITE_BUILD_TIME': JSON.stringify(meta.builtAt),
        },
      };
    },
    closeBundle() {
      writeFileSync(resolve(process.cwd(), 'dist', 'build-meta.json'), JSON.stringify(meta, null, 2));
    },
  };
}
