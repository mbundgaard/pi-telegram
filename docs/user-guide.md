# Pi Telegram user guide

[Quick start](../README.md) · [Changelog](../CHANGELOG.md) · [Agent tools](agent-tools.md)

This guide describes **0.6.7**. Publication evidence is recorded in [development status](development-status.md); installation and loaded-runtime support are separate. The separate [agent-tools guide](agent-tools.md) explains the explicit messaging API and migration from 0.5.0.

## Native secret files (0.6.3)

Source review and dummy-data tests passed; live intake/deletion remains unverified. Confirm that a supporting runtime is loaded before sending any value; documentation does not activate it.

In the paired owner's private bot chat, select `/secret` from the menu or send it bare. Reply directly to the native filename prompt with a non-sensitive filename only, then wait for a separate “Ready to save filename” content prompt. Alternatively send `/secret filename` to skip the filename question. Use a simple ASCII basename (1–64 characters, starting with a letter/digit, then letters/digits/dots/underscores/hyphens). Paths, leading dots, repeated/trailing dots, device names and config/git names are rejected. Never put secret data in the command or filename. Invalid filename replies can be corrected by replying again to the same filename prompt; unsafe/unavailable destinations are refused before requesting contents. Invalid explicit `/secret filename` shortcuts are refused without starting intake.

Reply **directly to the bot's “Ready to save filename” prompt** within five minutes of starting intake. This is one fixed deadline for both stages and all corrections, not five minutes per prompt. Nonempty text is stored exactly as UTF-8, including whitespace, up to 16,384 bytes. Empty text, media, forwarded data and edits are not accepted. No preview is produced. `/cancel`, `/stop` (including their native command forms/arguments), and plain `stop` are reserved even in exact replies: they cancel rather than become file contents. Other exact content-prompt reply text is literal data, not an executable command. Filename-prompt replies are only filenames and never become file contents; once accepted, old filename-prompt replies are rejected.

In 0.6.5, a valid standalone `/secret` replaces an outstanding agent question, unfinished feedback or previous secret intake—including pending prompts. You do not need to answer an unrelated question first. Replacement neither approves nor cancels agent work and never submits feedback. Invalid filenames leave the current interaction intact; finish an active download before starting. During intake, unmatched messages and other controls are blocked rather than sent to the model, and new agent button questions are refused. `/cancel` cancels native secret intake and feedback, not an agent task. Stop retains its existing request-scoped agent cancellation authority. Replying to an expired/cancelled secret prompt cannot restart intake; send a new standalone `/secret` instead. `/secret` text sent as a direct content-prompt reply remains literal file contents (except reserved Stop/cancel controls).

A prompt can appear before Telegram confirms its delivery. Version 0.6.5 holds at most one bounded exact-prompt candidate in memory and processes it only after Telegram confirms the same prompt ID. Duplicate/mismatched replies are not replayed. Failed or uncertain prompt delivery cancels intake and drops the candidate; remove sensitive replies manually and do not blindly resend. The original five-minute deadline still applies.

Files are saved at `.pi/telegram-secrets/filename`. In 0.6.7, reusing a filename replaces a safe regular file without another confirmation, only after authenticated contents arrive. Starting a prompt never truncates the file; cancellation or failure before the atomic same-directory rename preserves its previous contents. Successful replacement creates a new 0600 file, including when the old regular file had different permissions. Symlinks, directories and hard-linked destinations are refused. The entire directory is Git-ignored and refused by Telegram document/photo upload tools, including unrecognized filenames; outbound hard-link aliases are refused as well. Existing unsafe paths/permissions require local repair, not automatic broad chmod or deletion. Unix creation modes are directory 0700/file 0600; these are not a Windows ACL guarantee.

After saving, the bot attempts one bounded deletion each for the original data reply and content prompt (filename prompts and replies remain for manual cleanup), then confirms the filename and byte count. Failed/uncertain deletion asks you to remove them manually; do not assume Telegram's copies, notifications or backups disappeared. Stop/disconnect/expiry cannot undo an already completed save; if interrupted after commit, the file can exist without a success notice or agent notification. Check locally before retrying an uncertain save—reusing the filename can replace the saved contents. Cancelled/failed intake leaves chat messages for manual removal.

