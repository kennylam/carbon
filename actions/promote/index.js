/**
 * Copyright IBM Corp. 2018, 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as core from '@actions/core';
import glob from 'fast-glob';
import fs from 'fs-extra';
import got from 'got';
import path from 'path';

const denylist = new Set(['carbon-components', '@carbon/icons-vue']);
const NPM_REGISTRY = 'https://registry.npmjs.org';
const NPM_OIDC_AUDIENCE = 'npm:registry.npmjs.org';

function encodePackageName(name) {
  return name.replace('/', '%2f');
}

function isReleaseWorkflow() {
  const workflowRef = process.env.GITHUB_WORKFLOW_REF || '';
  return workflowRef.includes('/.github/workflows/release.yml@');
}

/**
 * Request a GitHub Actions OIDC JWT with the audience npm expects for trusted
 * publishing. The npm CLI only uses this during `npm publish`; dist-tag writes
 * have to exchange it ourselves.
 */
async function getGitHubIdToken() {
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;

  if (!requestUrl || !requestToken) {
    throw new Error(
      'GitHub Actions OIDC is not available. The job needs `permissions: id-token: write`.'
    );
  }

  const idTokenUrl = `${requestUrl}&audience=${encodeURIComponent(NPM_OIDC_AUDIENCE)}`;
  const response = await fetch(idTokenUrl, {
    headers: {
      authorization: `Bearer ${requestToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get GitHub OIDC token: ${response.status} ${response.statusText}`
    );
  }

  const body = await response.json();
  if (!body.value) {
    throw new Error('GitHub OIDC token response did not include a value');
  }

  return body.value;
}

/**
 * Exchange the GitHub OIDC JWT for a short-lived npm token scoped to one
 * package. This is the same endpoint `npm publish` uses for trusted publishing.
 */
async function exchangeNpmToken(packageName, idToken) {
  const encodedName = encodePackageName(packageName);
  const exchangeUrl = `${NPM_REGISTRY}/-/npm/v1/oidc/token/exchange/package/${encodedName}`;
  const response = await fetch(exchangeUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Failed to exchange OIDC token for ${packageName}: ${response.status} ${response.statusText} - ${details}`
    );
  }

  const body = await response.json();
  if (!body.token) {
    throw new Error(
      `npm OIDC exchange for ${packageName} did not include a token`
    );
  }

  return body.token;
}

async function addLatestDistTag(packageName, version, npmToken) {
  const encodedName = encodePackageName(packageName);
  const url = `${NPM_REGISTRY}/-/package/${encodedName}/dist-tags/latest`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${npmToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(version),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Failed to add dist-tag latest to ${packageName}@${version}: ${response.status} ${response.statusText} - ${details}`
    );
  }
}

async function main() {
  const dryRun = core.getInput('DRY_RUN') === 'true';

  const ROOT_DIRECTORY = process.cwd();
  const workspaces = [];
  const queue = [ROOT_DIRECTORY];

  while (queue.length > 0) {
    const directory = queue.shift();
    const packageJsonPath = path.join(directory, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = await fs.readJson(packageJsonPath);
    const workspace = {
      directory,
      packageJson,
    };

    workspaces.push(workspace);

    if (packageJson.workspaces) {
      const candidates = await Promise.all(
        packageJson.workspaces.map(async (pattern) => {
          const matches = await glob([pattern], {
            cwd: directory,
            onlyDirectories: true,
          });
          return matches.map((match) => {
            return path.join(directory, match);
          });
        })
      ).then((result) => {
        return result.flat();
      });
      queue.push(...candidates);
    }
  }

  // Trusted publishing is configured for release.yml only (one workflow per
  // package). A job in promote.yml cannot mint an npm token.
  if (!dryRun && !isReleaseWorkflow()) {
    throw new Error(
      'npm trusted publishing is bound to .github/workflows/release.yml. Re-run the Release workflow `packages` job, or use Actions → Release → Run workflow. The Promote workflow can only dry-run.'
    );
  }

  let idToken = null;
  if (!dryRun) {
    idToken = await getGitHubIdToken();
  }

  const updates = [];

  for (const workspace of workspaces) {
    const { name, version } = workspace.packageJson;

    core.info(`Checking workspace: ${name}`);

    if (workspace.packageJson.private) {
      core.info(`Skipping workspace ${name} due to private field`);
      continue;
    }

    if (denylist.has(name)) {
      core.info(`Skipping workspace ${name} due to denylist`);
      continue;
    }

    const npm = await got(name, {
      prefixUrl: NPM_REGISTRY,
    }).json();

    if (version === npm['dist-tags'].latest) {
      core.info(`Skipping workspace ${name} due to dist-tags are in sync`);
      continue;
    }

    updates.push({
      name,
      latest: version,
      previous: npm['dist-tags'].latest,
    });

    core.info(`npm dist-tag add ${name}@${version} latest`);

    if (!dryRun) {
      const npmToken = await exchangeNpmToken(name, idToken);
      await addLatestDistTag(name, version, npmToken);
    }
  }

  await core.summary
    .addHeading('Packages')
    .addTable([
      [
        {
          data: 'Package',
          header: true,
        },
        {
          data: 'Previous',
          header: true,
        },
        {
          data: 'Latest',
          header: true,
        },
      ],
      ...updates.map((update) => {
        return [update.name, update.previous, update.latest];
      }),
    ])
    .write();
}

main().catch((error) => {
  console.log(error);
  process.exit(1);
});
