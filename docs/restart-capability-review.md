# Restart capability re-review (source only)

## Decision

Functional `/restart` is **not implemented or release-ready**. This review did not add another refusal implementation, helper, dependency, or runtime path. The existing refusal-only changes are preserved, along with voice intake, silent startup and native ping.

The old conclusion that shell executable attestation alone makes restart impossible was too broad. A user-approved, conventional `pi` shell-launch contract is technically usable with `herdr agent start`. What that contract does **not** provide is an exclusive, conditional same-shell launch. Choosing that weaker contract must be explicit; it is not equivalent to the requested verified identity/session/cwd isolation.

## Evidence rechecked

- Installed CLI: Pi **1.0.4**, herdr **0.9.1**. The checkout's development Pi dependency remains `^0.84.4`; passing its typecheck is not a runtime compatibility test against the installed CLI.
- Read installed Pi 1.0.4 `extensions.md`, `cli.md`, `cli-integration.md`, `sessions.md`, `session-format.md`, `sdk.md`, the shutdown example and relevant installed extension declarations/interactive shutdown implementation. No missing Pi-specific restart API is being treated as a blocker.
- `ctx.shutdown(): void` is public. The ordinary interactive extension shutdown handler sets the shutdown request and immediately starts shutdown when idle. It is therefore usable from a native idle control callback; a synthetic model turn is unnecessary. There is no public cancellable shutdown reservation or host-wide admission lock. The separately built shortcut context is not the ordinary extension event context.
- `--session <absolute path>` is supported. A fresh interactive invocation with only that argument avoids replaying original prompts, `@files`, RPC/print modes and ambiguous `--continue`. In-memory sessions must refuse. Canonical cwd and bounded session header/ID checks are independently implementable.
- `herdr agent start --help`, bundled skill and `herdr api schema --json` (protocol **22**) were examined. `AgentStartParams` has only `name`, `kind`, `pane_id`, `args`, `timeout_ms`; no executable/cwd override, expected shell identity, conditional pane generation or request-id deduplication contract.
- Public source was read at tagged **v0.9.1**: `src/app/agents.rs::start_agent`, `src/platform/mod.rs::{available_pane_shell_from_job,interactive_unix_shell_command}`, `src/platform/linux.rs::{interactive_shell_command,shell_quote}`, and `src/app/api_helpers.rs::{encode_api_text,encode_api_submission}`. This is tagged-source evidence, not an independently reproducible build attestation of the installed binary.
- The public stable documentation index currently identifies **0.9.5**. Its tagged `src/app/agents.rs::start_agent` was also checked: the relevant canonical-executable/shell-command submission mechanism remains. No installation or server upgrade was attempted; installed client version does not establish live server capability.

Source links:

- <https://github.com/herdrdev/herdr/blob/v0.9.1/src/app/agents.rs>
- <https://github.com/herdrdev/herdr/blob/v0.9.1/src/platform/mod.rs>
- <https://github.com/herdrdev/herdr/blob/v0.9.1/src/platform/linux.rs>
- <https://github.com/herdrdev/herdr/blob/v0.9.1/src/app/api_helpers.rs>
- <https://github.com/herdrdev/herdr/blob/v0.9.5/src/app/agents.rs>

## What the supported launch actually does

Herdr rejects an already recognized agent or pending managed launch. It checks that its terminal child is the sole foreground shell process, constructs argv with canonical executable `pi`, quotes arguments for the shell, and sends command text plus Enter to that terminal. It marks a managed launch before writing. This is a useful supported API, not a raw shell-injection workaround.

Argument quoting handles spaces and apostrophes; control characters are rejected. It does **not** replace executable resolution with an absolute executable. `pi` can resolve through shell PATH, functions, aliases or cached commands. That is a compatibility/trust assumption which can be explicitly accepted, rather than a requirement for impossible universal attestation.

However, foreground-shell detection is not an empty-command-line attestation. The submission helper sends text (optionally bracketed paste) and Enter; it does not verify an empty shell editor or reserve its input. Existing or racing input can therefore be combined with the command. The API also cannot condition launch on the exact shell PID/start identity and canonical cwd previously observed by a helper. A pre-launch observation followed by a request has a race; the server's own busy check narrows but does not close it. It does not establish that shell hooks will leave cwd unchanged when executing the submitted command.

Stable pane IDs and the server's managed-launch guard help prevent obvious wrong-pane and concurrent starts. They do not make multiple API calls a transaction, fence user input/other clients, or attest successful exact-session execution. An uncertain start must never be retried.

## Concrete choices for main/owner

### A. Supported shell-contract mode, with explicitly reduced guarantees

Approve Linux only, one documented POSIX shell configuration, a conventional trusted `pi` launcher in that shell, no `pi` alias/function/wrapper adding prompts, no automatic cwd-changing hooks, and exclusive hands-off access to that pane from admission through readiness. User must accept that the extension cannot enforce those shell/input conditions and that observation-to-launch races remain. Do not advertise verified/atomic same-shell launch under this option.