**Privacy limits:** The input fence lasts only while intake is active. After cancellation, expiry, preparation failure or reconnect, ordinary text that is not a direct reply to a recognizable secret prompt follows normal chat routing and can reach the model. Never paste a value as a standalone message; the flow does not scan or redact ordinary conversation. Telegram bot chats are not end-to-end encrypted. Files are plaintext, not masked or encrypted. Only the saved project-relative path and byte count reach the agent, with instructions not to inspect the contents; a filesystem-capable agent can still read them later. Do not submit secrets if this boundary is insufficient. The storage safeguards are not protection against a hostile local process concurrently replacing project paths or changing Git state; a crash/failed cleanup may leave an ignored private temporary file. No automatic startup solicitation, deletion retry, secret processing, execution or interpolation occurs.

## Where commands run

- **Terminal:** operating-system shell, before or alongside Pi (`pi install`, `pi -r`).
- **Local Pi:** type into Pi's interactive terminal editor (`/telegram-start`). Setup confirmations and masked credentials stay here.
- **Telegram:** the paired owner's private bot chat (`/status`, normal requests).

Install as a Pi package, not with a bare `npm i`: terminal `pi install npm:@comput/pi-telegram`. This installs user-wide resources; bot credentials and session assignments are still per project. Pi also supports project installation with `pi install npm:@comput/pi-telegram -l`; use the same scope for removal. Terminal `pi list` shows installed sources, and `pi config` enables/disables resources (`pi config -l` starts with project overrides). Review trust prompts instead of bypassing them. Official [Pi package documentation](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/docs/packages.md) explains pinned/local/Git sources.

## BotFather setup and recovery

The recommended path is **Local Pi** `/telegram-start` → **Add a bot…** → **Add BotFather bot** (or `/telegram-setup-bot`). Create a bot with Telegram's verified **@BotFather** using `/newbot`, then enter its exact username and token only in Pi's local UI. Token input is masked and checked against Telegram. Never send a bot token to the model or paste it into this chat.

If the bot already has a webhook, Pi asks before removing it for local polling. That would affect its existing integration: decline unless you intend to move it. Startup never silently deletes webhooks.

Open the new bot's private Telegram chat, press **Start**, then send the exact one-time pairing code displayed by Pi. The pairing window expires after three minutes; Escape in local Pi cancels it. Pairing instructions wrap on narrow terminals while retaining every character. If a display still clips the code, widen the terminal or cancel and retry—do not guess the code.

A regular BotFather bot can be restored after reinstall by adding its username/token again. Re-adding an already paired project bot preserves its stored owner. Changing owners requires explicitly removing the local entry and pairing again; do not edit the owner field manually.

### Explicit reload acknowledgement (since 0.6.2)

An accepted private owner `/reload` can reply `Telegram reloaded · v<loadedVersion>` once the **new Telegram runtime** has loaded and verified the same connection. This does not certify that every Pi resource/UI reload step succeeded. No reply is promised after failed/expired reloads, changed assignments or delivery failures; use `/ping` to check readiness. Local reloads, ordinary startup/reconnection and updater reloads do not arm this acknowledgement. Busy/pending work and downloads refuse native reload. Use Pi 0.84.4 or later and Node 22.19.0 or later; candidate checks use Pi 1.3.0. The acknowledgement requires explicit reload lifecycle reasons and the identical session-manager object across fresh factories (verified in the examined 0.84.4/0.87.1/1.3.0 implementations). Hosts lacking these properties suppress the acknowledgement; `*` peers do not promise compatibility with every host. This is not process restart.

### Silent startup (since 0.6.2)

Startup, resume, reload and reconnection no longer send an automatic Connected message. Check local `/telegram-status`, or send `/ping` in the paired owner's private chat for `Pong · project · vLoadedVersion`. Ping is handled by the extension even while the model is busy: it does not steer, create a model request or grant file/Stop authority. It does not look up Git, hostname or IP; `/status` remains detailed. No reply is promised while disconnected. Published 0.6.1 retains its startup notice. Explicit setup confirmations, critical errors and update offers are unchanged.

### Context compaction notices (0.6.4)

