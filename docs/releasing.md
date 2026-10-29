# Releasing Pi Telegram

## Tag-driven contract

Starting with 0.6.8, releases use **push one
matching version tag → GitHub Actions validates → npm publishes automatically**.
The workflow remains `.github/workflows/publish.yml`. There is no manual dispatch
or `release.published` trigger. Creating release notes for an existing tag does
not publish again.

The 0.6.7 manual release completed and was verified before this transition.
Do not tag 0.6.7 to test the new workflow. A local workflow edit is not activation;
the tagged commit must contain it.

The `v*` trigger admits candidate tags; the guard requires an exact
`v${package.version}` stable `x.y.z` tag (no leading zeroes, prerelease or build
suffix). Both lockfile version/name records must match the manifest. Checkout
uses the event SHA, not the moving `main` branch. `npm ci`, typecheck/tests,
moderate-or-higher audit and package dry-run must succeed before publication.

## Authorized release procedure

1. Obtain authorization for the release, commit/push and version tag. Confirm the
   intended version is unused on npm and the tag does not already exist remotely.
2. On `main`, bump `package.json` and both root `package-lock.json` version records
   together, update the changelog/release documentation, and review the diff.
   `npm version <new-stable-version> --no-git-tag-version` can prepare the version
   without creating a commit/tag. Do not include private runtime state or artifacts.
3. Run `npm ci`, `npm run validate`, `npm audit --audit-level=moderate`,
   `npm run pack:check` and `git diff --check`. Review package contents.
4. Commit only the reviewed release files and push `main`. Wait for its CI to pass.
   Confirm the intended release commit contains the tag-driven workflow.
5. Create an annotated tag named exactly `v<new-stable-version>` at that reviewed
   commit, then push **only that tag**, for example:

   ```bash
   git tag -a vX.Y.Z <reviewed-release-commit> -m "Release X.Y.Z"
   git push origin refs/tags/vX.Y.Z
   ```

   Replace the placeholders; pushing the tag is the publication action. Do not
   dispatch a workflow or create a second publication trigger. Push one release
   at a time; this workflow does not enforce main ancestry or monotonic versions.
6. Verify the tag workflow result, public npm version/latest, tarball hashes and
   contents against the tagged commit, and provenance linkage. Record evidence
   and limitations only after verification. Publication does not install/reload Pi.

Treat version tags as immutable. Restrict their creation/update/deletion with
repository rulesets and protect reviewed `main`/workflow changes. Tag push rights
are release rights; the manifest guard is not an authorization boundary.

On failure or uncertain delivery, inspect the run and public registry read-only.
Registry visibility can lag. **Do not blindly rerun, delete/recreate/force-push a
tag, retry the same published version, or fall back to manual npm publication.**
Resolve the cause and obtain an explicit recovery decision; never reuse an npm
version that has already been published.

## Trusted Publishing

Keep GitHub-hosted runners, `contents: read`, `id-token: write`, the filename
`publish.yml`, token-free npm invocation and `--provenance`. No npm secret is
needed. Existing sanitized diagnostics remain unchanged.

The [npm Trusted Publishers documentation](https://docs.npmjs.com/trusted-publishers/)
reviewed for this change lists GitHub organization/user, repository, workflow
**filename**, optional environment and allowed actions. It lists no branch/tag
ref field. Therefore switching the trigger alone is not expected to require a
publisher mapping change: retain `mbundgaard/pi-telegram`, `publish.yml`, the
existing blank environment and permission to publish directly. Historical
`comput-sh` instructions are not the current repository identity.

This is documentation-based compatibility evidence, **not a successful tag OIDC
publication test** or an inspection of current account settings. Main-ref
publication history does not prove tag-ref acceptance. If repository/environment
policies restrict refs, an owner must review those separately; do not add secrets
or weaken authentication to work around a rejection.

## Offline guard regression check

Run from the repository root. This extracts the actual workflow guard, checks
trigger/checkout invariants and runs dummy manifests in a temporary directory.
It creates no Git tags, installs nothing and never invokes npm publication.

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const workflow = readFileSync('.github/workflows/publish.yml', 'utf8');
assert.match(workflow, /on:\n  push:\n    tags: \['v\*'\]/);
assert.doesNotMatch(workflow, /workflow_dispatch:|\n  release:/);
assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
const guard = workflow.match(/node --input-type=module <<'NODE'\n([\s\S]*?)\n          NODE/)[1]
  .replace(/^          /gm, '');
const dir = mkdtempSync(join(tmpdir(), 'pi-release-guard-'));
let count = 0;
function check(ok, version = '1.2.3', ref = `refs/tags/v${version}`, mutate = () => {}, event = 'push', type = 'tag') {
  const pkg = { name: '@fixture/package', version };
  const lock = { ...pkg, packages: { '': { ...pkg } } };
  mutate(lock);
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify(lock));
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', guard], {
    cwd: dir, encoding: 'utf8',
    env: { GITHUB_EVENT_NAME: event, GITHUB_REF_TYPE: type, GITHUB_REF: ref },
  });
  assert.ifError(result.error);
  assert.equal(result.status === 0, ok, `case ${++count}`);
}
try {
  check(true);
  check(true, '0.0.0');
  check(true, '10.20.30');
  for (const v of ['01.2.3', '1.02.3', '1.2.03', '1.2', '1.2.3-rc.1', '1.2.3+build', 'v1.2.3', '1.2.3\n', 123]) check(false, v);
  for (const ref of ['refs/tags/v1.2.4', 'refs/tags/1.2.3', 'refs/heads/v1.2.3', 'refs/tags/v1.2.3/extra']) check(false, '1.2.3', ref);
  for (const mutate of [l => l.version = '9.0.0', l => l.packages[''].version = '9.0.0', l => l.name = 'other', l => l.packages[''].name = 'other', l => delete l.packages]) check(false, '1.2.3', undefined, mutate);
  check(false, '1.2.3', undefined, undefined, 'workflow_dispatch');
  check(false, '1.2.3', undefined, undefined, 'push', 'branch');
  console.log(`${count} guard cases passed; trigger and exact-SHA checkout assertions passed`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
NODE
```

These checks do not emulate GitHub's scheduler or npm OIDC. The first separately
authorized new-version tag release remains the live end-to-end verification.
