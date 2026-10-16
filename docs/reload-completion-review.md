# Explicit Telegram reload acknowledgement

## Implemented narrowed contract (unreleased)

Main accepted option A: `Telegram reloaded · v<loadedVersion>` means only that a **fresh Pi Telegram factory loaded and its same assignment is ready**, not that all Pi/core/UI reload work succeeded. The runtime implementation now exists in `src/reload-intent.ts`, `src/index.ts`, `src/connection-manager.ts` and `src/telegram.ts`.

A versioned `globalThis[Symbol.for(...)]` namespace deliberately owns a bounded map (maximum 32 entries) in this Node process. This is an explicitly accepted application-owned mechanism, not a Pi persistence guarantee or incidental module-cache retention. Each random one-use intent binds its origin factory generation, exact session-manager object, canonical real project path, session ID, bot and owner IDs, and SHA-256 credential fingerprint. Only these non-secret identifiers/fingerprint and a monotonic 30-second deadline are retained; no token, message content, file, environment value, timer or subprocess state is written. A host that replaces the session-manager object fails closed. Untrusted extensions in the same process are outside this isolation boundary.

Only authenticated private native `/reload` queues a connection-bound request. Busy/pending input, downloads and update installation prevent admission. The internal command alone cannot arm anything; it revalidates saved identity/readiness and consumes the pending request before calling reload. Stop/disconnect invalidate pending requests, and non-reload shutdown cancels the intent. Only reload shutdown followed by a different factory's reload start can claim it. Same-factory resume/new/fork/reload and ordinary startup cannot acknowledge. Failed initialization or missing assignment retires the claim, rather than acknowledging a later automatic reconnect.

The successor sends the loaded version through a guarded control effect after rechecking assignment, current context/connection, lease-backed readiness and expiry. Consumption precedes sending; failed/uncertain delivery is never retried. Old-command settlement only cleans process-owned state, without using the old context after reload. A caught failure after new Telegram readiness does not invalidate this deliberately narrower statement. Package-update reload remains outside this initial scope and retains `/ping` guidance; no unsolicited startup notice was restored.

Tests exercise native authentication/routing through a fresh registered extension factory, internal-command non-authority, one-time delivery, original-runtime failure, exact identity/object binding, expiry, duplicate claims, lifecycle reasons and same-factory rejection. Mocked tests do not establish live activation or full-host reload success.

## Candidate host compatibility review

Preparation for 0.6.2 examined actual 0.84.4, 0.87.1 and 1.3.0 `dist/core/extensions/runner.js` and `dist/core/agent-session.js`, not only declarations. `createContext().sessionManager` returns the runner's stored manager, and reload rebuilds the runner with the same `AgentSession.sessionManager`, emitting shutdown/start with reason `reload`. Thus object identity and lifecycle reasons used here are compatible with these implementations. The 0.87.1 and 1.3.0 reload examples treat `ctx.reload()` as terminal, as this implementation does apart from plain process-state cleanup. Later host steps still preclude a full-Pi-success claim.

Documented baseline is Pi 0.84.4+, with candidate typecheck/tests against 1.3.0 and Node 22.19.0+. Standard `*` peers follow Pi packaging guidance, not a compatibility matrix. Missing lifecycle reasons or a replaced manager fail closed in the helper; no acknowledgement is promised on older/custom hosts. No live host reload was executed by this preparation.

## Historical review (decision now resolved above)

### Result

No completion reply or handoff state was implemented. The remaining question is **what counts as successful reload**, not whether Node can retain a small process-owned intention across extension factory replacement.

The requested literal guarantee—send `Reload complete · v<loaded version>` only after successful Pi reload, never for failed reload—cannot be established by the examined public extension lifecycle. A new extension's `session_start(reason: "reload")` proves that the new extension runtime reached startup; it does **not** prove that Pi's reload operation succeeded. This distinction needs a decision before implementing a success notice.

This review leaves native `/reload`, silent ordinary startup/reconnection, `/ping`, updater wording, incoming voice, and restart refusal unchanged. Launcher-owned restart is outside this assignment.

## Concrete evidence

