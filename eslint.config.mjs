// @ts-check

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import carbon, { testing as carbonTesting } from 'eslint-config-carbon';
import { defineConfig } from 'eslint/config';

/**
 * @param {string} filePath
 * @returns {string}
 */
const normalizePath = (filePath) => filePath.split(sep).join('/');

/**
 * @param {string} rawLine
 * @returns {{ line: string, negated: boolean } | null}
 */
const normalizeGitignoreLine = (rawLine) => {
  const trimmedLine = rawLine.trim();
  if (!trimmedLine || trimmedLine.startsWith('#')) return null;

  let line = trimmedLine;
  const negated = line.startsWith('!');

  if (line.startsWith('\\#') || line.startsWith('\\!')) {
    line = line.slice(1);
  }

  if (negated) {
    line = line.slice(1);
  }

  return { line, negated };
};

/**
 * @param {string} rootDir
 * @returns {string[]}
 */
const findGitignoreFiles = (rootDir) => {
  const gitignoreFiles = [];
  const pendingDirs = [rootDir];

  // Traverse the repo tree, skipping directories that shouldn't affect ignore
  // rules.
  while (pendingDirs.length) {
    const currentDir = pendingDirs.pop();

    if (!currentDir) break;

    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === '.gitignore') {
        gitignoreFiles.push(join(currentDir, entry.name));
        continue;
      }

      if (!entry.isDirectory() || entry.isSymbolicLink()) {
        continue;
      }

      if (entry.name === '.git' || entry.name === 'node_modules') {
        continue;
      }

      pendingDirs.push(join(currentDir, entry.name));
    }
  }

  return gitignoreFiles;
};

/**
 * @param {string} gitignoreFile
 * @param {string} repoRoot
 */
const parseNestedGitignore = (gitignoreFile, repoRoot) => {
  const dirRelative = relative(repoRoot, dirname(gitignoreFile));
  if (!dirRelative) return [];

  const dirPrefix = normalizePath(dirRelative);
  const rawLines = readFileSync(gitignoreFile, 'utf8').split(/\r?\n/);
  const patterns = [];

  for (const rawLine of rawLines) {
    const normalized = normalizeGitignoreLine(rawLine);

    if (!normalized) continue;

    let { line } = normalized;
    const { negated } = normalized;

    const isAnchored = line.startsWith('/');
    if (isAnchored) {
      line = line.slice(1);
    }

    const hasSlash = line.includes('/');
    const isDir = line.endsWith('/');
    const patternBase = hasSlash
      ? posix.join(dirPrefix, line)
      : posix.join(dirPrefix, '**', line);
    const pattern = isDir ? `${patternBase}**` : patternBase;

    patterns.push(negated ? `!${pattern}` : pattern);
  }

  return patterns;
};

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const gitignorePaths = findGitignoreFiles(repoRoot).sort(
  (a, b) => a.length - b.length
);
const rootGitignore = join(repoRoot, '.gitignore');
const nestedGitignorePatterns = gitignorePaths
  .filter((gitignoreFile) => gitignoreFile !== rootGitignore)
  .flatMap((gitignoreFile) => parseNestedGitignore(gitignoreFile, repoRoot));

export default defineConfig(
  includeIgnoreFile(rootGitignore),
  {
    name: 'Imported nested .gitignore patterns',
    ignores: nestedGitignorePatterns,
  },
  // shared rules in eslint-config-carbon
  ...carbon,
  ...carbonTesting,
  {
    name: 'carbon/monorepo/no-console',
    files: [
      '**/tasks/**',
      'actions/**',
      'packages/cli/**',
      'packages/upgrade/**',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  {
    name: 'carbon/monorepo/figma',
    files: ['packages/react/code-connect/**/*.figma.tsx'],
    rules: {
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-nocheck': false }],
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    ignores: [
      // Build folders
      '**/types/',

      'packages/*/examples/*',

      // Components
      'packages/components/demo/*.css',
      'packages/components/demo/*.map',
      'packages/components/demo/*.js',
      'packages/components/demo/js/prism.js',
      'packages/components/demo/hot',
      '!packages/components/demo/index.js', // This negation might need manual handling
      'packages/components/tests/a11y-results',
      'packages/components/scripts',
      'packages/components/scss',
      'packages/components/html',
      'packages/components/docs/js',
      'packages/components/scss/globals/vendor/**',
      'packages/components/src/globals/scss/vendor/**',

      // Upgrade
      '**/__testfixtures__/**',

      // React
      '**/storybook-static/**',

      // Templates
      'packages/cli/src/component/templates/**',

      // Generated files.
      '**/generated/',

      // TODO: Delete these ignores.
      // https://github.com/carbon-design-system/carbon/issues/18991
      // Tests.
      '**/*-test.js',
      '**/__tests__/**/*',

      // TODO: Delete these ignores.
      // https://github.com/carbon-design-system/carbon/issues/18991
      // Stories.
      '**/.storybook/**/*',
      '**/*.stories.js',
      '**/stories/**/*',

      // TODO: Delete these ignores.
      // https://github.com/carbon-design-system/carbon/issues/19012
      'packages/react/src/components/Notification/a11yIconWarningSolid.js',
      'packages/react/src/components/OverflowMenuV2/index.js',
      'packages/react/src/components/Pagination/experimental/PageSelector.js',
      'packages/react/src/components/Pagination/experimental/Pagination-story.js',
      'packages/react/src/components/Pagination/experimental/Pagination.js',
      'packages/react/src/components/Switch/IconSwitch.js',
    ],
  }
);
