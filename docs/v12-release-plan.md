# v12 release plan

This is the maintainer-facing action plan for shipping Carbon v12 from the
current v11 codebase. It is a living document: sections are expected to gain
detail, owners, and links to tracking issues as the release approaches.

Related documents:

- [`docs/working-with-v12.md`](working-with-v12.md) — how to develop v12 code
  today
- [`docs/migration/v12.md`](migration/v12.md) — the consumer-facing migration
  impact
- [`docs/feature-flags.md`](feature-flags.md) — the flag inventory and codemod
  associations
- [`docs/release.md`](release.md) — the existing release process
- [`docs/release-schedule.md`](release-schedule.md) — release phases and LTS
  policy

## Table of contents

- [Where things stand](#where-things-stand)
- [Workstreams](#workstreams)
  - [1. Feature flags](#1-feature-flags)
  - [2. Public API surface](#2-public-api-surface)
  - [3. Tests](#3-tests)
  - [4. CI and repository automation](#4-ci-and-repository-automation)
  - [5. Storybook and published sites](#5-storybook-and-published-sites)
  - [6. Migration tooling](#6-migration-tooling)
  - [7. Documentation](#7-documentation)
  - [8. Packages and publishing](#8-packages-and-publishing)
  - [9. v11 LTS readiness](#9-v11-lts-readiness)
- [Cutover plan](#cutover-plan)
  - [Why not just rename the branches](#why-not-just-rename-the-branches)
  - [Recommended cutover](#recommended-cutover)
  - [Release day runbook](#release-day-runbook)
  - [Rollback](#rollback)
- [Post-cutover cleanup](#post-cutover-cleanup)
- [Decisions still needed](#decisions-still-needed)

## Where things stand

The facts below are the baseline this plan is built on. They need re-checking
whenever this document is revised, because the branches move daily.

**Branches.** `main` holds v11. `next` is the v12 rehearsal branch. `next`
contains everything in `main` plus a small number of v12-specific commits, and
the two are kept in sync by `.github/workflows/automerge.yml`, a nightly cron
that merges `main` into `next` with a real merge commit and pushes directly to
`next`. On conflict it opens a draft notification PR and expects an admin to
resolve the merge by hand. The last such resolution was a `sync/main-into-next`
branch pushed to `next`.

**Versions.** `next` has published `v12.0.0-alpha.0` through `v12.0.0-alpha.3`
to the `v12-alpha` npm dist-tag via `.github/workflows/next-release.yml`. On
`next`, `@carbon/react` is `2.0.0-alpha.3`, `@carbon/web-components` is
`3.0.0-alpha.3`, and `@carbon/styles` is `2.0.0-alpha.3`.

**Flags.** `packages/feature-flags/feature-flags.yml` on `next` sets
`enable-v12-release: true`. The individual `enable-v12-*` entries are still
`false` in the YAML and get their v12 value from the `enable-v12-release`
override implemented in `packages/feature-flags/src/FeatureFlagScope.ts` and
`packages/feature-flags/index.scss`. Roughly 227 files under `packages/` still
reference `enable-v12` on `next`.

**Branch rules.** `main` uses classic branch protection and requires `format`,
`lint`, `test`, `test:e2e`, `avt`, `web-components-test`,
`UI Tests: @carbon/react`, and `chromatic-react`. `next` uses two repository
rulesets and requires only `format`, `lint`, `test`, `test:e2e`, and
`web-components-test` — it has neither AVT nor Chromatic gating.

**Open work in flight.** Around 110 open pull requests target `main`; one
targets `next`. This count is the single biggest constraint on the cutover
mechanics described below.

## Workstreams

### 1. Feature flags

The end state is that v12 behavior is the code, not a conditional. Every
`enable-v12-*` flag check, Sass `enabled()` guard, story wrapper, and test
wrapper eventually disappears.

- [ ] Freeze the `enable-v12-*` inventory. Decide the date after which no new
      flag may be committed to v12, and what happens to a flag that misses it
      (rename to `enable-v13-*`, or ship unflagged).
- [ ] Confirm every `enable-v12-*` flag satisfies the promotion bar in
      [`docs/feature-flags.md`](feature-flags.md#feature-flag-naming-convention):
      early-adopter testing, unit/AVT/VRT coverage, Storybook docs, website
      docs, and a codemod where possible.
- [ ] Per flag, on `next`, inline the v12 branch and delete the flag: remove the
      runtime check, the Sass guard, the React `FeatureFlags` prop, the Web
      Components attribute, the `feature-flags.yml` entry, and the
      `*.featureflag.stories.*` / `*.feature-flag.stories.*` file. Flags to
      retire, in rough order of blast radius: `enable-v12-overflowmenu`,
      `enable-v12-tile-radio-icons`, `enable-v12-dynamic-floating-styles`,
      `enable-v12-tile-default-icons`,
      `enable-v12-toggle-reduced-label-spacing`,
      `enable-v12-structured-list-visible-icons`.
- [ ] Handle the unprefixed v12 flag. `enable-focus-wrap-without-sentinels` is
      listed in `unprefixedV12Flags` in `FeatureFlagScope.ts` and
      `$unprefixed-v12-flags` in `index.scss`. Both lists, and the two parallel
      implementations of `isV12Flag`, go away with the flag.
- [ ] Remove `enable-v12-release` itself, plus `enableV12Release` on the React
      `FeatureFlags` component, the `enable-v12-release` Web Components
      attribute, and `FeatureFlagsElement.flagComponentMap` entries for
      attribute-driven v12 Sass.
- [ ] Decide the fate of the stale flags that predate this effort:
      `enable-v11-release` (6 files), `enable-css-grid` (9 files), and
      `enable-css-custom-properties` (6 files). A major is the only chance to
      remove `enable-v11-release`.
- [ ] Keep non-v12 flags working. `enable-dialog-element`, `enable-presence`,
      `enable-tile-contrast`, `enable-treeview-controllable`, and
      `enable-enhanced-file-uploader` stay opt-in in v12, so the feature flag
      machinery itself must survive the cleanup. Their `Feature Flag` Storybook
      sections stay too.
- [ ] Remove the deprecated flag aliases `enable-experimental-tile-contrast` and
      `enable-experimental-focus-wrap-without-sentinels`.
- [ ] Remove the deprecated `FeatureFlags` type alias in `FeatureFlagScope.ts`
      and the `unstable_FeatureFlags` / `preview_FeatureFlags` export aliases in
      `packages/react/src/index.ts`, which are already marked as removable in
      v12.

### 2. Public API surface

This is the largest single block of remaining v12 work and it is tracked in
code, not in an issue.

- [ ] Ship the IBM Products components.
      `packages/react/product-migrated-components.mjs` excludes 20 component
      directories from the published build, and `packages/react/src/index.ts`
      has 12 `TODO: uncomment in v12` markers covering `AddSelect`, `ActionSet`,
      `BigNumber`, `ConditionBuilder`, `Coachmark`, `EditInPlace`,
      `FullPageError`, `Guidebanner`, `InterstitialScreen`,
      `NotificationsPanel`, `OptionsTile`, `PageHeader`, `Resizer`,
      `ScrollGradient`, `SidePanel`, `Tearsheet`, `TagOverflow`,
      `TruncatedText`, and `UserAvatar`. The file documents the two steps per
      component: drop the entry from `excludeProductsComponents`, add the export
      to `src/index.ts`. Note that these are excluded on `next` as well as
      `main`, so the v12 rehearsal branch does not currently publish them.
- [ ] Reconcile `preview__*` and `unstable__*` exports. Decide for each whether
      it graduates to a stable name, stays prefixed, or is removed. `Card`,
      `DatePicker/next`, `Dialog`, the `Fluid*` family, and
      `unstable__PageHeader` / `preview__PageHeader` (pointing at
      `PageHeaderDeprecated`) all need a call.
- [ ] Remove `unstable_Pagination` / `preview_Pagination` and
      `unstable_PageSelector` / `preview_PageSelector`.
      [`docs/migration/v12.md`](migration/v12.md#react-pagination-preview-apis)
      already documents these as removed, but they are still exported from
      `packages/react/src/index.ts` on `next`. Either do the removal or correct
      the doc.
- [ ] Audit every `deprecate()`-wrapped prop and `@deprecated` JSDoc tag across
      `@carbon/react` and decide removal versus carry-forward, then update the
      public API snapshot.
- [ ] Finish the `@carbon/web-components` v3 surface: the `@customElement`
      decorator removal and `register`-based imports, the pure exports API, the
      `registration-coverage` task, and the barrel-import codemods. Cross-check
      against [`docs/guides/cwc-v3-migration.md`](guides/cwc-v3-migration.md).
- [ ] Verify React and Web Components parity for every v12 behavior change, per
      the dual-flagship policy in [`AGENTS.md`](../AGENTS.md). Several entries
      in the migration doc land in only one package today.
- [ ] Remove Sass deprecations: deprecated mixins, functions, tokens, and any
      `@warn` shims kept for v11 compatibility.

### 3. Tests

- [ ] Get `next` to a fully green run of the complete `main` check set, not just
      the five checks its ruleset currently requires. Until AVT and Chromatic
      run on `next`, the rehearsal branch is not proving what it needs to prove.
- [ ] Regenerate the `@carbon/react` public API snapshot on `next` once the
      export changes in workstream 2 land. Expect a very large diff and review
      it deliberately — it is the main guard against accidental breaking
      changes.
- [ ] Strip `<FeatureFlags enableV12Release>` and per-flag wrappers out of unit
      tests as each flag is deleted. `next` already carries a large set of test
      adjustments from the `feat: set up v12 release branch` commit; expect more
      of the same shape.
- [ ] Re-check the Floating UI `useFloating` mock added to
      `config/jest-config-carbon/setup/setupAfterEnv.js` on `next`. It exists
      because `enable-v12-dynamic-floating-styles` being on by default pushed
      positioning work outside `act()`. Decide whether it is the permanent
      answer or a stopgap, and whether it should be merged back to `main`.
- [ ] Rebaseline Chromatic for v12. Every flag that changes visual output
      produces snapshot churn. Decide whether to accept a single large baseline
      at cutover or rebaseline incrementally on `next`.
- [ ] Point AVT at the v12 Storybook. AVT currently builds the default
      (`.storybook`) React Storybook. During the transition the v12 surface
      needs its own accessibility verification.
- [ ] Review `e2e/` tests for assumptions about v11 DOM structure, class names,
      and component composition.
- [ ] Review `packages/web-components` Web Test Runner snapshots for the same.
- [ ] Decide what unit-test coverage looks like for the remaining opt-in flags
      once the `enable-v12-release` escape hatch is gone.

### 4. CI and repository automation

- [ ] Bring `next` branch rules up to `main`'s bar before cutover. Add `avt`,
      `UI Tests: @carbon/react`, and `chromatic-react` to the
      `next: pull requests, checks, merge queue` ruleset so the two branches
      gate identically. This also means the post-cutover `main` inherits the
      right rules.
- [ ] Decide how `main`'s protection and `next`'s rulesets are reconciled at
      cutover. `main` is on classic branch protection; `next` is on rulesets.
      Converging both onto rulesets before cutover removes a class of
      release-day surprise.
- [ ] Add `v11` to the `push` and `pull_request` branch triggers in
      `.github/workflows/ci.yml` so the LTS branch keeps running CI, mirroring
      how `v10-ci.yml` works today.
- [ ] Decide between a dedicated `v11-ci.yml` (the v10 precedent) and extending
      `ci.yml`. The v10 approach froze a copy of CI at the branch point, which
      ages well for an LTS branch but duplicates maintenance.
- [ ] Update Chromatic's `autoAcceptChanges: '{main,next}'` in `ci.yml` for the
      new branch names.
- [ ] Retire or repoint the automerge cron. After cutover there is no
      `main`→`next` relationship. Either delete
      `.github/workflows/automerge.yml` or repurpose it for a new `next` cut for
      v13.
- [ ] Rework the v12 tag guards. `release.yml` has six
      `startsWith(github.ref_name, 'v12') == false` conditions plus a
      `DIST_TAG=v12-alpha` branch, and `publish-web-components-cdn.yml` excludes
      `v12*` tags. All of these invert at cutover: v12 becomes the normal path
      and v11 becomes the special case.
- [ ] Rework the v10 tag guards too. `deploy-react-storybook.yml` and
      `deploy-web-components-storybook.yml` both ignore `!v10*`; they will need
      `!v11*` handling once v11 storybooks are published from the LTS branch.
- [ ] Decide the fate of `next-release.yml` once alpha releases stop.
- [ ] Set up `version.yml`, `version-patch.yml`, and `release.yml` for a v11
      patch stream on the `v11` branch, mirroring `v10-version.yml` and
      `v10-release.yml`.
- [ ] Review `nightly-release.yml`. It publishes a canary `minor` from the
      default branch to the `nightly` dist-tag, so it follows the cutover
      automatically; confirm that is wanted.
- [ ] Update `actions/promote` for the new major. It has a hardcoded `denylist`
      of `carbon-components` and `@carbon/icons-vue`.
- [ ] Review the `renovate.json5` and `dependabot.yml` configuration for base
      branch assumptions, and decide whether dependency updates should also
      target the `v11` LTS branch.
- [ ] Update `.github/CODEOWNERS`, `.github/labeler.yml`, and the issue and PR
      templates for any branch-name or version references.
- [ ] Check `codeql-analysis.yml`, `mend-scan.yml`, `metrics-*.yml`, and
      `code-connect.yml` for branch pins.

### 5. Storybook and published sites

- [ ] Promote `.storybook-v12` to `.storybook`. On `next`, retire the parallel
      config: fold `.storybook-v12/preview.js`, `main.ts`, `theme.js`, and the
      manager head files into the default config and delete the v12-specific
      ports (`3012`, `6012`) and the `storybook:v12*` scripts in both
      `packages/react/package.json` and `packages/web-components/package.json`.
- [ ] Retire `tasks/prepare-v12-storybook.mjs`. Once flags are inlined there are
      no feature-flag stories to promote, no `🚀` prefixing, and no
      `.storybook-v12/generated/` output. Move anything still needed from
      `.storybook-v12/stories/` and `.storybook-v12/deprecated/` into `src/`.
- [ ] Remove the `🚀 enable-v12-release` toolbar indicator and the hardcoded
      `@carbon/react v2.x` / `@carbon/web-components v3.x` titles in favor of
      the normal version source.
- [ ] Remove `productMigratedStoryGlobs` from
      `packages/react/product-migrated-components.mjs` once those stories appear
      in the default Storybook, and drop the **Migrated** sidebar badge.
- [ ] Plan the domain swap. `react.carbondesignsystem.com` and
      `web-components.carbondesignsystem.com` must serve v12;
      `v12-react.carbondesignsystem.com` and
      `v12-web-components.carbondesignsystem.com` should redirect rather
      than 404. Decide whether v11 storybooks get a versioned domain, as v10 did
      with `v7-react.carbondesignsystem.com`.
- [ ] Delete `deploy-v12-storybooks.yml` after the default storybook deploys
      cover v12, and keep the `.nojekyll` / `CNAME` handling it does.
- [ ] Re-point Storybook-embedded docs. `docs/feature-flags.md` is rendered into
      a Storybook docs page and its table of contents is maintained by hand; the
      flag table will change substantially.

### 6. Migration tooling

- [ ] Verify each v12 codemod against real consumer code:
      `enable-v12-overflowmenu`, `enable-v12-release`,
      `enable-v12-structured-list-visible-icons`,
      `enable-v12-tile-default-icons`, and `enable-v12-tile-radio-icons`.
- [ ] Decide what the `enable-v12-release` codemod should do after the flag no
      longer exists. A v11 project running it today adds the flag; a v12 project
      needs the opposite — removal of now-meaningless flag props and Sass
      configuration.
- [ ] Write the missing codemods, or explicitly accept them as manual. Today
      `enable-v12-dynamic-floating-styles` and
      `enable-v12-toggle-reduced-label-spacing` have none, and Web Components
      and Sass migrations are manual across the board.
- [ ] Add codemods for the Pagination preview API removal
      (`unstable-pagination-to-pagination` exists) and for the IBM Products
      import moves from `@carbon/ibm-products` to `@carbon/react`. Several
      `ibm-products-update-*` transforms already exist and need to be wired into
      a single documented v12 upgrade path.
- [ ] Provide a single entry point. A consumer should be able to run one
      `@carbon/upgrade` command to get from v11 to v12, with the individual
      codemods available for partial adoption.
- [ ] Update `packages/upgrade/README.md` and `telemetry.yml`.

### 7. Documentation

- [ ] Reconcile [`docs/migration/v12.md`](migration/v12.md) against the actual
      state of `next`. At least one documented change (Pagination preview API
      removal) is not yet true in the code. Do a full pass, section by section,
      verifying each claim against the branch.
- [ ] Add the gaps. The IBM Products components, the Web Components v3 import
      and registration changes, the removal of `enable-v12-*` flags as consumer
      API, and Node or browser support changes are consumer-visible and either
      missing or thin.
- [ ] Rewrite [`docs/working-with-v12.md`](working-with-v12.md). Almost all of
      it describes machinery that disappears at cutover. It likely becomes a
      short note plus a new `docs/working-with-v13.md` when the next preview
      starts.
- [ ] Update [`docs/release.md`](release.md). Replace the v10 sections with v11
      LTS sections, update the tag examples from `v11.x` to `v12.x`, and
      document the v11 patch release path.
- [ ] Update [`docs/release-schedule.md`](release-schedule.md): move v11 from
      Active to Maintenance with an LTS designation and real dates, move v12
      from Preview to Active, and regenerate the schedule graph.
- [ ] Update [`docs/feature-flags.md`](feature-flags.md) to drop retired flags
      and fix the Storybook docs table of contents.
- [ ] Update [`docs/preview-code.md`](preview-code.md),
      [`docs/experimental-code.md`](experimental-code.md), and
      [`docs/package-structure.md`](package-structure.md) for any prefix or
      entrypoint changes.
- [ ] Record the cutover approach as an ADR in `docs/decisions/`, since it sets
      the precedent for v13.
- [ ] Coordinate
      [`carbon-website`](https://github.com/carbon-design-system/carbon-website)
      content, versioned docs, and the v11 archive.
- [ ] Coordinate `gatsby-theme-carbon`, `@carbon/ibm-products`, and
      `@carbon/ibm-products-web-components` so downstream packages have a v12
      story on release day.
- [ ] Write the release announcement, the blog or Medium post, and the Slack
      announcements for `#carbon-announcements`, `#carbon-design-system`,
      `#carbon-react`, and `#carbon-web-components`.

### 8. Packages and publishing

- [ ] Fix the version plan per package. `lerna version prerelease` on `next` has
      been bumping every package, including ones that should probably not go to
      a new major: `carbon-components` is at `12.0.0-alpha.3`,
      `carbon-components-react` at `9.0.0-alpha.3`, and `@carbon/icons-vue` at
      `11.0.0-alpha.1`, yet `carbon-components` and `@carbon/icons-vue` are on
      the `actions/promote` denylist and `docs/release.md` says never to promote
      `carbon-components`.
- [ ] Decide whether the deprecated re-export packages `carbon-components` and
      `carbon-components-react` ship a v12 at all, or reach end of life with
      v11.
- [ ] Decide the same for `@carbon/icons-vue`.
- [ ] Plan npm dist-tags end to end. Today `latest` means v11, `next` means a
      v11 release candidate, `v12-alpha` means the rehearsal releases, and
      `nightly` means the default-branch canary. After cutover `latest` must
      mean v12, v11 needs its own tag (`v11` or `lts`), and `v12-alpha` should
      be retired. Write the exact `npm dist-tag` sequence in advance.
- [ ] Decide the prerelease ladder from `v12.0.0-alpha.3`: more alphas, then
      betas and release candidates, and for how long.
      [`docs/release-schedule.md`](release-schedule.md#prerelease) notes v11's
      prerelease phase was eight months and states the intent to extend it.
- [ ] Verify published artifacts. Check the `files` field, built output, `.d.ts`
      files, and `sass` entrypoints for every package once the IBM Products
      exclusions are removed —
      `chore: specify files to publish for themes,     layout, motion` on `next`
      suggests this is already an active source of bugs.
- [ ] Verify peer dependency ranges, including the recent change making `sass`
      an optional peer dependency.
- [ ] Verify the CDN publish path for `@carbon/web-components` v3, including the
      `tag/v2` prefix hardcoded in `publish-web-components-cdn.yml`.
- [ ] Verify the icons and pictograms CDN publish path, which embeds a version
      segment.
- [ ] Verify npm provenance and the IBM telemetry `postinstall` hooks still work
      from the new branch.
- [ ] Smoke-test installation from a clean project for `@carbon/react`,
      `@carbon/web-components`, and `@carbon/styles` against the real registry,
      not just the monorepo.
- [ ] Verify the `examples/` fixtures build against v12.

### 9. v11 LTS readiness

- [ ] Confirm the LTS designation and support window with stakeholders, per the
      [LTS section](release-schedule.md#long-term-support) of the release
      schedule.
- [ ] Decide what the `v11` branch accepts: security fixes, critical bugs, and
      requested non-critical fixes, matching the documented Maintenance policy.
- [ ] Define the backport workflow. There is no cherry-pick automation today;
      the v10 precedent was fully manual.
- [ ] Stand up v11 CI, release, and version workflows on the `v11` branch and
      verify at least one end-to-end v11 patch release after cutover.
- [ ] Add branch protection for `v11`.
- [ ] Decide whether v11 storybooks stay published and at what domain.
- [ ] Update issue templates and triage labels so v11 bug reports can be
      distinguished from v12 ones.
- [ ] Decide the v10 cleanup. `v10-ci.yml`, `v10-release.yml`,
      `v10-version.yml`, and `v10-deploy-react-storybook.yml` are for a release
      line that reached end of life in September 2024, and `docs/release.md`
      already says its content should be removed in the next major.

## Cutover plan

### Why not just rename the branches

Renaming `main` to `v11` and `next` to `main` is the obvious move and it almost
works, but three GitHub behaviors make it risky:

1. **Open pull requests follow the rename.** GitHub retargets open PRs when a
   branch is renamed. Renaming `main` to `v11` would retarget all ~110 open PRs
   to the LTS branch. Renaming `next` to `main` afterwards does not bring them
   back, so every one of them would need manual retargeting, and any that were
   merged in the interim would land on the wrong branch.
2. **Branch rules follow the rename too.** GitHub updates rules that explicitly
   reference the renamed branch. `main`'s classic protection would move to
   `v11`, and `next`'s weaker ruleset — no `avt`, no `chromatic-react` — would
   move to `main`. The new default branch would silently end up with less gating
   than it has today.
3. **Two renames means a window where `main` does not exist.** Anything that
   triggers on `main` during that window (workflows, external integrations,
   webhooks, bots) is operating against a missing ref.

Renaming also creates redirects from the old names, which is useful for links
but means `main` and `next` are not cleanly reusable afterwards — and `next` is
wanted again for v13.

### Recommended cutover

Keep `main` as the default branch for its entire life and move the code instead.
This is also what happened for v10: a `v10` branch was cut and `main` carried on
as v11.

Because the automerge cron keeps `next` as a strict superset of `main`, `next`
is normally a descendant of `main`, which makes the content move a fast-forward
with no merge, no squash, and no conflict resolution. As of this writing `next`
is 10 commits ahead of and 4 commits behind `main` — the cron simply has not run
since those four landed. One final automerge makes `next` a strict descendant
and the fast-forward available.

The shape of the cutover is then:

1. Cut `v11` from the final v11 release commit on `main`.
2. Fast-forward `main` to `next`.
3. Delete `next`, or leave it for a moment and then re-cut it for v13.

Nothing retargets, nothing loses protection, and the default branch never
disappears. The cost is that the ~110 PRs open against `main` wake up on a v12
base. That is unavoidable in any approach — those changes have to be evaluated
against v12 regardless — but it argues for draining the queue aggressively
beforehand and for freezing merges during the cutover window.

### Release day runbook

This is a skeleton to be filled in and rehearsed, not a finished procedure.

**Before the day**

- [ ] Ship the final v11 minor from `main` through the normal
      [release process](release.md) and let it settle.
- [ ] Drain the `main` PR queue as far as possible. Merge, close, or explicitly
      accept each remaining PR as needing a v12 rebase. Pay particular attention
      to Renovate and Dependabot PRs, which are cheapest to close and recreate.
- [ ] Confirm `next` is green on the full `main` check set, including AVT and
      Chromatic.
- [ ] Confirm `next` branch rules match `main`'s.
- [ ] Rehearse the whole sequence on a scratch pair of branches in a fork, and
      time it.
- [ ] Announce the freeze window.

**On the day**

- [ ] Freeze merges to `main` and `next`. Pause the merge queue.
- [ ] Run the automerge workflow manually one last time and confirm
      `git merge-base --is-ancestor origin/main origin/next` succeeds, so the
      fast-forward is available.
- [ ] Disable the automerge cron.
- [ ] Tag the final v11 commit if it is not already tagged.
- [ ] Create and push the `v11` branch from that commit.
- [ ] Apply branch protection to `v11`.
- [ ] Fast-forward `main` to `next` (requires a bypass actor on `main`, the same
      way the automerge workflow bypasses `next`).
- [ ] Verify `main` now contains the v12 tree and that CI passes on it.
- [ ] Run the version workflow for `v12.0.0` and tag it.
- [ ] Verify the release workflow published to npm.
- [ ] Move npm dist-tags: `latest` to v12, and a v11 tag to the final v11
      versions.
- [ ] Verify the storybook deploys and the domain swap.
- [ ] Verify the CDN publishes.
- [ ] Unfreeze `main`.
- [ ] Delete or re-cut `next`.
- [ ] Update the release radar wiki, publish the announcement, and post to
      Slack.

### Rollback

- [ ] Write this section. At minimum: what gets reverted if the v12 publish
      fails midway, how `main` is restored (the pre-cutover commit is preserved
      on `v11`, so `main` can be reset to it), and how npm dist-tags are moved
      back. npm versions cannot be unpublished after 72 hours, so the realistic
      rollback is a dist-tag move plus a v12 patch.

## Post-cutover cleanup

- [ ] Cut a new `next` for v13 and re-point the automerge cron at it.
- [ ] Add `docs/working-with-v13.md` and start the `enable-v13-*` flag
      convention.
- [ ] Remove the v12-era scaffolding listed in workstreams 1 and 5 if any
      survived the cutover.
- [ ] Watch for regressions and plan the first v12 patch, per the
      [post-release guidance](release.md#post-release).

## Decisions still needed

These block parts of the plan above and are listed separately so they are easy
to find.

- Does v12 ship with the IBM Products components exported, or do they stay
  excluded past 12.0.0? The answer changes the size of the release and the
  migration doc substantially.
- How long is the prerelease ladder from alpha to 12.0.0, and what are the beta
  and release candidate gates?
- Is v11 an LTS release, and what is the support window?
- Do `carbon-components`, `carbon-components-react`, and `@carbon/icons-vue`
  ship a v12, or reach end of life with v11?
- Which npm dist-tag identifies the v11 line after cutover?
- Does v12 change the minimum supported Node version, browser support, or peer
  dependency ranges on React or Lit? Any of these is a migration-doc entry.
- Do the v12 storybook domains redirect, and does v11 get a versioned domain?
- Is the per-release-line CI split (`v11-ci.yml`) worth the duplication, or
  should `ci.yml` grow a branch matrix?