Then implement the native callback and directly spawned standalone `.mjs` one-shot helper. Capture original Pi PID/start identity and herdr context inside the original extension, never from a background task. Use bounded identity-only reads, same persistent session/cwd checks, IPC readiness/commit handshake, final synchronous own-admission fence plus idle/pending checks, then public shutdown. Observe exact old-process exit, revalidate pane/shell/cwd, and call `agent start` once with only `--session <absolute saved path>`. Never replay original argv or interpolate a shell command. No force kill, launch retries or indefinite late restart. Verify the resumed session via local/native status after startup; an API readiness response alone does not verify Telegram reconnect or exact session.

This is a real possible implementation path, **not yet implemented or accepted as the requested safety contract**. A helper state machine and mock success tests alone would not resolve the shell/input limitation. Main should obtain this narrowed-contract decision before implementing it rather than silently treating all environmental conditions as attested.

### B. Preserve the stronger isolation requirement (recommended for unattended restart)

Minimum herdr addition: a documented conditional one-shot launch operation accepting expected server/terminal generation, shell process identity (including start identity, not PID alone), expected canonical cwd, explicit executable plus argv, and a single-use request ID/deadline. Server must reject stale/busy/input-conflicting state at the launch boundary and prevent competing input/launch until submission. It must report `not_submitted` versus `submitted_or_uncertain` and retain enough request state to query, not retry, uncertain submissions. Execution must not append to an unverified editable shell line; this needs a documented shell cooperation mechanism or equivalent server-owned launch boundary, not merely another preflight check or an `--executable` flag.

These are proposed upstream semantics, **not existing flags/endpoints**. An explicit executable alone solves routing compatibility but not shell/input/cwd identity isolation. No external project was modified.

If zero host-wide admission race is also mandatory, Pi additionally needs an idle-only shutdown reservation: atomically reject when running/pending, prevent new input/session replacement, return a token, support bounded commit/cancel, and guarantee cleanup before exit. Current public shutdown plus final idle checks is usable only with a documented race limitation; an extension cannot freeze other producers. A helper timeout can disarm relaunch but cannot cancel an already requested host shutdown.

### C. Ship other changes, defer restart

Review voice intake and silent startup/ping independently. Do not describe the current refusal command as completed restart. Main must decide whether to remove its menu/help registration from a release or explicitly retain it as unavailable. This review did not remove existing work. Resolve audit findings before claiming release readiness.

## Required tests after choosing A or implementing B

Mock the actual helper boundary, not only policy: original-runtime capture, persistent session header/ID/canonical cwd, shell PID reuse, pane replacement/movement, launcher/argv quoting (spaces/apostrophes/control chars), helper spawn/handshake failure, timeout before/after shutdown commit, original process still alive, duplicate requests, stale connection/session/lease, incoming receipt/download/update/host-pending guards, teardown ordering, exact exit then exactly one launch, uncertain API submission with no retry, cancellation with no delayed launch, and helper private-log bounds. Package the helper as runnable JavaScript explicitly; the current `src/**/*.ts` allowlist and Pi's in-process TypeScript loader do not package/run a Node helper automatically.

## Proposed live test and recovery (not performed)

Only after main review and separate owner approval: use a disposable saved session in an explicitly identified existing Linux herdr shell pane. Record exact project/session/old Pi and shell identities locally, verify idle/pending state and launcher routing in that shell without exposing credentials. Keep another local control terminal available. Test busy refusal first, then one idle restart; confirm old Pi exits before the replacement, same pane/shell/project/session, no original prompt replay, one poller/lease and native `/ping`. Do not retry an uncertain launch. A real updated-version test requires separately authorized installation; a same-version restart does not verify update routing.

On failure, wait until the bounded helper deadline has passed and verify no helper/launch remains before manual recovery. If old Pi is alive, leave it running and inspect sanitized local diagnostics. If it exited, verify the pane is an available empty shell, locally `cd` to the exact project and run the approved `pi --session <absolute saved session>` once. Do not delete lease files, force kill, use `--continue`, or start a competing session because a Telegram reply is absent.

## Validation and release scope

Fresh unchanged-runtime validation: `npm run validate` passed typecheck and **226 tests**, zero skipped; `npm run pack:check` passed with **41 files**; `git diff --check` passed. These validate existing refusal/voice/ping work, not a restart helper or successful restart.

**Audit failed:** `npm audit --audit-level=moderate` reports **4 vulnerabilities (1 moderate, 3 high)**: production `sharp` and development-tree `brace-expansion`, `undici`/Pi. `npm audit --omit=dev --audit-level=moderate` independently reports **1 high** in `sharp` (`GHSA-wq5f-xc86-pv6w`, fixed range starts at 0.35.5). No audit fix/install/lockfile change was made. The full audit proposes a breaking Pi development dependency update for some findings; main must review remediation and revalidate rather than apply `--force` blindly. Previous clean-audit checkpoints are historical.

Existing uncommitted release scope includes refusal-only restart, inert voice intake, silent connection startup/native ping and documentation, with blocked instance-following investigation only. This review adds documentation only. No live pane/process/argv/environment inspection, restart, shutdown, launch, Telegram message, installation, reload, commit, push, version bump or publication occurred. Public 0.6.1 evidence is unchanged.
