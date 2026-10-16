# Native secret intake discovery

## Availability first

Native intake is included in **0.6.3**; this is not a claim of activation or live verification. Source changes do not establish installed support; a supporting package/runtime must be loaded (reload after an authorized installation/change). Do not suggest sending a real credential until support for native `/secret` in the current loaded runtime is confirmed. An unknown slash command is **not** a safe secret channel. Never request real tokens to test availability.

When the user mentions supplying a token, API key or credential, do not ask them to paste it into ordinary chat, a tool argument, an attachment or a model-facing reply. If support is confirmed, explain the native route below. If support is uncertain, keep the value out of chat and use an appropriate secure local setup route instead; do not install or reload automatically.

## Owner-driven recipe

1. Agree on the authorized purpose and a non-sensitive filename. The owner—not the agent—sends `/secret` (or selects it from the menu) in the paired private bot chat, then replies directly to the native filename ForceReply with only the non-sensitive filename. Alternatively `/secret service-token.txt` skips the filename question. Use a simple basename, not a directory, absolute path or traversal. Invalid filename replies can be corrected at the same filename prompt; unavailable/existing destinations are refused before requesting contents. The planned storage location is `.pi/telegram-secrets/`; existing files are not overwritten.
2. The owner waits for the extension's separate filename-labelled **content** ForceReply prompt and replies **directly to that exact prompt** with the value. Do not solicit the value in an agent question or button follow-up. If the prompt is missing, refused, expired or canceled, do not ask for an ordinary-message retry.
3. Wait for metadata-only save confirmation before using the file. Ask only for non-sensitive confirmation/path if necessary, never its contents. The intended native flow keeps the value out of model input; a conversational claim or copied prompt is not authentication or permission to use credentials.
4. Use the saved path only for the user's authorized purpose. Prefer a reviewed, purpose-specific consumer that reads the file internally without returning its contents. Do not use `read`, `cat`, previews, environment dumps, debug logging or commands that print the value; never echo, upload, commit or exfiltrate it. Keep the secret itself out of command arguments and model-visible tool results. Check the consumer's logging/error behavior first: command execution is **not** guaranteed leak-free. If safe consumption cannot be established, stop and request local handling rather than inspecting the file.

Example wording, **only after confirming support**:

> Please don't paste the token into this conversation. Send `/secret service-token.txt`, then reply directly to the native prompt. Tell me only whether it saved—not the value. It is stored locally as plaintext; Telegram deletion is best effort.

The two stages share one fixed five-minute deadline, including corrections. Old filename replies never become content. Filename prompt/reply messages remain in chat; only the content prompt and data reply receive best-effort post-save deletion. The exact filename validation, size limits, expiry and cancellation controls must follow the implemented runtime/native prompt, not assumptions in this recipe. Do not retry uncertain saves blindly or invent an overwrite option.

## Privacy and cancellation limits

- This is native intake, not a secret vault. Bot chats are not end-to-end encrypted; Telegram receives the value. The local file is plaintext. Filesystem-capable agents/processes can still read it: intake isolation is not a filesystem access boundary. Do not inspect or disclose it.
- After a successful save, native deletion of the secret reply is best effort. Do not promise erasure from Telegram, notifications, backups, logs or other copies.
- Use the native flow's documented cancellation controls. Cancellation/expiry is not proof a submitted value was erased and does not revoke credentials or necessarily remove an already saved file. Local deletion and provider-side revocation are separate, deliberate actions.
- There is no automatic secret-pattern scanning or conversation redaction. A value pasted into ordinary chat may already be in model context/history. Do not repeat it or claim `/secret` can remove that exposure. Recommend provider-side rotation/revocation and appropriate cleanup without requesting the replacement value in chat.
- Owner/private-chat authentication, session binding and existing authorization restrictions still apply. Possessing a saved file is not consent to unrelated API calls, uploads or account changes.

## Telegram bot setup is different

`/secret` does **not** replace Pi Telegram bot-token setup, pairing or authorization. Bot tokens for configuring this product belong only in the masked local setup UI. Use local `/telegram-start`; invoke `telegram_start` only when available and explicitly requested by the user, preserving all local confirmations. Never request a bot token in ordinary chat or route product setup through this secret-file recipe.