Read-only installed Pi **1.0.4** references (not an assertion about the parent's loaded runtime):

- `docs/extensions.md`: reload replaces the runtime; code after `await ctx.reload()` must not reuse old runtime state. `session_shutdown` is the cleanup boundary. The state APIs document durable session entries and external storage, not a reload transaction/result handle.
- `docs/sdk.md`: session replacement recreates services; the SDK can supply its own session manager and resource loader. Process identity and persistent session ID must not be conflated.
- `examples/extensions/reload-runtime.ts`: the command treats `ctx.reload()` as terminal. It does not demonstrate completion notification from a fresh runtime.
- `dist/core/extensions/types.d.ts`: `SessionStartEvent` and `SessionShutdownEvent` expose `reason: "reload"`, but no operation ID, success event, or result handoff. The checkout's **0.84.4** declarations also have lifecycle reasons; their absence is **not** the blocker.
- `dist/core/agent-session.js`, `AgentSession.reload()` (around lines 2932–2965): emits old-runtime shutdown, invalidates the old runner, reloads settings/resources, rebuilds the runtime, then emits new-runtime `session_start(reason: "reload")`. **After that event**, it reports unhandled MCP registrations and awaits `extendResourcesFromExtensions("reload")`.
- `dist/modes/interactive/interactive-mode.js`, command-context `reload` binding (around lines 1524–1526): awaits `handleReloadCommand()`.
- That file's `handleReloadCommand()` (around lines 5336–5411): after `session.reload()` it reloads keybindings, applies runtime settings/themes, configures autocomplete/shortcuts and reports loaded resources. Its `catch` displays `Reload failed: ...` locally but **does not rethrow or return a failure result**. Streaming/compaction refusal also returns without a success result.

Consequently, both of these are unsafe success oracles:

1. Send at the fresh Telegram runtime's verified connection: later Pi reload work can still fail.
2. Wait for fulfillment of the old `ctx.reload()` promise using a process-owned latch: the interactive handler also fulfills after caught reload errors. This additionally must not use the retired context/API to send anything.

An arbitrary delay, a second `/ping`, a package-version comparison, or a persisted session entry does not resolve that ambiguity. A mock where `session_start` is defined as successful reload would encode the missing guarantee rather than test it.

## Decision options

### A. Narrow the completion meaning explicitly

Approve a notification meaning **“the new Pi Telegram runtime is loaded and its existing assignment is verified and ready”**, not “all Pi resources/UI reload work succeeded.” Prefer wording such as `Telegram reloaded · v<loaded version>`; retaining `Reload complete` requires explicitly accepting that narrower meaning.

Under this contract, an explicit, fail-closed process-owned mechanism is feasible without durable success markers or automatic connection/assignment changes. Proposed scope:

- Store only a versioned, bounded, non-inheritable in-memory handoff on the Node process object, not disk, environment variables, PID heuristics, or incidental module cache state. No sockets, polling, or outbound work in the factory.
- Bind the slot to the actual session-manager object identity as an additional restrictive check, canonical project, persistent session ID, bot/owner and credential fingerprint, a random request ID, old runtime generation and a short monotonic deadline. If a host substitutes its session-manager object, suppress the reply rather than infer continuity. Supporting that host would require a separate stable identity capability.
- Admit only authenticated private native `/reload` from the current ready connection. Keep busy refusal; also reject pending receipts/messages, downloads, updates/install and duplicate requests. The queued internal command must consume a connection-bound one-use request, not create an intention merely because someone invoked its command name.
- Revalidate saved assignment, readiness, session and connection immediately before calling reload. Arm only at that point. No completion send from the old runtime.
- Transfer only on the expected `session_shutdown(reason: "reload")`. Any other shutdown, replacement or disconnect before that boundary cancels. The first matching new-runtime `session_start(reason: "reload")` claims once; ordinary startup/new/fork/resume and absent reasons never claim.
- Expiry, failed initialization, subsequent disconnect, mismatched identity, duplicate claim and delivery uncertainty retire the intention without retry. Revalidate assignment/lease/generation at actual outbound execution; use the new factory's loaded package version, not the requested update version.
- Keep updater-triggered reload outside the initial scope unless explicitly included. Its current `/ping` guidance is truthful and should not be replaced by a guaranteed completion promise before this contract is chosen.

This is a proposed design, not verified source or a supported Pi-owned handoff API. Concurrent SDK runtimes, failed reload before a replacement factory, and reload retries must be reviewed explicitly before adoption; a shared project/session string alone is insufficient isolation.

### B. Preserve full Pi-reload success semantics

Obtain a supported host completion capability: an opaque reload operation ID, a process-owned one-use successor handoff, and an explicit success/failure result emitted **after** core and interactive reload work has settled. Refusals and caught failures must be distinguishable from success. The fresh runtime must be able to subscribe/claim without using the retired context. A host/launcher adapter can provide this only if its actual reload result boundary is supported and reviewed; no monkey-patching or scraping UI status is proposed.

Then implement the same owner/assignment/generation/deadline safeguards, with send permission requiring the correlated successful result as well as a ready new Telegram connection.

## Tests and validation

Fresh existing-tree validation: `npm run validate` passed typecheck and **226 tests**, zero failures/skips; `npm run pack:check` passed (**41 files**); `git diff --check` passed. These do not validate a new completion feature. No new lifecycle-success tests were added because no implementation/contract was selected.

Required future cases: authenticated fresh-factory success with new loaded version; refusal and failure before/after shutdown; failure after new-runtime startup; expired intention; failed reconnect; stale disconnect/assignment/credential/session replacement; arbitrary startup/new/fork/resume; duplicate requests/claims; two runtimes with the same persistent session identifier; queued outbound expiry/replacement; uncertain delivery with no replay. Full-success semantics must include the host's caught post-start reload failure, not only a stubbed rejecting `ctx.reload()`.

At the original reload-review checkpoint, no live reload, restart, installation, Telegram request, external message/task, dependency change, version bump, commit, push or publication was performed; audit findings were unresolved. Subsequent authorized candidate preparation upgraded only development-checkout dependencies (SDK 1.3.0 and sharp 0.35.5) and resolved both full and production audits to zero; see development status. No running-host installation or live activation was performed.