When Pi's compaction extension hooks are available, the connected bot reports that context compaction is starting, then reports completion, failure or cancellation when the corresponding outcome hook arrives. This works for automatic compaction and manual `/compact`, without asking the model to send a message. Notices contain no summary or conversation content and do not mean your request has finished.

Delivery is best effort and limited to the current connection. Early preparation/authentication pauses and failures before the start hook may be silent; older hosts missing an outcome hook remain start-only rather than claiming success. Full hook emission was source-verified in Pi 0.87.1 and the development SDK 1.3.0, not every supported host. This feature has not been installed into the running host or live-tested.

## Sessions, transfers and safe recovery

A project can hold multiple bots, but each persistent Pi session has at most one assigned bot and each bot entry has one session assignment. **Local Pi** `/session` shows the persistent session ID; `/name` can give it a recognizable display name. Resume that session from the same project using **terminal** `pi -r`, `pi -c` for the most recent session, or `pi --session <id>`. Inside Pi, `/resume` opens the session picker. Avoid `--no-session` for a setup you want to resume.

`/new`, `/fork` and `/clone` create different sessions; they do not inherit the old bot assignment. Use `/telegram-start` if you deliberately want to select/transfer a bot. Transfers require local confirmation; setup stops if the confirmed configuration changed during a dialog. The old process checks ownership and stops polling after a transfer. Failed transfers restore the old assignment only when it has not since changed.

One host-local lease protects polling/pairing. Release the old integration before moving the same bot between projects or machines; there is no cross-machine coordination service. On a polling conflict, identify and release/close the previous Pi process first. Abandoned locks become recoverable after two minutes without heartbeat. **Never delete live locks or run multiple polling clients to force recovery.** Release or reload older PID-lock implementations before migration.

## Commands

| Local Pi command | Purpose |
|---|---|
| `/telegram-start` | Select, add or transfer a bot for this session |
| `/telegram-status` | Inspect this session's assignment/connection |
| `/telegram-release` | Disconnect/unassign this session; preserve credentials |
| `/telegram-remove-bot` | Select and remove local project credentials; not Telegram revocation |
| `/telegram-setup-bot` | Add a BotFather bot |
| `/telegram-setup` | Choose manual or advanced manager mode |
| `/telegram-setup-manager` | Configure an advanced manager bot |
| `/telegram-complete-setup` | Complete this session's pending managed creation |
| `/telegram-cancel-managed-bot` | Cancel a pending managed creation request |

| Telegram input | Behavior |
|---|---|
| Normal text | Starts a turn when idle; steers recognized Telegram-originated work while busy |
| `!text` / `!!text` | Literal text, not shell controls |
| `/steer text` | Explicit steering, subject to the same origin guard |
| `/ping` | Native connection check: Pong, project and loaded package version; no model turn |
| `/status` | Project, branch when available, host/IP and controls |
| `stop` / `/stop` | Requests cancellation of eligible Telegram-originated work; not proof all workers stopped |
| `/reload` | Requests Pi reload while idle; does not replace the Pi process |
| `/help` | Lists Telegram controls |
| `/secret [filename]` | Native filename/content intake; never put values in the command |
| `/cancel` | Cancels native secret intake or feedback |

Process restart is unsupported. A manually typed `/restart` safely refuses, without queuing work or shutting down. Only persistent-session assignments are supported; instance-following is not implemented.

**Routing since 0.6.1:** ordinary owner text and `/steer` during unrelated console work are accepted as a Pi follow-up turn, not steering. They run after current work finishes; no queued acknowledgement is sent and transport does not wait for the agent. Existing Telegram-originated work still receives steering; idle input still starts normally. Queue admission alone grants no Stop/file/reminder authority over console work—the trusted Telegram receipt must actually begin processing. This is a new turn in the same Pi session, not a separate session. Published 0.6.0 still uses the older refusal/resend behavior. Live activation of this change is unverified.

