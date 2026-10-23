# Native compaction notices — source review

## Implemented contract

`src/compaction-notices.ts` observes extension `session_before_compact`, `session_compact` and `session_compact_failed` hooks. It sends fixed plain control notices, not model messages or tool calls:

- “Context compaction starting. Pi may pause while it summarizes older context.”
- “Context compaction completed.” only after the success hook.
- “Context compaction cancelled.” or “Context compaction failed.” only after the failure hook, using its `aborted` boolean.

Manual compaction and automatic threshold/overflow compaction share these extension hooks. A before hook means an attempt has reached extension interception, not that it will succeed or even call a model: later handlers can cancel or supply a summary. Success says only compaction succeeded; it does not promise the interrupted request resumed or finished. No success is inferred from agent start/end/settlement, timers, or the before hook.

The helper keeps only a connection, manager identity, session ID and local generation. It does not read or retain summaries, preparations, transcript entries, custom instructions, token counts, raw error messages or reasoning. Start deduplication uses the operation's AbortSignal in a WeakSet; one pending attempt is consumed by its terminal event. The examined host serializes compaction and emits ordered outcomes; the extension events do not carry a shared explicit attempt ID. Distinct subsequent starts are not permanently suppressed if an older host omits failure events.

`src/index.ts` admits notices only for a ready current connection and active session manager/project. At queued execution, the helper rechecks manager/session/connection/generation before and after disk assignment verification (bot identity, owner and credential equality). Disconnect and session lifecycle reset invalidate queued work and pairing. Notices never route an old attempt's end to a replacement connection. Already-issued HTTP requests cannot be recalled; disconnect abort and fences prevent new stale admission, not remote erasure.

Transport reuses `sendGuardedControlNotice` and its existing supervised FIFO effect queue: depth 32, five-second queued residence, ten-second total lifetime, connection abort, rate-limited generic local error reporting, no replay. Event handlers return synchronously, so network/filesystem verification cannot delay compaction. Delivery is best effort; queue overflow, timeout, disconnect or network failure can lose either notice. No startup chatter, Working/Thinking/typing mirroring, receipt/reminder mutation, model input, Stop authority, configuration prompt or new Telegram command is introduced.

## Host evidence and compatibility

Read-only installed reference root: `/home/martin/.pi/agent/install/releases/0.87.1/node_modules/@earendil-works/pi-coding-agent/` (package metadata reports **0.87.1**). Read full `docs/extensions.md`, `docs/compaction.md`, `docs/sdk.md`, `docs/sessions.md`, `docs/settings.md`, the custom-compaction example, extension declarations and relevant extension-runner/AgentSession implementations. These are installed reference files, not proof of the parent's loaded host.

- `dist/core/extensions/types.d.ts` declares all three hooks and `ExtensionAPI.on` overloads. `session_compact` is explicitly a success event; `session_compact_failed` explicitly covers failed/aborted operations.
- `dist/core/agent-session.js` manual `compact()` and automatic `_runAutoCompaction()` actually emit the before hook, then append the compaction and refresh context before the success hook. Their catch paths call `_emitSessionCompactFailed`, including extension cancellation. This is actual runtime emission, not a declaration-only assumption.
- `dist/core/extensions/runner.js` dispatches before handlers in registration order and stops on cancellation. Thus an earlier cancelling extension can prevent our start hook from running. Exceptions from notification hooks are locally reported by the host.
- Checkout dev SDK **1.3.0** declares the same extension contract. Compared its complete manual and automatic compaction functions against 0.87.1: notification ordering remains the same; 1.3.0 moves summarization authentication into the default compaction implementation rather than doing it before the extension hook. Local validation uses 1.3.0.
- These installed versions expose SDK `compaction_start`/`compaction_end` through `AgentSession.subscribe`. Older SDK references may call these `auto_compaction_start`/`auto_compaction_end`. Neither naming is an extension `pi.on` capability; this implementation uses neither, never acquires a private AgentSession, and never treats `pi.events` as a host event bridge.
- The project's general **0.84.4+** baseline is not a verified compaction-notification matrix. An actual 0.84.4 installation was unavailable in this investigation; no claim is made that its failure hook is emitted. The verified full extension lifecycle here is 0.87.1 and checkout 1.3.0. On a host lacking a terminal event the notice remains start-only, with no fabricated outcome; missing failure events must not be described as successful completion. No dependency/version floor was changed.

## Visibility gaps and stronger upstream contract

This cannot promise a notice for every internal compaction-related pause. A failure before the before hook, an earlier hook cancellation, branch summarization during tree navigation, or an extension directly writing a compaction entry is outside the paired-attempt contract. In 0.87.1, authentication can happen before the before hook; that earlier pause is not visible. Failures without an observed start are deliberately silent. Attempts that start without a ready Telegram connection do not acquire a connection halfway through for completion.

For exhaustive observation, Pi would need public extension notification-only `compaction_start` and `compaction_end` events with an opaque operation ID and session identity, start before preparation/authentication, and exactly one terminal success/failure/cancel outcome on every started path. That would also eliminate pairing assumptions and enable unambiguous overlapping-attempt support. No unsupported/future hooks or private SDK subscriptions were added.

## Validation and activation

Mocked hook/real transport tests cover manual/threshold/overflow starts and successes, failures/cancellation, duplicate events, absent terminal events, busy contexts, unready/unassigned targets, lifecycle reset, queued and async-verification replacement races, generic content-only delivery and supervised failures without retry or Stop authority. These are source tests, not live compaction or Telegram observations.

Registered full-extension integration also verifies busy delivery with no model input and disk-assignment revocation before the connection monitor catches up.

`npm run validate`: typecheck and **264 tests passed**, none skipped. `npm run pack:check`: **46 files**. `git diff --check`: passed. Existing uncommitted secret-refusal changes were preserved. No dependency/version change, installation, live compaction, reload, network bot call, external message, commit, push or publication.
