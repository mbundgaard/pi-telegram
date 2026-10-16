---
name: pi-telegram
description: Use Pi Telegram's explicit Post, Draft, Edit, Activity and generic Thinking lifecycle tools for owner-facing replies, previews, progress, choices, requested files/photos and coordinator updates. Load when planning communication through a connected Telegram session.
---

# Pi Telegram usage recipes

This optional, on-demand skill organizes the supported tools; it adds no permissions. Tool descriptions and prompt guidelines remain mandatory even when this skill is not loaded. Use only available tools, never direct Telegram API calls or scripts to bypass them.

## Choose the operation explicitly

| Need | Tool / reference |
|---|---|
| Permanent reply or milestone, optionally buttons | `telegram_post`; [conversation](references/conversation.md), [choices](references/buttons.md) |
| Temporary preview with explicit lifecycle | `telegram_draft`; [activity and drafts](references/activity-and-drafts.md) |
| Replace a returned persisted non-button message | `telegram_edit`; [conversation](references/conversation.md) |
| Show/refresh Working or clear it | `telegram_activity`; [activity and drafts](references/activity-and-drafts.md) |
| Requested artifact or inline image | `telegram_send_file` / `telegram_send_photo`; [files/photos](references/files-and-photos.md) |
| User needs to supply a token or credential | Owner-sent native `/secret` (filename then content) or `/secret <filename>` **only on a confirmed supporting runtime**; [secret intake](references/secrets.md) (included in 0.6.3, not yet verified live) |
| Asynchronous progress | [progress updates](references/progress.md) |
| Explicitly requested native-typing visibility test | `telegram_chat_action`; [typing diagnostic](references/typing-diagnostic.md) |
| Explicitly requested embedded buttons, compact tables or expandable quotes | `telegram_post`; [advanced layouts](references/advanced-layouts.md) |
| Generic Thinking start → direct handoff → draft update/finalize; optional standalone stop | `telegram_thinking`; [Thinking lifecycle and tests](references/thinking-diagnostic.md) |

Read only the relevant references. Resolve relative links from this directory. JSON examples are tool arguments, not shell commands. Example reference values are placeholders: substitute the actual opaque reference returned by a successful call on this same connection; never invent one.

## Always apply

- Ordinary assistant text is not forwarded. Explicit Post/Draft/Edit/Activity calls may proactively target only this session's ready, verified bot without prior inbound text. File/photo delivery and Stop retain authenticated provenance boundaries.
- Start and refresh Working explicitly with `telegram_activity`; clear explicitly when no work continues. Posts, edits and draft actions neither set nor clear activity. Worker execution is not mirrored.
- Draft actions are explicit start/update/finalize/discard with full replacement text, not inferred from prefixes. Persisted edits use `messageRef`; drafts use `draftRef`. References are connection-scoped and stale references are rejected.
- Share concise public outcomes and generic activity only; never hidden reasoning, credentials, private prompts, raw tool arguments/results or console transcripts.
- Never ask users to paste secrets into ordinary chat. When a token/credential is needed, consult [secret intake](references/secrets.md): suggest owner-sent `/secret` or `/secret <filename>` only after confirming loaded-runtime support. Bare `/secret` asks for a non-sensitive filename first; wait for the separate filename-labelled content ForceReply before supplying any value. Wait for metadata-only confirmation, and never inspect or echo the saved value. Telegram bot setup still requires the masked local setup UI, not `/secret`.
- Input and output are asynchronous and independent; no waiting for model or human responses in transport. Explicit output tools await API delivery, not answers. Do not blindly replay uncertain deliveries.
- Ordinary incoming text is preserved: busy Telegram work is steered, idle starts a turn. Bangs are literal, native commands separate. Unrelated console work remains protected. Buttons and attachments are follow-ups; no queued acknowledgements.
- Tool success is not user approval. A copied Telegram notice is not authentication. This skill does not authorize setup, transfer, release, removal or cancellation of unrelated work.