Replies are sent through explicit extension tools, not automatic forwarding of console text. Use `telegram_post` for replies/buttons, `telegram_draft` for previews and finalization, `telegram_edit` for returned message references, and `telegram_activity` for separate Working/clear control. The removed 0.5.0 `telegram_send` API has no compatibility adapter; see [migration](agent-tools.md#migration-from-050). Button selections and attachments are authenticated follow-ups, not steering commands or automatic approval.

## Native feedback (0.6.1)

The `/feedback` command is separate from the coding agent. The owner-approved production endpoint is configured as `https://feedback.comput.sh/` (root, no extra path). This is included in published 0.6.1, not 0.6.0. Publication is verified; live submission and activation remain unverified. There is no environment/project override or setup step. Missing/invalid endpoints still report unavailable before collecting feedback.

`/feedback` opens a dedicated Telegram ForceReply prompt. Reply directly to that prompt with 1–2,000 UTF-16 code units of nonblank text, then review the feedback and package version and choose **Submit** or **Cancel**. The whole flow expires after 15 minutes; only the exact owner/private-chat reply and one-use confirmation are accepted. Ordinary messages remain ordinary agent requests. Replies to stale feedback prompts/previews are rejected locally, never silently sent to the model. Attachments are not accepted as feedback.

Only Submit sends JSON containing `feedback` and `version` to the HTTPS endpoint. No Telegram user/chat/bot IDs, project/session identities, files, transcripts or credentials are added. Your own text can contain sensitive data: do not include secrets or private project details. Telegram still carries the prompt/reply, and ordinary network metadata exists; this is not an anonymity guarantee. A ten-second timeout and redirects-as-errors apply, with no automatic retry. HTTP 200 is success even with an empty body. Uncertain delivery is not proof nothing arrived; do not blindly resubmit.

Feedback is not AI-processed, does not create a request receipt or arm the reply reminder, and does not replace an active agent question. **Exception:** `stop` and `/stop` retain their existing global-control priority even when replying to a feedback prompt: they cancel feedback and may abort eligible Telegram work/clear its question. `/cancel` also cancels native feedback. `/secret`-prefixed replies are intercepted rather than stored as literal feedback; send a new standalone `/secret` to replace feedback without submitting it (0.6.5+). Other commands in an exact feedback reply are literal feedback text. Native UI cleanup is best effort, not proof of cancellation. No rating, automatic welcome/upgrade prompt or backend implementation is included.

## Files and privacy

For a requested outgoing project file, the agent can use `telegram_send_file` (up to 50 MB). `telegram_send_photo` sends inline PNG/JPEG (up to 10 MB, width+height at most 10,000, aspect ratio at most 20:1). Captions are at most 1,024 characters. Photos may be resized/compressed; ask for document delivery for original bytes. There is no automatic format conversion or metadata removal.

**Voice intake (since 0.6.2):** private owner `message.voice` notes use the same inbox limits and cancellation safeguards as documents/photos. Original bytes are saved as a generated `*-voice.bin`, without assuming a codec from MIME. Bounded claimed MIME/duration are labeled untrusted in the agent receipt alongside the actual byte count. Captionless notes ask for instructions; there is no automatic inspection, decoding or transcription, no transcription provider, and no support for `message.audio`, video notes or other media. Original-format preservation was locally verified in the prior owner workflow (reported for this preparation); this preparation performs no live voice download, decoding, transcription or cloud upload. Loaded-runtime activation remains unverified.

The paired owner may upload documents/photos privately. Captions become follow-up instructions, not Telegram commands. Without a caption the agent should ask what you want before inspection. Downloads are limited to 20 MB each and 100 files/100 MB total inbox storage, saved under `.pi/telegram-inbox/`; files stay until removed locally. Partial downloads are cleaned up. Downloads run sequentially. Ordinary text and `/steer` remain admissible during downloads, subject to console-task protection; question-button selections require retry after reception finishes. Versions through 0.6.5 refuse additional attachments during a download.

**Incoming groups (0.6.6):** selecting multiple supported documents/photos as a Telegram group produces one combined follow-up, with each saved path, byte count and caption. Telegram sends separate updates without a group-end marker: collection closes after 800 ms without another item, or 3 seconds from the first item, whichever comes first. This is best effort, not proof the album is complete. Late items are refused with a resend notice; resend them as a new message/group. Separate groups and ungrouped messages are never merged; voice notes remain individual attachments. A single collected item retains the ordinary single-file receipt.

The per-connection queue accepts up to 4 batches and 30 files total (including the active batch), at most 10 files per group. Full queues refuse excess items rather than silently dropping accepted files. Each active batch has a 120-second reception deadline. Groups arriving during another download wait in first-arrival order; captions remain literal user instructions, never native commands. Captionless batches ask what you want before inspection. Failed files are identified in the combined receipt when at least one file succeeds; an all-failed batch produces only a failure notice. Successful saves remain even if a later file fails or Stop/disconnect cancels the batch; cancellation suppresses its unfinished receipt, not already-saved files. Stop clears both collected and queued work. No persistent queue, automatic retry, execution, extraction or transcription is added. Duplicate-message and closed-group memory is bounded to the latest 512 IDs/keys per connection, not durable deduplication across reconnects.

Paths stay inside the project, with credential/repository-internal and symlink/tracked-path safeguards. These checks are **not** secret-content or malware scans. Files are untrusted data, never automatically executed/extracted. Bot chats are not end-to-end encrypted. Telegram receives explicitly sent replies and attachments; requested ping/status replies disclose project/version or host information. Review uploads yourself before requesting them.

## Updates and removal

For the usual unpinned npm install, use **terminal** `pi update npm:@comput/pi-telegram`, then **Local Pi** `/reload` in each session that should use the new package. Plain `pi update` updates Pi itself, not this package. Pinned versions are not advanced by ordinary package updates; deliberately select a new version with `pi install npm:@comput/pi-telegram@<version>` instead. Local/Git/custom-manager installations require their own reviewed update path.

Startup checks npm in the background with an eight-second timeout; failure does not prevent connection. `PI_OFFLINE` suppresses that check. Eligible standard npm installs may offer owner-only **Update / Not now** buttons; approval applies to the offered version and only the approving idle session reloads. Other sessions are not restarted. These flows have mocked coverage, not complete live install verification. Failed/uncertain installs are not automatically retried or rolled back.

Choose the operation you actually want:

| Goal | Action | What remains |
|---|---|---|
| Disconnect this session | Local Pi `/telegram-release` | Project credentials, Telegram bot and token |
| Forget a project bot | Local Pi `/telegram-remove-bot`, confirm selection | Telegram bot/token remain valid at Telegram |
| Disable loading | Terminal `pi config`, then local reload/restart | Installation and credentials remain |
| Uninstall this extension | Terminal `pi remove npm:@comput/pi-telegram` (add `-l` for local scope), then local reload/restart | Stored credentials/session files and Telegram bot may remain |
| Revoke a leaked token or delete a bot | Use verified @BotFather / Telegram's controls | Local entries do not update automatically; reconnect/re-pair deliberately |

Release/remove credentials **before** uninstalling if that is your intent. Package removal does not revoke a token or erase private settings. Never delete credential files wholesale as routine troubleshooting.

## Advanced: manager-created bots

Most users should use BotFather. Manager mode additionally requires a manager bot whose verified Telegram identity has `can_manage_bots: true`. **Local Pi** `/telegram-setup-manager` collects its username and masked token; ordinary bots cannot substitute for a capable manager.

Choose **Add a bot… → Create managed bot**, provide the exact child username, approve Telegram's creation link, and press **Start** in Telegram. Tell the initiating agent “done,” or use **Local Pi** `/telegram-complete-setup`. This checks the existing creation update; do not repeatedly create new requests while waiting. Local confirmations are still required for transfer/webhook changes. Escape cancels the local step; `/telegram-cancel-managed-bot` cancels pending creation.

Pending creation belongs to its initiating project and persistent session. Resume that session to complete it; legacy recovery requires explicit local confirmation. A best-effort catalog records managed bot IDs/usernames/owners, not child tokens. Telegram provides no general list-managed-bots or arbitrary private username lookup. Recovery requires a known identity/numeric ID or credentials; never guess a bot ID or derived username.

## Private configuration locations

- Project bots/assignments and plaintext tokens: `<project>/.pi/pi-telegram.local.json`.
- Advanced manager settings: `~/.pi/agent/pi-telegram/settings.json` (overridable by `PI_TELEGRAM_SETTINGS`).

Use the UI rather than editing assignments. Writes reject tracked/symbolic credential paths and add local Git exclusions; permissions are not encryption or a Windows ACL guarantee. Protect backups and do not commit or share these files. Existing version-1 project settings migrate to version2 at the next mutation. There is no hosted provisioner, cloud registry or global cross-machine bot binding.
