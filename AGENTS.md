# Pi Telegram Agent Guide

## Project identity and product direction

Pi Telegram is a globally loaded TypeScript package that makes Telegram a native frontend for live Pi coding-agent sessions. It talks directly to the Telegram Bot API. There is no hosted provisioner, cloud registry, Azure dependency, deterministic project key, or tracked bot binding in the current product.

- Repository: <https://github.com/mbundgaard/pi-telegram>
- npm package: `@comput/pi-telegram`
- Development checkout: `D:\Source\PiTelegram`
- Canonical product name: **Pi Telegram**.

Prefer native Telegram drafts, Rich Messages, commands, documents, media, and controls when they improve the experience. Native Thinking is a generic status placeholder, never a channel for hidden reasoning. Keep model-facing usage guidance in the extension's tool descriptions, prompt guidelines, and transport notice, not exclusively in this development guide: consuming projects will not have this file.

## Current 0.6.7 release — verified

- Public npm latest **0.6.7**, release commit `7d5c3221aba934326c74f7efd43f70ecf1d99e27`. CI **40837224634** and Trusted Publishing **40837337190**, attempt **1**, succeeded. Exactly one main-ref dispatch; registry propagation resolved read-only, without retry.
- All **47 published files** byte-match the release commit. SHA-1 `158db9f542a2e84c2bc79e8a79fdbaf368aba3df`; integrity `sha512-B+JxJwrGIRYkDhOPDByDRJsFDycykBVJBFVGtH61Z+z4UgyrbWFihV4ur1iFKr/0GmZN0LUos2iS2/du92Ej9A==`. Computed SHA-512 matches decoded SLSA subject; commit/repository/workflow/run linkage verified, not independent DSSE/certificate-chain/Rekor verification.
- Clean ci/typecheck/**290 tests** (none skipped), full/production audit zero vulnerabilities, pack47/diff/local byte checks passed. Dependencies unchanged; no host install/reload, live bot/secret tests, runtime-secret inspection or external messages. Windows replacement, privacy/deletion, two-session, network and host-cancellation limits remain; original owner failure is not proven fixed. Do not republish 0.6.7. Published docs retain the candidate snapshot.

## Historical 0.6.7 candidate — authorized publication pending

- Owner authorized patch bump, scoped release commit/push and one main-ref Trusted Publishing dispatch after gates. Registry latest was 0.6.6 and 0.6.7 absent. Independent review of all pending source, guidance and tests passed; authentication/upload safeguards remain unchanged.
- Clean npm ci, typecheck and **290 tests** (none skipped), full/production audits zero vulnerabilities, pack47 and diff checks passed. Dependencies unchanged. No host install/reload, runtime secret inspection or live tests. Publication evidence follows verification.

## Historical unreleased authorized secret replacement — Main review required

- Owner explicitly authorized same-filename replacement without another confirmation, superseding historical no-overwrite/no-clobber promises for this new flow only. Safe regular single-link targets now pass preflight; authenticated contents commit through a private same-directory temporary file, fsync and rename, never prompt-time truncation. Successful replacement creates a new 0600 inode; unsafe paths, symlinks, directories and hard-linked targets remain refused, and upload protections are unchanged.
- Precommit cancellation/failure preserves previous contents. Portable Node rename is used without unlink/truncate fallback; platform sharing/access failures remain generic save failures. Windows behavior is not live-tested, modes are not ACL guarantees, directory-entry crash durability and hostile concurrent filesystem/Git mutation remain outside the contract.
- Dummy-fixture validation and final counts are recorded in `docs/development-status.md`. No runtime secret inspection, live bot test, external message, install/reload, version/dependency change, commit/push/publication. Main must review before activation.

## Historical 0.6.6 release — verified

- Public npm latest **0.6.6**, release commit `67d3f91228ac7a758f4e7ed4d755188f1169026c`. CI **40494051971** and Trusted Publishing **40494178057**, attempt **1**, succeeded. Exactly one main-ref dispatch; registry lag resolved read-only, no retry.
- All **47 published files** byte-match the release commit. SHA-1 `ea5f7fb33763db06effedc0a72b590ec4c4b35f2`; integrity `sha512-KMXCrbZ/qL34wX6IqxIUunvoFSTcJCf3qLBDlu8CMqR74+36OhCX1e/9DZaf7urB/pKxg/pmgeV095BOvwfP7w==`. Computed SHA-512 matches decoded SLSA subject; commit/repository/workflow/run linkage verified, not independent DSSE/certificate-chain/Rekor verification.
- Clean ci/typecheck/**288 tests** (none skipped), full/production audit zero vulnerabilities, pack47/diff/local byte checks passed. Dependencies unchanged; no host install/reload, live Telegram/secret testing, runtime-private-state inspection or external messages. Owner's immediate secret failure remains unresolved; live group timing/network, privacy/deletion, two-session and host-cancellation limitations remain. Published docs retain the candidate snapshot. Do not republish 0.6.6.

## Historical 0.6.6 candidate — authorized publication pending

- Owner authorized patch bump, release commit/push and one main-ref Trusted Publishing dispatch after gates. Registry latest is 0.6.5; 0.6.6 was absent. Main independently reviewed grouped intake; release review covered all pending secret/group source and tests. Historical checkpoints below retain their original review status.
- Scope: bounded grouped incoming files, completed-startup deadline removal from secret lifetime checks, and sanitized preflight diagnostics. Dependencies unchanged. The owner's immediate secret failure remains unresolved; source regression/tests do not prove its live cause.
- Clean npm ci, typecheck and **288 tests** (none skipped), full/production audits zero vulnerabilities, pack47 and diff checks passed on Node22.23.3/npm10.9.9. No host installation/reload, live Telegram/secret tests, private-runtime inspection or external messages. Live group timing/network, privacy/deletion, two-session and host-cancellation limits remain. Publication evidence follows verification.

## Historical unreleased incoming file groups — Main review required

- Reviewed/completed the inherited partial group implementation. Owner/private documents/photos sharing `media_group_id` collect for 800 ms quiet / 3 s maximum (also enforced at admission if the timer is delayed); no Telegram end marker exists. Unrelated groups and single/voice attachments remain separate. FIFO bounds include running work: 4 batches / 30 files total, 10 per group, 120-second active batch deadline. Late/full items require resend; bounded 512-entry message/closed-key memories are connection-local, not durable deduplication.
- Sequential saves reuse unchanged 20 MB per-file and 100 files / 100 MB inbox checks. Combined follow-ups identify successful paths/bytes and individual failures/captions; all-failed groups do not reach the model. Captions are instructions, never native commands; captionless intake asks before inspection. No execution/extraction/transcription added. Saved files survive partial failure/cancellation; Stop/disconnect drops queued/collecting work and suppresses unfinished receipts and stale cancellation failure notices.
- Added unit/transport/registered-extension tests including interleaved groups during active reception, duplicates, late items, collection/queue bounds, partial failures, real dummy-inbox quotas, authentication, secret guard, Stop/disconnect and receipt admission. Corrected the inherited integration test's erroneous expectation that ordinary input admission returns a transform. Updated user/architecture documentation; existing separate secret fixes preserved.
- Fresh `npm run validate`: typecheck and **288 tests** pass (none skipped). `npm run pack:check`: **47 files**; full audit zero vulnerabilities; diff check passes. Source-only, no live API, external messages, runtime-private-state inspection, install/reload, version change, commit/push/publication. Main must independently review before activation; live group timing/network behavior remains unverified.

## Unreleased immediate secret-preflight diagnostics — Main review required

- Investigated the entire destination preflight plus saved-assignment verification without inspecting runtime settings, inbox or secret files. No second false-rejection bug reproduced: fresh/non-Git/Git, ignored `.pi/`, `.git/info/exclude`, nested project cwd, canonicalized ancestor symlink, pre-existing public-mode `.pi`, repeated saves and registered-extension startup/reconnect all succeed in temporary dummy fixtures. Existing private-directory permissions, unsafe paths/ignore files and tracked entries intentionally fail. No safety gate removed.
- Important diagnostic distinction: bare `/secret` does **not** run destination preparation before its filename prompt. A preparation error at that point implicates connection/assignment verification (or interruption), not an existing destination. `/ping` and ordinary input do not establish the asynchronous saved-assignment verification result.
- `SecretPreflightError` now exposes only fixed bounded categories (target/storage/permissions/ignore/existing/Git/tracked/unignored); direct/menu pre-content errors distinguish these from failed or unreadable connection/assignment verification. Native errors, filesystem paths, Git output and contents never enter these notices. Post-content save failures remain generic. Uncertain prompt delivery remains separately fenced. No overwrite, chmod repair, routing or authority changes.
- Prior startup-deadline fix is preserved. New tests include real registered extension startup/reconnect with persisted dummy project config in Git and six direct/menu saves; separate controlled deadline-abort coverage remains. Full typecheck and **278 tests** passed (none skipped); full audit zero vulnerabilities and diff check passed. Owner's deployed immediate failure remains **unknown/unresolved**, not proven fixed by fixtures. Source-only: no install/reload/live API/secret requests/version bump/commit/push/publication.

## Unreleased secret-readiness startup deadline fix — Main review required

- Confirmed source regression: startup/retry `connect()` signals include a 30-second deadline, but secret `current`/`verify` retained that signal after successful initialization. Deadline expiry therefore rejected secret intake while polling/ping remained ready. This is reproduced with a controlled abort in a real ConnectionManager fixture, not confirmation of the owner's loaded runtime.
- Removed only the completed startup-signal checks from secret lifetime predicates. Initialization still checks/observes cancellation and tears down on failure; ready state, exact connection/epoch/session, live lease and asynchronous saved-assignment/token/owner checks remain. Session shutdown explicitly disconnects; setup cancellation remains initialization-scoped, as for polling/menu/ping.
- Regression tests cover abort before secret start and between prompt/save, ordinary input/ping continuity, dummy-file save, session/assignment/token/owner/lease/shutdown/replacement rejection, and pre-readiness cancellation/shutdown with late API completion and reconnect. Typecheck and **274 tests** pass (none skipped), full/production audits zero vulnerabilities, pack46 and diff checks pass.
- Source-only change; no live API/secret test, runtime-secret inspection, install/reload, version bump, commit/push or publication. Main must review before activation; existing privacy and host-lifecycle limitations remain.

## Current 0.6.5 release — verified

- Public npm latest **0.6.5**, release commit `06353ac38af79a6263808bdf04a3cd9a9fb35c5d`. CI **40188722832** and Trusted Publishing **40188777235**, attempt **1**, succeeded. Exactly one dispatch using `--ref main`; registry lag resolved with read-only checks, no retry.
- All **46 published files** byte-match the release commit. SHA-1 `7041252d72b24e2565e4b8ff88e3e0a2af4c4c76`; integrity `sha512-1WtckjDii88e36QvJ9cZlkPQrGc20kp5WPjeO0xWT7uaeqVjUk3exutidITxcdqmgmdu75j+kdZWlvuSd4/rUQ==`. Computed SHA-512 matches decoded SLSA subject; commit/repository/workflow/run linkage verified, not independent DSSE/certificate-chain/Rekor verification.
- Clean ci/typecheck/**271 tests** (none skipped), full/production audit zero vulnerabilities, pack46/diff/local byte checks passed. Scoped SDK-chain override to undici8.12.2 is dev-only, not consumer-host remediation. Production dependencies unchanged. No running-host install/reload, live bot/secret tests, runtime-secret inspection or external messages. Existing privacy/deletion, two-session, cancellation and adverse-network limitations remain. Do not republish 0.6.5; published docs retain their candidate snapshot.

## Historical 0.6.5 candidate — authorized publication pending

- Owner authorized scoped development SDK override, patch bump/commit/push and one main-ref Trusted Publishing dispatch after gates. Registry latest was 0.6.4; 0.6.5 was unused. Independent release review passed for early exact-ACK secret buffering, replacement/callback fences and unchanged no-clobber storage; no live privacy claim.
- Narrow root override `@earendil-works/pi-coding-agent` → `undici: 8.12.2` replaces SDK 1.3.0's vulnerable 8.10.2; SDK stays 1.3.0. Both require Node >=22.19.0. Reviewed intervening release notes and dispatcher APIs. Development-only remediation; published dependency overrides do not patch consumers' hosts. Production dependencies unchanged.
- Clean npm ci, typecheck, **271 tests** (none skipped), full/production audits zero vulnerabilities. Pack46/diff checks passed and all local tarball files byte-matched the tree. No running-host installation/reload, real secrets, live Telegram tests or external messages. Publication evidence follows verification; preserve prior checkpoints.

## Historical 0.6.4 release — verified

- Public npm `latest` is **0.6.4**, released from `7634637214bbeea9fec82656c3c6ddfded28d141`. CI **39979864026** and Trusted Publishing **39980073990**, attempt **1**, succeeded under `mbundgaard/pi-telegram`. One successful main-ref dispatch created the publish run; the preceding SHA-ref request was rejected HTTP 422 without creating a run. No publication retry; registry visibility lagged before verification.
- All **46 published files** byte-match the release commit. SHA-1: `bd2f479f104d625063e327d0a24dbef1192caa03`; integrity: `sha512-f4wJlBpyrScTH18xgJOAW+a+HTIca6yk8GXGOv1xl1NLjXv6mPwKb8KKG5pEzCGzWK8ng5jU4EPjMYo5GX4ZBg==`. Computed SHA-512 matches the decoded SLSA subject; payload linkage matches commit/repository/`.github/workflows/publish.yml`/run **39980073990**, attempt **1**. No independent DSSE/certificate-chain/Rekor verification.
- Release gates below passed; dependencies unchanged. No running-host installation/reload/restart, live compaction/secret/bot testing, runtime-secret inspection or external messages. Compaction observability, secret privacy/deletion, two-session, host-cancellation and adverse-network limits remain. Published documentation retains its pre-publication snapshot. Do not republish 0.6.4.

## Historical 0.6.4 release candidate — publication pending

- Owner authorized patch bump, release commit/push and one Trusted Publishing dispatch after gates. Registry latest is 0.6.3; 0.6.4 was unused at preparation. Scope: main-reviewed native compaction notices and actionable secret-blocker diagnostics/repeated-save tests; dependencies unchanged.
- Compaction hooks are source-verified in Pi 0.87.1 and development SDK 1.3.0, not a universal compatibility matrix. Pre-hook pauses and missing outcomes remain unobservable; never infer success. No private event contents, startup chatter or widened receipt authority.
- Unanswered agent questions are a reproduced secret blocker candidate, not proof of the owner's exact live cause or a stale successful-save fix. No running-host installation/reload/restart, live compaction/secret tests or external messages. Clean npm ci, typecheck, **264 tests** (none skipped), full/production audits zero vulnerabilities, pack46 and diff checks passed. Record publication evidence only after verification.

## Historical 0.6.3 release — verified

- Public npm `latest` is **0.6.3**, released from `b7aa4ceeacf25afac9294af4ae7fc8f0d9536455`. CI **38978048307** and Trusted Publishing **38978137401** succeeded under `mbundgaard/pi-telegram`; publish was dispatched exactly once. Registry visibility lagged, then latest/version were verified without replay.
- All **45 published files** byte-match the release commit. SHA-1: `dc13098aafe2b5648f5fa9884632b92139494087`; integrity: `sha512-S19Epkdz57UyC8TBj0doNsijG2sf77MnorPVvIdYowGXFhnFzTgWPxm3Kk/ur+0aR/5mHBgB2hXmNsSMuAx0qA==`. Decoded SLSA subject hash and linkage match commit/repository/`.github/workflows/publish.yml`/run **38978137401**, attempt **1**. No independent DSSE/certificate-chain/Rekor verification.
- Clean npm ci, typecheck, **255 tests** (none skipped), full and production audits **zero vulnerabilities**, pack45 and diff checks passed. Dependencies unchanged. No running-host installation/reload/restart, live secret/API test, runtime secret inspection or external messages. Privacy/deletion, two-session, host-cancellation and adverse-network limits remain; see `docs/development-status.md`. Do not republish 0.6.3. Published docs retain the pre-publication snapshot.

## Historical 0.6.3 release preparation — authorized, publication pending

- Owner authorized patch bump, release commit/push and one Trusted Publishing dispatch after gates. Registry latest was 0.6.2 and 0.6.3 was absent. Independent native-intake source review and Main's menu-flow review passed; no live privacy/deletion evidence is claimed.
- Scope is the native secret flow, protected storage, mandatory/skill guidance and dummy-data tests below; dependencies unchanged. Known low-severity routing limitation: `/secret`-prefixed replies are intercepted before exact feedback text, and `/cancel` cancels feedback. User documentation records this; no unrelated runtime change is included.
- No running-host installation/reload/restart, live secret/API submission or runtime secret inspection. Two-session, host-cancellation and adverse-network limitations remain. Publication evidence will be recorded only after verification.

## Historical unreleased menu-friendly native secret intake — independent review required

- Bare `/secret` (including the menu) now asks for a non-sensitive filename with native ForceReply, then sends a separate filename-labelled content ForceReply. `/secret <filename>` retains direct content prompting. Invalid filename-stage replies and unavailable/existing destinations allow correction against the same filename prompt; malformed/invalid shortcuts retain refusal. Both stages/corrections share the original fixed five-minute deadline.
- Exact owner/private/current prompt binding and synchronous fences cover filename verification and both prompt sends. Filename prompts have their own strict own-bot stale marker, rejection-only after transitions/cancel/expiry/reconnect (including media/captions/edits). Old filename replies never become contents or model input. Stop/cancel and literal content-command policy remain unchanged; storage safeguards are unchanged.
- Postcommit deletion still targets only the original data reply and content prompt. Filename prompts/replies remain in chat for manual cleanup. Mandatory tool guidance, skill and user documentation explain both routes and the separate content wait.
- Source-only dummy-data validation: typecheck and **255 tests** pass (none skipped), full audit zero vulnerabilities, pack **45 files**, diff check passes. Five added tests cover two-stage success/duplicates/literal content, correction/existing destinations/auth/media/edits, stale markers/reconnect, verification/send races/cancel/errors and fixed timer expiry. No live API/secret submission, inbox inspection, installation/reload/restart, commit/push/publication or external messages. Main must independently review before activation; mocks are not live privacy evidence.

## Historical unreleased native secret intake checkpoint — independent security review required

- At this historical checkpoint, owner/private `/secret <filename>` is native, not a model tool. A five-minute ForceReply flow validates a strict ASCII basename and absent destination before prompting, then saves exact nonempty UTF-8 text (whitespace retained, 16,384-byte ceiling) under `.pi/telegram-secrets/`. Data never enters model input, receipts, previews, error details or tool output. Only bounded JSON-quoted project-relative path and byte count become an authenticated `forceFollowUp` with do-not-inspect guidance; existing pending-receipt authority is unchanged.
- Protected directory/ignore-file checks, Git tracking/ignore checks, restrictive creation modes, canonical path checks and no-clobber hard-link publication are in `src/secret-files.ts`. Full directory plus temporary entries are ignored; outbound files/photos reject the directory independent of basename and now reject hard-linked files generally. No overwrite, execution, interpolation, automatic chmod, unrelated deletion, dependency or version change.
- Intake is fenced synchronously before async prompt preparation. Active unmatched text/media/controls/callbacks are blocked; exact own-bot stale prompt replies are rejection-only across restart, including captions/media. Edits are never model input. `/cancel` retires native secret/feedback flows; global `/stop` and plain `stop` remain reserved even in exact replies and retain existing cancellation authority. Other exact-reply text stays literal. Downloads, feedback and agent questions block starting intake. Stop/disconnect/expiry cancel pending precommit work.
- After commit only original data/prompt IDs receive bounded deletion attempts (no retry); failure warns without quoting. Saved path/count notification is revalidated against the assignment after cleanup. Interruption after commit may leave a saved file without a confirmation/metadata turn. Plaintext at rest, no bot-chat E2EE, no promise of Telegram erasure or preventing a filesystem-capable agent reading later. Hostile local filesystem/Git mutation is outside the isolation contract; crashes/failed cleanup may retain an ignored private temporary file. Short synchronous write/fsync/link work blocks the event loop.
- Source-only dummy-data tests cover exact bytes, no model leakage, path/mode/Git/upload safeguards, races/no-clobber, owner/private/reply binding, in-flight prompts, stale replies/reconnect, TTL, cancellation/Stop/disconnect/transfer, deletion/write failure and metadata follow-up. Validation: typecheck and **247 tests** pass (none skipped), full audit zero vulnerabilities; pack/diff checks pass. Pack includes separately concurrent skill documentation changes, not authored by this task. No live Telegram/API test, secret submission, installation/reload/restart, commit/push or publication. Main must independently review before activation; do not treat mocks as live privacy proof.

## Historical 0.6.2 release — verified

- Public npm `latest` is **0.6.2**, released from `2db09f05b17233320a3a9a42ec2f11a132db1c1e`. CI **38955575579** and Trusted Publishing **38955587978** succeeded under `mbundgaard/pi-telegram` after correcting transferred repository metadata. One corrected dispatch; earlier run **38954614689** attempt 2 failed E422 despite successful OIDC. The old detailed reason was filtered; npm's documented repository-match prerequisite was demonstrably violated and the corrected publication succeeded.
- All **42 published files** byte-match the release commit. SHA-1: `35f61864d06b1e16bbff639ec7bc5afcdee1c9eb`; registry integrity: `sha512-+xgAfnK4L+okbwiuLheGE6WBCglItcxwv14oDUtjjiyrUYPrWiwm3jXjlIJxE7b5NEMzaKzCeWjUZwkEbNvFhw==`. Decoded SLSA subject hash and linkage match the commit, `mbundgaard/pi-telegram`, `.github/workflows/publish.yml`, run **38955587978**, attempt **1**; no independent DSSE/certificate-chain/Rekor verification.
- Local typecheck, **234 tests** (none skipped), full audit zero vulnerabilities, pack42 and diff checks passed. No running installation/reload/restart, live Telegram tests or external messages. Prior release limitations remain. Published docs retain their pre-publication snapshot; see `docs/development-status.md`. Do not republish **0.6.2**. Hidden runtime state and artifacts remain excluded.

## Historical 0.6.2 candidate — audit blocker resolved, not published

- Local package/lock candidate **0.6.2**; registry latest remains **0.6.1**, and 0.6.2 was unused at preparation. No publication/commit/push/tag/install into running Pi/reload/live bot testing.
- Scope: silent startup, native ping, narrow fresh-Telegram-runtime reload acknowledgement and inert voice intake. Native restart menu/help advertising removed; typed `/restart` safely refuses. Instance-following remains unimplemented. Original-format voice preservation is reported locally verified by the preparation request; no transcription/cloud feature or new live test here.
- Actual Pi 0.84.4/0.87.1/1.3.0 runner/reload code preserves session-manager identity and emits reload reasons. Document baseline Pi 0.84.4+, Node 22.19.0+; test SDK now 1.3.0. Standard `*` peers are not a compatibility matrix; missing reasons/changed manager suppress acknowledgement.
- Targeted sharp 0.35.5 fixes production audit. Authorized development SDK remediation upgrades ^0.87.1 to **^1.3.0**, locked to stable published 1.3.0: its tarball has no shrinkwrap and directly pins patched brace-expansion **5.0.12** and undici **8.10.2**. Reviewed public docs/API and actual reload implementation; no source/test compatibility edits needed. Full and production audits are **zero vulnerabilities** after clean npm ci. No force fix, suppression or manual dependency patch; historical failed-audit evidence below is preserved.
- Candidate checks: typecheck and **234 tests** passed (none skipped), pack **42 files**, diff check passed, production and full audits zero. All 42 local tarball entries byte-checked against the tree. See `docs/development-status.md` for details. Do not stage `.pi/`, `.pi-intercom/` or ignored artifacts; all pre-existing user changes remain.

## Historical unreleased explicit native reload acknowledgement

- Main accepted `Telegram reloaded · v<loadedVersion>` to mean only a fresh Telegram factory and ready verified same assignment, not full host reload success. Actual runtime implementation uses a bounded 30-second process-owned `globalThis` Symbol namespace, random one-use intent/generations, exact canonical project/session-manager/session/bot/owner/credential-fingerprint binding and reload lifecycle reasons. No disk/environment handoff or tokens/message contents retained.
- Only authenticated native `/reload` arms it via a guarded one-use internal command. Busy/pending/download/update guards, Stop/disconnect invalidation, failed-initialization retirement and guarded consume-before-send prevent unrelated startup/reconnection notices or replay. Owner-approved updater reload remains outside this initial scope with `/ping` guidance.
- `docs/reload-completion-review.md` records the accepted meaning and mechanism. Fresh typecheck/234 tests (none skipped), pack42 and diff checks passed. No live reload, installation, external messages, dependencies/version change or publication; existing changes preserved.

## Unreleased silent startup and native ping

- Startup/resume/reload/reconnection send no automatic Connected message. This deliberately supersedes the historical notice-before-ready invariant below. Readiness follows saved paired identity/assignment and lease checks plus successful webhook/backlog/poll initialization, not outbound message delivery. Local UI status and best-effort command menus remain.
- Owner/private native `/ping` returns `Pong · project · vLoadedVersion` without Git/host/IP lookups or model input/receipts, including during busy work. Execution rechecks the current ready connection, epoch, session and lease; retired work cannot reply through a replacement connection. `/status` remains detailed. Feedback-bound replies remain literal feedback, as with other native commands.
- Setup confirmations, critical errors and update offers remain; updater completion now points to `/ping`. Restart refusal-only and inert voice intake changes are preserved; instance-following remains blocked.
- Source-only validation and review status are recorded in `docs/development-status.md`. No version bump, installation, reload, live Telegram request or publication; main review required before activation.

## Instance-following assignment investigation — blocked, not implemented

- Optional **Follow this Pi instance** setup mode is not implemented; existing persistent-session behavior remains unchanged. No schema/UI/runtime changes or instance-follow tests were added.
- Examined Pi 1.0.4 public lifecycle/context/state declarations and docs do not establish process-lifetime identity/state handover across new/resume/fork/reload. Lifecycle reasons are available, but durable session entries and old contexts are not process-only authorization. No PID authorization, inherited environment token, global singleton or module-cache lifetime assumption was introduced.
- `docs/development-status.md` records evidence, the supported-host-API blocker, required capability/CAS/project-scope design and remaining tests. A separately reviewed process-local mechanism is an alternative to investigate, not an established guarantee. Main review is required before implementation/activation. Prior voice/restart changes and historical evidence are preserved.

## Unreleased incoming voice intake

- Private owner `message.voice` uses the existing attachment lifecycle and inbox safeguards, saved inertly as generated `*-voice.bin`. Bounded claimed MIME/duration are labeled untrusted in the agent receipt with actual byte count; no codec assumptions, automatic inspection/decoding/transcription or new provider/dependency. Captionless voice asks for instructions; captions are not commands. Audio/video notes remain unsupported.
- Typecheck and225 tests (none skipped), pack41 and diff checks passed. Real voice-sample testing/reload remains pending; no live downloads, installation or publication. Existing refusal-only restart work remains intact; version unchanged.

## Restart re-review — decision and audit gates

- Installed Pi 1.0.4 and herdr 0.9.1 were rechecked against public docs/schema and tagged herdr 0.9.1/0.9.5 source. Idle public shutdown works; canonical shell `agent start` is a practical supported route if its compatibility assumptions are explicitly accepted. Executable attestation alone is not an absolute blocker.
- Strong same-shell/cwd/input isolation remains unavailable: launch sends quoted text plus Enter with no empty-shell-line reservation or expected process/cwd conditional operation. `docs/restart-capability-review.md` gives concrete narrowed-contract versus upstream-change options, exact evidence, tests and live recovery proposal. No functional helper or additional refusal implementation was added; main must decide the contract before implementation/activation.
- Fresh typecheck/226 tests (none skipped), pack41 and diff checks passed. **Audit now fails:** full tree 4 vulnerabilities (1 moderate, 3 high); production-only 1 high in sharp (fixed range starts at 0.35.5). No audit fix/install/dependency change. Earlier clean audits are historical, not current release approval.

## Unreleased restart boundary

- Native owner/private `/restart` is menu-registered but deliberately **refusal-only**, distinct from `/reload`. Busy/pending/receipt/download/update guards and stale connection/session checks never queue work or request shutdown.
- Read-only Pi 0.99.2 docs and herdr 0.9.1 help/schema did not establish a supported way to attest the updated `pi` executable resolved by the existing interactive shell. Herdr markers alone are not process identity proof. No detached helper, launch, session-file validation or shutdown lifecycle is enabled; prerequisites and exact limitations are in `docs/development-status.md`.
- No live restart/pane mutation/shutdown/launch, install, reload, version bump or publication. Public 0.6.1 evidence below remains unchanged.

## Current 0.6.1 release — verified

- Public npm `latest` is **0.6.1**, released from `bcdec735cb12f0e73f3bdaa2e5b19a1772bbaf02`. CI **36313665938** and Trusted Publishing **36313671023** succeeded; publication was dispatched once through the existing workflow.
- All **40 published files** byte-match that release commit. SHA-1: `06659ab7ae5bd235963f342b86ef422a93bea16b`. Registry integrity: `sha512-cFsJYkfztdSINl8l2EQSwvdv6mNa8nvDudnakvoQ+Vsp+0fAcKcRQx0uH3fVV++ef30xi8FCm28XtK3pH1K0jw==`.
- Computed SHA-512 also matches the decoded SLSA subject. Payload linkage identifies `comput-sh/pi-telegram`, `.github/workflows/publish.yml`, the release commit and run **36313671023**, attempt **1**. Independent DSSE/certificate-chain/Rekor verification was not performed.
- Fresh local validation passed typecheck, **213 tests** (none skipped), audit zero vulnerabilities, pack40 and diff checks. Dependencies are unchanged. Scope includes independent busy-console follow-ups, native feedback with the approved production endpoint, README rewrite and package description.
- No installation/reload or live feedback submission was performed. Live routing activation remains unverified; accepted two-session/host-cancellation/adverse-network limitations remain. Details: `docs/development-status.md`.
- Published documentation retains its pre-publication snapshot; this later checkpoint does not alter the immutable artifact. Do not republish **0.6.1**. Historical checkpoints below retain their original evidence.

## Historical unreleased feedback endpoint checkpoint

- The owner-approved production destination is now configured in `src/feedback-endpoint.ts` as `https://feedback.comput.sh/` (root, no extra path). This supersedes the disabled-endpoint status in the historical source checkpoints below without changing their recorded evidence.
- Explicit Submit consent, feedback/version-only payload, owner/private-chat binding and disabled/invalid endpoint safeguards remain unchanged. Production-configuration tests intercept all HTTP calls; no live request to the endpoint was made. No live submission, reload, installation or publication has been performed or verified for this configuration.

- Validation for this configuration: `npm run validate` passed typecheck and all213 tests (zero failures/skips); `git diff --check` passed. Version/dependencies remain unchanged. No commit, push or release operation was performed.

## Historical unreleased independent follow-up routing

- Ordinary owner text and explicit `/steer` during unrelated busy work now queue a Pi follow-up turn rather than sending the local-console refusal. Active authenticated Telegram work still receives steering; idle behavior and button/attachment follow-ups are unchanged. No console interruption, automatic queued acknowledgement, peer-extension detection/integration or wait for agent completion.
- Existing receipt admission only marks pending work; it does not grant Stop/file/reminder authority to the console task. Authority begins when that authenticated user message actually starts. Stale queued receipts remain invalid after disconnect/replacement. No receipt/Stop/watchdog implementation was widened.
- Registered-extension integration tests cover admission while console work is busy, no console Stop/file authority, later begun-turn file authority, continuing Telegram steering and stale queued replacement isolation. These are mocked host-event tests, not live activation. Existing feedback work remains unchanged and disabled pending its endpoint. Fresh combined typecheck and213 tests (none skipped), audit zero vulnerabilities, pack40 and diff checks passed; independent routing review approved with213 passing tests, audit zero vulnerabilities and pack40. No live activation; feedback remains disabled pending its endpoint.

## Historical unreleased native feedback (disabled pending endpoint)

- Native `/feedback` stays inside Telegram transport: dedicated ForceReply, exact owner/private-chat/prompt reply binding, plain preview with loaded version and destination, one-use Submit/Cancel. No model tool, Pi input, receipt/watchdog trigger, ordinary-message capture, rating or automatic solicitation.
- `src/feedback-endpoint.ts` deliberately exports undefined. Index/ConnectionManager always pass known bot identity for stale-prompt/preview rejection, and pass optional endpoint/version only when configured. No environment/settings override or setup UI. Missing/invalid endpoint refuses before collecting text; no placeholder service or backend implementation.
- Fixed15-minute deadline, nonblank1–2000 UTF-16 text,10-second HTTP timeout. Submit alone sends `{feedback,version}` over HTTPS, no redirects/retries/body parsing; HTTP200 including empty body succeeds. No Telegram/project/session identity or credentials added. Own-bot stale markers are rejection-only, never consent. Native cleanup is best effort.
- Agent questions remain independent except existing global `stop`/`/stop`, which retains priority even inside ForceReply and does not expand abort authority. Other commands in exact feedback replies are literal text.
- Source-only validation passed typecheck,211 tests (none skipped), audit zero vulnerabilities, pack dry-run40 files and diff checks. Independent review approved with211 passing tests, audit zero vulnerabilities and pack40. The endpoint remains undefined/disabled; no live feedback UI, HTTP submission or activation was performed. Version/dependencies remain0.6.0/unchanged; no publication, installation or reload for this work.

## 0.6.0 released

- Authorized 0.6.0 publication succeeded and public npm latest is verified. The exact release commit and artifact evidence are recorded in the current checkpoint below. Shared npm installation remains 0.5.0; source testing/reload is not package installation. This publication did not install or reload anything.
- After a user-reported reload, single-session Post/Edit/Draft update/finalize/Working clear and direct Thinking start → handoff → update → finalize were reported “perfect”. Inline callback placement and both choices disabled were “perfect”; compact tables/expandable quotes were “nice”; the omitted-reply reminder actually fired and posted. Loaded source path was not independently verified. This does not repeat the row-callback test or prove exact timer/no-loop behavior.
- The owner declined two-session testing and accepted it as an untested release limitation. Host cancellation, adverse-network behavior and skill adherence remain unverified. No cross-extension bridge or replacement steering fix is included; the original busy-console guard remains.
- Trusted Publisher mapping comput-sh/pi-telegram, publish.yml, blank environment is verified working by successful publication. Registry hashes and decoded SLSA linkage were independently checked; independent DSSE/certificate-chain/Rekor verification was not performed.
- Final checks passed typecheck and 195 tests (none skipped), audit zero vulnerabilities, package dry-run38 files and diff check on Node22/npm10 and isolated Node24/npm12. A test-only npm pack JSON compatibility fix supports strict single-package array and name-keyed formats without weakening package safety checks; no runtime/dependency change. Release-commit CI and publication validation succeeded.

## Historical source-development checkpoints (superseded by release evidence above)

- The proposed cross-extension steering integration was withdrawn and removed from source. Original authenticated-request routing and unrelated-console protection remain; no replacement design is implemented. The local Telegram-only source launcher remains unexecuted. Fresh rollback validation passed typecheck, 194 tests (none skipped), pack dry-run38 files and diff checks. Audit covered all22 production modules: only own Telegram/configuration/lifecycle, ordinary Pi host APIs, Git safeguards/metadata and own npm updates remain. Generic case-insensitive credentials.json / *.credentials.json upload protection replaces a product-specific basename without narrowing protection. Independent rollback review approved: all22 production modules and30 test files audited; no peer-extension awareness remains in source or distributed guidance. The original busy-console guard is restored. Loaded copies remain unchanged until a separately authorized restart; prior scoped live observations do not verify this rollback.

- Request-driven advanced layouts: `telegram_post` now takes exactly one of Rich Markdown message or narrow literal embedded content; content excludes top-level keyboard buttons. Paragraph text/button parts and button rows share the existing one pending question, owner/nonce/message/one-use safeguards; no raw callbacks/payload or extra approval authority. Limits are16 blocks/32 paragraph parts/8 total choices/4096 derived visible characters. Existing keyboard defaults remain unchanged; advanced embedded buttons, compact tables and expandable quotes are discoverable but only used on explicit request/preference, not enabled as a mode. HTML table/quote recipes use the unchanged message field; formatted HTML plus embedded content is outside the initial subset. Builder, Transport and independent Reviewer validation passed: typecheck and 193 tests (none skipped), pack dry-run (38 intended files), and diff check; no new dependencies. Independent advanced-layout review approved. The owner subsequently observed inline/row button rendering, clicks and disabled states, compact tables and expandable quotes on an updated client using prior loaded source; this does not verify the post-rollback checkout. These are unreleased source changes; shared/public npm remains 0.5.0.

- Approved onboarding checkpoint: README now prioritizes public npm 0.5.0 installation, BotFather pairing, harmless first reply, persistent-session resume and safe troubleshooting/removal. Three explicitly packaged guides separate public usage, unreleased agent contracts and source evidence. Pairing instructions wrap on narrow terminals without changing setup lifecycle; the Node engine floor is 20.9.0 (current examined Pi requires 22.19.0+), with standard Pi peers unchanged. Builder and independent Reviewer passed typecheck, 174 tests (none skipped), pack dry-run (36 intended files), and diff checks; lockfile change is root engine metadata only. Narrow pairing UI coverage is automated, not live pairing/reload. No version bump, publication, installation or reload in this scope; earlier validation counts below are historical checkpoints.

- Thinking now has explicit `telegram_thinking` start/stop/handoff actions, replacing the earlier no-argument diagnostic. Start optional integer refreshSeconds0–30 DEFAULT30 returns thinkingRef after first acceptance; stop freezes future refresh locally, not native erase; handoff(ref, full answer snapshot) positively settles an issued pulse within5s before a NEW normal native draft ID and returns draftRef. No natural-expiry wait for handoff. Only active/initial/in-flight/transition state excludes other preview starts; one retained metadata entry is not a lock and has no expiry timer. New starts/successful handoff/ownerStop/disconnect retire refs. Uncertain pulse/handoff fences previews until teardown (no remote-cancellation guarantee); Post/Edit/Activity remain available. No freeform Thinking/reasoning/mirroring or durable preview evidence. Final Transport and independent Reviewer lifecycle validation passed: typecheck and 167 tests (none skipped), diff check; prior pack dry-run (33 intended files) and unchanged lockfile remain verified. Independent lifecycle review approved. Source lifecycle activation and scoped owner observations are recorded below; direct handoff without stop remains unobserved. The prior164-test diagnostic checkpoint is superseded by this lifecycle implementation. Normal guidance is start → direct handoff → draft update/finalize: handoff already stops future refresh, so no redundant stop or artificial sleep. Standalone stop is optional local refresh control, not native erase. refreshSeconds bounds scheduled refresh, not exact visible duration; model/tool/API latency and the up-to-five-second positive-pulse barrier can contribute without measured attribution.

- Added a one-time omitted-reply reminder for latest authenticated inbound receipts that actually begin processing: five-second grace after agent_settled, only when no durable reply-tool attempt exists. Same-connection idle-only synthetic receipt is nonrecursive; no transcript forwarding, automatic user reply or task retry. Any executed Post/finalize/Edit/file/photo attempt suppresses conservatively, including preflight/uncertain failures; transient previews/Working/typing/control notices do not. New work, Stop/disconnect/replacement and stale assignments suppress. Builder and independent Reviewer validation passed: typecheck and 156 tests (none skipped), pack dry-run (32 intended files), diff check and unchanged lockfile. Reviewer approved the reminder; the owner subsequently observed live reminder injection on prior loaded source, not a post-rollback activation. Recovery is best effort and conservatively suppressed by any executed durable reply attempt; prior counts below are historical snapshots.

- Added `skills/pi-telegram/SKILL.md` and focused references for today's tools; `pi.skills` and npm files allowlist include them. Skills are optional/on-demand, not guaranteed loaded; extension tool contracts remain mandatory.
- Added opt-in `telegram_chat_action` diagnostic with fixed typing action and optional integer `refreshSeconds` 0–30 (default 0 pulse). Returns after first acceptance, refreshes in a bounded independent background loop. No clear action, Working coupling or live-visibility guarantee; comparison tests require coordinated activation and separate authorization. Mock/schema validation passed; the owner reported that an isolated 12-second typing test looked good. This is scoped single-session evidence, not a visibility guarantee.
- Generic `telegram_send` is removed. Explicit Post/Draft/Edit/Activity tools separate persistent messages, full-replacement previews, referenced edits and generic Working. No implicit status/prefix behavior; file/photo and Stop provenance safeguards remain.
- Admission and guarded cancellation are independent of control cleanup/outbound delivery. Notices and keyboard cleanup run in bounded supervised background work; ordinary text is admitted during downloads, extra files are rejected. No model/human-response waits, automatic forwarding or worker-termination promises.
- Packaging/reference/schema and new integration tests cover the explicit API. Historical typing-diagnostic checkpoint: Builder, Transport and independent Reviewer passed typecheck and 145 tests (none skipped), pack dry-run (31 intended files including seven skill Markdown files and transport queue), and diff check. Latest lifecycle checkpoint is 167 tests and 33 package files as recorded above. Prior audit found zero vulnerabilities; dependencies are unchanged. Provider-compatible flat string enums have runtime action/ref guards; no dependency/lockfile changes remain. Those historical checks did not activate the source; subsequent source activation and observations are recorded below. No new version or publication has occurred.
- Historical source testing before the latest user-reported reload: development source was activated, while published/shared npm remains 0.5.0 unchanged. The owner confirmed single-session Post/Edit/Draft with the expected two saved messages, plus a button follow-up repeating the draft test. Typing alone with a requested 12-second window looked good. Thinking alone with 12-second refresh was clear and expired naturally. Two explicit start → stop → handoff → update → finalize tests were described as “perfect”; visible Thinking lasted about 12–15 seconds despite a deliberate 3-second pause. Latency was not measured and no cause is attributed. Direct handoff without stop has not yet been owner-observed.
- Remaining release limitations: two-session testing explicitly declined/accepted as untested; host cancellation, slow-network behavior and skill discovery/adherence unverified. Latest user-reported-reload single-session evidence is recorded above; loaded path is not independently verified. Per-call runtime visibility-unverified messages remain appropriate: the tool cannot see the owner's UI.
- Host 0.5.0 installation was separately verified after publication. Source testing is distinct from that npm installation; the published checkpoints below retain their earlier release-time host state.

## State-based routing and model guidance (released in 0.5.0)

- Ordinary text steers active Telegram-originated work and starts a normal turn when idle. No queued acknowledgement. Leading `!` characters are literal text, unchanged; `/steer` remains an explicit command.
- The inbound notice now uses the approved concise reply/progress/formatting guidance. Activity guidance is prominent and distinct from draft streaming in the tool contract; transport semantics are unchanged.
- Button replies and attachments remain follow-ups. The console-origin protection remains: reject Telegram steering into unrelated console work with a resend notice rather than silently queueing it.
- Source and regression tests updated. Local validation: typecheck and 116 tests passed; pack/diff checks passed (23 package files), audit found zero vulnerabilities. Authorized 0.5.0 publication is verified below; activation and live routing verification remain pending.
- Host 0.4.1 was installed and the user confirmed integrated plain previews, replacement updates, and finalization looked good. This confirms that single-session visual test, not two-session lifecycle behavior.

## Plain-preview rendering fix (released in 0.4.1)

- User reported 0.4.0 Rich Draft tests showed only “TE” twice before final persistence. An isolated plain `sendMessageDraft` test was visually confirmed as good. This supports the transport change but does not isolate heartbeat effects or verify integrated behavior.
- Local source now uses plain previews, bounded to 4,096 characters with marked, surrogate-safe truncation. Full snapshots remain intact for prefix matching and Rich Markdown final persistence. Tool description clarifies preview limits versus input limits.
- Host 0.4.0 was installed and reload was followed by live test messages. User authorized publication as 0.4.1. Public npm latest and release provenance are verified below; installation was separate; the subsequent single-session visual confirmation is recorded in the current handoff below. Two-session smoke testing remains pending.

## Explicit draft streaming (released in 0.4.0)

- `telegram_send` message + Working without buttons now creates a temporary Rich Message draft. Full accumulated text extending the active draft's exact prefix updates that draft; different text persists the old draft and starts another. Matching never applies to already-persisted messages.
- Omitted status finalizes supplied text (or the pending draft for `{}`) and removes Working. Status-only Working retains the draft. Buttons always persist. Stop/disconnect/15-minute inactivity expiry discard pending state without publishing unfinished text; Telegram previews expire naturally.
- Tool description, prompt guidelines, inbound notice, README and changelog explain the full-snapshot protocol explicitly. No automatic assistant streaming. Local validation: 106 tests passed and typecheck passed; live rendering remains pending. User authorized publication as 0.4.0; public npm latest and release provenance are verified below. Installation is not part of this publication. Host npm was previously updated and verified as 0.3.0, and explicit Telegram sends have succeeded live; full draft-streaming verification remains pending.

## Explicit asynchronous messaging (released in 0.3.0)

- `telegram_send` replaces `telegram_ask`: optional Rich Markdown `message`, optional `status: "working"`, optional label/reply `buttons` requiring a message. Omitted status removes Working; `{}` clears it. No Idle label. Tools return after delivery, never await a human answer.
- Explicit text/status sends can originate in console/scheduled work, but require this session's ready, verified assignment. Inbound provenance remains for steering, Stop, files and stale-connection protection. Queued receipts retired at disconnect must not route to replacement bots.
- Automatic assistant commentary/final streaming and tool/Thinking lifecycle mirroring are removed. Working uses a separate removable message with heartbeat and 15-minute expiry. Stop/disconnect cleanup is best-effort; command/queue/update/attachment notices remain automatic.
- File/photo safeguards remain request-bound. User authorized 0.3.0 publication. Release validation: 102 tests passed, typecheck/pack/diff checks passed, zero audit vulnerabilities; 23 intended package files. Publication is verified below; live activation remains pending. Installed npm remains 0.2.5 until explicitly updated.

## Connection-notice fix included in 0.3.0

- Historical 0.3.0 behavior (superseded by unreleased silent startup above): startup sends the required Connected notice before optional menu configuration, with no startup Git-branch lookup. Menus run as bounded connection-bound background work; failure warns locally without disconnecting a healthy session.
- Existing initializing connections are not reported ready until the notice is accepted. Notice failure still tears down the connection for startup recovery.
- Regression coverage in `tests/connection-notice.test.ts`; investigation recorded in `docs/reload-notice-investigation.md`. Installed npm remains unchanged; live reload testing is pending. Included in the authorized 0.3.0 release.

## Reliability/streaming fixes (released in 0.2.5)

- Checkpoint `87ee97b` records reconnect recovery before streaming changes; both are included in 0.2.5. Startup retries assigned-session failures with bounded attempts/backoff and treats connection-notice failure as a failed connection. Retries stop on shutdown and recheck assignment.
- Subsequent streaming changes remove the phase-metadata gate: authenticated public text streams on text deltas, retaining multiline formatting and replacing the current preview. Thinking/tool data stays private. First public text writes immediately, later writes remain coalesced; generic status remains during tools/pauses.
- Validation: 98 tests passed. Live reload/update and streaming verification remain pending. The npm installation on this host was updated and verified as 0.2.5. Reload is still required to activate it; live reconnect/streaming testing is not yet verified.

## Question buttons (released in 0.2.4)

- Added `telegram_ask`: Rich Markdown question with 1–8 label/reply options, request-bound delivery, owner/chat/message/nonce validation and one-use callbacks routed as ordinary authenticated follow-ups.
- One pending question per connection; 15-minute expiry, replacement, typed answer, stop and disconnect invalidate it. Keyboard removal is best-effort. No approval is implied by tool success; no local confirmation bypass.
- Pre-release hardening rejects duplicate labels, fences slow sends against typed-answer/disconnect races, binds expiry timers to their question, and reports uncertain callback delivery without automatic replay or raw errors. Validation: 94 tests passed.
- Reload and live Telegram question/button smoke testing remain pending. Published in 0.2.4 with live testing still pending.

## Incoming files (0.2.3)

- Paired owners can send private documents/photos with optional captions. Captions are follow-up instructions, never Telegram commands or steering. Captionless attachments ask the agent to request instructions before inspection.
- `src/incoming-files.ts` streams to `.pi/telegram-inbox/` with unique sanitized names, Git-ignore/tracked-path checks, symlink rejection, 20 MB file and 100 files/100 MB inbox limits, and partial-download cleanup. Files persist until manually removed; no automatic execution/extraction, secret scanning or malware scanning.
- Downloads are connection-bound, abort on stop/disconnect, and do not block polling. One reception per connection; extra attachments/ordinary text during transfer receive explicit resend notices. Live upload smoke testing remains pending.

## Working-status fixes (0.2.3)

- Request activity resumes after completed messages and on authenticated assistant starts until `agent_settled`; parallel tools are tracked by call ID.
- Plain progress retains a visible generic activity label and changing heartbeat. Busy follow-ups receive a Queued acknowledgement without replacing active drafts.
- Regression tests added; live Telegram verification remains pending; the user authorized the 0.2.3 release with that limitation. `docs/working-status-investigation.md` records the prior behavior; its diagnostic artifact describes the pre-fix implementation.

## Update notifications (0.2.3)

- Startup includes the version captured when the extension factory loads. Background npm latest checks run on session startup/reload, with an eight-second timeout and PI_OFFLINE support; unassigned sessions stay silent.
- Owner-only native Update/Not now callback buttons use one-use connection-local nonces and exact message/chat validation. Approval queues an internal command, waits for idle, installs the exact offered version, then reloads only that session. Disconnect clears approval and aborts work.
- Only standard Pi npm prefixes are eligible; local/Git/symlinked/pinned/custom-manager installations are notification-only. npm is invoked through Node and npm-cli.js (no shell interpolation), with host-local update locking and installed-version checks. No automatic rollback or retry; raw npm output is not sent to Telegram.
- Automated tests cover version checks, protected installations, callback ownership/replay, idle deferral, cancellation and failed installs. Reload and live update/install smoke testing remain pending.

## Completion shortcuts (0.2.3)

- `telegram_complete_setup` and `/telegram-complete-setup` finish pending managed creation without Add-menu navigation. “Done” is contextual tool guidance, not a global keyword interceptor.
- New pending requests store canonical project path and persistent session ID. Other sessions/projects cannot complete them; legacy requests require explicit local recovery confirmation. Manager mutation compares the exact pending snapshot, preventing cancellation/replacement races from resurrecting requests.
- `/telegram-start` offers the initiating session's pending completion first. Local interactive UI, webhook and transfer confirmations remain required; live smoke testing and reload are pending.

## Photo delivery (released in 0.2.2)

- Added separate `telegram_send_photo` for inline PNG/JPEG delivery with 10 MB, dimension-sum (10,000), and aspect-ratio (20:1) checks. `sharp` is a runtime dependency for actual image decoding/validation.
- Photo/document uploads share request-bound routing, project-file safeguards, captions, and abort-aware upload transport. No conversion, fallback, or metadata stripping. Reload and live inline-photo smoke testing remain pending.

## Historical 0.6.0 handoff / release checkpoint

- Source and public npm `latest` at that checkpoint: **0.6.0**, released from `9ab9c133daeef0f23b96b7afefe773581bca0c87`.
- CI **36181107612** and Trusted Publishing **36181188483** succeeded. Earlier run **36180596310** failed validation and its publish step was skipped; it did not publish a competing artifact.
- Independent download verification: all **38 files** byte-match the release commit. SHA-1: `e0f8a6c455c65c91386a3e03c5ae11cc6e2758d3`. SHA-512 matches registry integrity and the decoded SLSA subject digest.
- Registry SHA-512 integrity: `sha512-BlLloQEmVOd8DgktFvOVVntA9cOGto26JlfRIIzx4JxLI929d5Y+s2/9Y1+mGGmYDgG1HLnmYzgCMfXhLertsg==`.
- Decoded SLSA v1 identifies `comput-sh/pi-telegram`, `.github/workflows/publish.yml`, the exact release commit and run **36181188483**, attempt **1**. Hashes and payload linkage were checked, not an independent DSSE/Sigstore certificate-chain/Rekor verification.
- Final validation: typecheck, **195 tests** (none skipped), audit zero vulnerabilities, pack38 and diff checks; Node22/npm10 and Node24/npm12 passed. The npm12 fix is test-only and retains strict package safety assertions.
- Installed/shared npm remains **0.5.0**. Single-session source observations are scoped above; two-session testing was declined and accepted as untested, and host cancellation/adverse-network limitations remain. The original busy-console guard is unchanged.
- The published tarball includes its pre-publication documentation snapshot. This post-publication checkpoint is documentation-only and does not alter that immutable artifact. Do not republish 0.6.0. Keep artifacts and hidden local runtime state out of commits/packages.

### Historical 0.5.0 checkpoint

- Source and public npm `latest` at that checkpoint: **0.5.0**, released from `6275bfdfbe6d47778bf12b8f20331c9c1ca3e96e`.
- Trusted Publishing run **35530702310** succeeded. Public registry metadata and SLSA attestation identify that exact commit and `.github/workflows/publish.yml`; the attestation names run attempt 1.
- Downloaded tarball SHA-1: `57ab82707b02434d71890f560e78f869aa336628`; 23 files. SHA-512 matches registry integrity and the SLSA subject digest.
- Fresh release validation passed: `npm ci`, typecheck and **116 tests**, audit (zero vulnerabilities), pack check (23 intended files), and diff check; workflow CI validation succeeded.
- Host installation remains **0.4.1**; this publication did not install or reload 0.5.0. Single-session 0.4.1 visual confirmation does not verify 0.5.0 routing or two-session lifecycle behavior; those live tests remain pending.
- Keep `artifacts/` and hidden local runtime-state directories out of release commits and packages. Do not republish 0.5.0.

### Historical 0.4.1 checkpoint

- Source and public npm `latest` at that checkpoint: **0.4.1**, released from `7b40e1d9783b0716ba299917f1f2a616382e6ee4`.
- Trusted Publishing run **35473205305** succeeded. Registry metadata and SLSA attestation identify that commit and `.github/workflows/publish.yml`.
- Tarball SHA-1: `4423bbca035c443ee2ca98b7496c283786a8bd3d`; 23 files. **107 tests passed**, typecheck/pack/diff checks passed, zero audit vulnerabilities; CI validation succeeded.
- Publication itself did not install or reload 0.4.1. Subsequently, host **0.4.1** was installed and the user confirmed integrated plain previews, replacement updates, and finalization looked good. This confirms single-session visuals only; two-session smoke testing and activation/live verification of unreleased changes remain pending.
- Keep `artifacts/` out of commits/packages. Do not republish 0.4.1.

### Historical 0.4.0 checkpoint

- Source and public npm `latest`: **0.4.0**, released from `fff2a5251be0df4cd1a230a6d5960403518b9970`.
- Trusted Publishing run **35472260405** succeeded. Registry metadata and SLSA attestation identify that commit and `.github/workflows/publish.yml`.
- Tarball SHA-1: `516b460faa91dee81816aed396b3d7ee033a5159`; 23 files. **106 tests passed**, typecheck/pack/diff checks passed, zero audit vulnerabilities; CI validation succeeded.
- Host npm was last updated and verified as **0.3.0**. This publication did not install or reload 0.4.0. Explicit 0.3.0 sends have succeeded live; 0.4.0 draft rendering/finalization and two-session smoke testing remain pending.
- Keep `artifacts/` out of commits/packages. Do not republish 0.4.0.

### Historical 0.3.0 checkpoint

- Source and public npm `latest`: **0.3.0**, released from `fece2e438713147d068e4f143bcfe0c151b28bd1`.
- Trusted Publishing run **35470512067** succeeded. Public registry and SLSA provenance were checked; the attestation identifies that commit and `.github/workflows/publish.yml`.
- Tarball SHA-1: `fc0288ab2d7e3feb12d8585363335d9b76e82dae`; 23 files. Local typecheck and **102 tests passed**, zero audit vulnerabilities; pack and diff checks passed. CI validation also succeeded.
- Installed npm on this host remains **0.2.5**. Update and `/reload` are required; neither installation nor live verification was performed during this publication.
- Real Telegram async-send, status-removal, reload and two-session smoke tests remain pending. Keep `artifacts/` out of commits/packages. Do not republish 0.3.0.

### Historical 0.2.5 checkpoint

Last verified against release commit `0bfe2ae`:

- Local and GitHub source version: **0.2.5**.
- npm `latest`: **0.2.5**, published and public-registry verified. Published tarball SHA-1: `17754cdbdc93c7d413ac8889dbd3a3170a32b626`.
- Startup now sends `Connected · ProjectName · IP · vVersion`; `/status` retains branch, hostname, and controls.
- `728a9f8` committed the multi-bot/session-assignment implementation and lifecycle hardening; `a227cbc` switched the publishing workflow to token-free authentication. Both are pushed to `origin/main`.
- Last validation: TypeScript typecheck and **98 tests passed**. `npm audit` reported zero vulnerabilities; npm pack inspection contained 23 intended files, including `CHANGELOG.md`. These are checkpoint results, not guarantees about future edits.
- **Trusted Publishing is verified working.** Run `35464035626` published 0.2.5 from `0bfe2ae` through GitHub OIDC with signed SLSA provenance; the registry attestation identifies that exact commit and workflow. Public registry visibility lagged workflow success by a few minutes; verify the registry rather than immediately retrying publication.
- Earlier OIDC authorization failures were resolved after the user saved the package-specific GitHub Trusted Publisher mapping. Enabling “Allow npm publish” alone was insufficient. The workflow retains filtered OIDC diagnostics.
- Local `npm whoami` also returned `401`. Do not assume previously configured local npm credentials are valid.
- Real Telegram two-session smoke testing of the new lifecycle remains pending. Automated lifecycle tests use mocked Pi contexts and Bot API responses.

### Next steps and future releases

1. Two-session smoke testing remains unperformed; the owner declined it and accepted that release limitation. Perform it only if separately requested.
2. Review removal/revocation of any old local npm publishing credentials through secure local/account UI. Never inspect or print token values in model context. OIDC publication no longer requires a local npm token.
3. The Trusted Publisher mapping is GitHub owner `comput-sh`, repository `pi-telegram`, workflow filename `publish.yml`, no GitHub environment name. Successful 0.6.0 publication verified this mapping; exact registry/artifact and decoded provenance linkage are recorded above.
4. For an authorized future release, bump the version, validate, push, and dispatch `.github/workflows/publish.yml`. Do not republish 0.2.0, 0.2.1, 0.2.2, 0.2.3, 0.2.4, or 0.2.5. This workflow also runs on a published GitHub release; avoid duplicate publication triggers.
5. Verify workflow success, public registry version, and provenance before updating this checkpoint. The published 0.2.5 tarball additionally includes reconnect recovery and phase-independent public-text streaming; this post-publication checkpoint update is documentation-only.

Do not initialize Git, commit, push, tag, or publish without explicit user authorization for that operation. Documentation review alone is not authorization to publish.

## Architecture and invariants

- Global settings: `~/.pi/agent/pi-telegram/settings.json`; `PI_TELEGRAM_SETTINGS` may override that path. They contain provisioning mode and, in manager mode, manager credentials, update offset, one pending creation request, and a best-effort managed-bot identity catalog. The catalog contains no child tokens.
- Project settings: `.pi/pi-telegram.local.json`, version 2 with a `bots` list. Each entry stores Telegram identity, token, authorized owner, managed/manual origin, and `sessionId` or `null`.
- Legacy version-1 settings load as one unassigned bot without writing during startup; the next mutation writes version 2.
- Assignments use `ctx.sessionManager.getSessionId()`. Enforce at most one bot per non-null session ID in a project. A host-local lease prevents concurrent polling of the same bot across local projects/processes; there is no cross-machine coordination service.
- `session_start` is passive unless an exact assignment matches. It must never prompt or provision. Pi emits shutdown/start for new, resume, fork, and reload; shutdown aborts pending setup and closes polling while preserving assignments for resume.
- Confirm transfers and compare the confirmed project snapshot under the mutation lock. Rollback is compare-and-swap too; never undo an intervening session's decision.
- Release clears only the current session assignment, preserving credentials. Removal requires separate destructive confirmation and deletes only local project credentials, not the Telegram bot or its token at Telegram.
- Acquire the runtime lease before private owner pairing or ordinary polling. Re-adding an already paired project bot preserves its stored owner; changing owner requires removing it and pairing again.
- `proper-lockfile` heartbeat locks renew every ten seconds and become stale after two minutes without renewal. Serialize all manager writes and project mutations. Do not replace this with unchecked PID/mtime-based unlink logic. Live legacy PID locks require the old process to release or reload first.
- Connected processes check ownership every second and disconnect if ownership/credentials change or cannot be verified. Failed switches restore prior state only if it has not changed in the meantime. Notification delivery failure must not prevent release/removal cleanup.
- Save a new managed child unassigned before advancing the manager update offset, then use the normal confirmed assignment flow. A pending creation request is not permission to transfer an existing bot.
- Telegram has no `listManagedBots` or arbitrary private bot username-to-ID lookup. Managed recovery requires a catalog identity, known numeric child ID, or child credentials; usernames must never be invented or derived from project names.
- Startup refuses existing webhooks. Explicit setup must confirm removal before local polling; API helpers must not silently delete webhooks.

## Telegram and AI integration

- Accept only private text and supported document/photo/voice-note attachments from the stored Telegram owner; voice is unreleased intake only, not automatic transcription.
- Ordinary text steers authenticated Telegram work while busy and starts normally when idle; leading `!` characters remain literal. Ordinary text and explicit `/steer` targeting unrelated busy work use a follow-up turn instead, never console steering. Queue admission does not grant request authority until its authenticated user turn begins. Buttons and attachments remain follow-ups. Do not send queued acknowledgements.
- One-use in-memory request receipts admitted via Pi's extension input source bind output to the receiving connection. The public transport prefix is formatting guidance, not evidence of origin. Clear receipts on disconnect/session replacement.
- Do not automatically forward assistant text or tool activity. Agent content goes through explicit `telegram_post`, `telegram_draft`, `telegram_edit` and `telegram_activity` calls, including proactive sends from console/scheduled work. Generic `telegram_send` is removed in unreleased source. Never expose hidden reasoning, prompts, raw tool arguments/results, or credentials.
- The concise inbound notice guides replies, milestone progress and Rich Markdown formatting, not authentication; streaming mechanics remain in tool descriptions/guidelines.
- Explicitly call activity `working` at work start and while activity continues; refresh before 15-minute expiry. Call activity `clear` when no work continues; it does not finalize/discard drafts. Execution/worker activity is not automatically mirrored.
- Post persists Rich Markdown with optional buttons; Draft explicitly starts/updates/finalizes/discards full replacement previews, without prefix inference. Edit replaces a returned non-button messageRef. Refs are connection-scoped; stale refs are rejected. No MarkdownV2/plain-text fallback for model answers.
- Stop eligibility follows inbound provenance, independently of status visibility. No settled transcript replay. Background status failures produce rate-limited local warnings.
- Setup requires local interactive TUI; masked tokens must never pass through chat or model-callable tool arguments.

## Source map

- `src/index.ts` — Pi event, command, and tool registration.
- `src/connection-manager.ts` — connection lifetime, shutdown, polling ownership, monitoring.
- `src/setup-flow.ts` — Add/Manage menus, assignment, pairing, creation/recovery, rollback, status.
- `src/setup.ts` — masked input, manager configuration, cancellable pairing UI.
- `src/assignment.ts` — compare-and-swap assignment transactions.
- `src/config.ts` — schema validation/migration, private storage, Git/symlink checks.
- `src/locks.ts`, `src/runtime-lease.ts` — settings and runtime heartbeat locks.
- `src/request-routing.ts` — request receipts and public response lifecycle.
- `src/routing.ts`, `src/messages.ts` — transport notice, steering, public-text extraction.
- `src/bot-api.ts` — identity validation, managed-bot APIs, owner pairing.
- `src/telegram.ts` — polling, native commands, drafts, Rich Messages, uploads.
- `src/files.ts`, `src/photos.ts`, `src/host.ts` — safe attachments, image validation, and startup/status host information.
- `src/updates.ts` — loaded package identity, registry checks, safe npm installation targeting, idle update sequencing and installation locking.
- `tests/` — unit and mocked lifecycle tests, including transfer races, rollback, offline release, cancellation, lease contention, and request-origin isolation.
- `docs/architecture.md` — design and runtime flows.
- `docs/telegram-rich-messages.md`, `docs/telegram-draft-ux-baseline.md` — API evaluation and tested draft UX.

## Security boundaries

- Keep authorization, lifecycle, transport, and credentials in code, not skills or model instructions.
- Never log, display, commit, or put live bot tokens, npm credentials, private keys, or credential settings into model context.
- Global and project credential writes reject tracked/symbolic paths and exclude both destination and temporary-file patterns from Git before writing. Stored JSON is plaintext; restrictive file modes are not encryption or a Windows ACL guarantee.
- Attachments must remain inside the canonical project root, exclude known credentials/repository internals and configured credential paths, and be revalidated before upload. Filename checks do not scan arbitrary file/archive contents for secrets.
- Keep the 50 MB upload limit and 1,024-character caption limit. File delivery requires an active Telegram-originated request.
- Do not copy historical private repositories, cloud credentials, or private Git history into this public repository.

## Validation and activation

Run from this package root:

```bash
npm ci
npm run validate
npm audit --audit-level=moderate
npm run pack:check
git diff --check
```

`proper-lockfile` is a runtime dependency and must remain in `dependencies`, not only `devDependencies`.

After changing the installed local package, run `/reload` in Pi to activate it. Do not claim reload, live Telegram testing, or successful publication unless actually verified. Refresh this handoff when release status or behavior changes.
