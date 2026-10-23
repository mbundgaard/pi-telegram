import { randomBytes } from "node:crypto";
import { commitSecret, prepareSecretTarget, SECRET_LIMIT, validSecretName, type SecretTarget } from "./secret-files.ts";

export const SECRET_TTL = 5 * 60_000;
interface Message {
  message_id: number; text?: string; chat: { id: number; type: string };
  from?: { id: number; is_bot: boolean }; forward_origin?: unknown; reply_to_message?: Message;
}
export interface SecretOptions { cwd: string; verify(): Promise<boolean>; current(): boolean }
interface IO {
  request(method: string, body: Record<string, unknown>, signal: AbortSignal): Promise<{ message_id: number }>;
  background(work: Promise<void>): void; notice(text: string): void; signal: AbortSignal;
}
interface Flow { expires: number; timer: NodeJS.Timeout; target?: SecretTarget; promptId?: number; stage: "filename" | "content"; phase: "preparing" | "prompting" | "awaiting" | "saving"; controller: AbortController }
const filenamePrompt = "Choose a secret filename. Reply to this message with a simple ASCII basename, not secret contents, or /cancel.\nThen wait for a separate filename-labelled content prompt. The whole intake expires 5 minutes after starting.";
const filenamePattern = /^Choose a secret filename\. Reply to this message with a simple ASCII basename, not secret contents, or \/cancel\.\nThen wait for a separate filename-labelled content prompt\. The whole intake expires 5 minutes after starting\.\n\[Pi Telegram secret filename prompt: [a-f0-9]{24}\]$/;
const invalidName = "Invalid secret filename. Reply to the filename prompt with 1–64 ASCII letters, digits, dots, underscores or hyphens, starting with a letter or digit; no paths or reserved names.";
const marker = /\n\[Pi Telegram secret prompt: [a-f0-9]{24}\]$/;
const promptPattern = /^Ready to save [A-Za-z0-9][A-Za-z0-9_.-]{0,63}\. Reply to this message with the exact text to save, or \/cancel\.\nTelegram bots are not end-to-end encrypted\. Stored as plaintext; deletion is best effort\. (?:Expires in 5 minutes|Expires 5 minutes after intake started)\.\n\[Pi Telegram secret prompt: [a-f0-9]{24}\]$/;
/** Secret data is never passed to agent input, notices, previews or error details. */
export class SecretFlow {
  private flow?: Flow;
  private known = new Set<number>();
  constructor(private owner: number, private botId: number | undefined, private options: SecretOptions | undefined, private io: IO) {}
  get active(): boolean { return !!this.flow; }
  private live(f: Flow): boolean { return this.flow === f && Date.now() < f.expires && !f.controller.signal.aborted && !this.io.signal.aborted && !!this.options?.current(); }
  cancel(notify = true): void {
    const f = this.flow; if (!f) return;
    this.flow = undefined; clearTimeout(f.timer); f.controller.abort();
    if (notify) this.io.notice("Secret intake cancelled. No further data will be saved. Remove any sensitive messages manually.");
  }
  private recognized(reply?: Message): boolean {
    return !!reply && !reply.forward_origin && reply.chat.id === this.owner && reply.chat.type === "private" && reply.from?.id === this.botId && reply.from?.is_bot === true &&
      (this.known.has(reply.message_id) || (marker.test(reply.text ?? "") && promptPattern.test(reply.text ?? "")) || filenamePattern.test(reply.text ?? ""));
  }
  start(name: string | undefined, blocked: false | "download" | "feedback" | "question"): void {
    if (this.flow) { this.io.notice("Secret intake is already active. Reply to its prompt or use /cancel."); return; }
    if (name !== undefined && !validSecretName(name)) { this.io.notice("Invalid secret filename. Use /secret to choose a simple ASCII basename; never include secret contents in the command."); return; }
    if (!this.options || !this.options.current() || !this.botId) { this.io.notice("Secret intake is unavailable because this connection is not ready. Check /ping and the local Pi connection status; do not send secret contents."); return; }
    if (blocked) {
      const reason = {
        download: "a file download is active. Wait for it to finish, then retry /secret.",
        feedback: "feedback is active. Finish it or use /cancel, then retry /secret.",
        question: "an agent question is awaiting an answer. Answer it with its buttons or ordinary non-sensitive text, or wait for it to expire, then retry /secret. /cancel does not dismiss agent questions.",
      }[blocked];
      this.io.notice(`Secret intake is unavailable because ${reason}`); return;
    }
    const f: Flow = { expires: Date.now() + SECRET_TTL, timer: undefined!, controller: new AbortController(), stage: name === undefined ? "filename" : "content", phase: "preparing" };
    this.flow = f;
    f.timer = setTimeout(() => { if (this.flow === f) this.cancel(); }, SECRET_TTL); f.timer.unref?.();
    this.io.background((async () => {
      try {
        if (!await this.options!.verify() || !this.live(f)) throw new Error();
        if (name !== undefined) f.target = await prepareSecretTarget(this.options!.cwd, name);
        await this.prompt(f);
      } catch { if (this.flow === f) { this.cancel(false); this.io.notice("Secret prompt could not be prepared or confirmed. Destination may exist or require local safety repair. Nothing was saved; no automatic retry."); } }
    })());
  }
  private async prompt(f: Flow): Promise<void> {
    if (!this.live(f)) return;
    f.phase = "prompting";
    const nonce = randomBytes(12).toString("hex");
    const sent = await this.io.request("sendMessage", { chat_id: this.owner,
      text: f.stage === "filename" ? `${filenamePrompt}\n[Pi Telegram secret filename prompt: ${nonce}]` :
        `Ready to save ${f.target!.name}. Reply to this message with the exact text to save, or /cancel.\nTelegram bots are not end-to-end encrypted. Stored as plaintext; deletion is best effort. Expires 5 minutes after intake started.\n[Pi Telegram secret prompt: ${nonce}]`,
      reply_markup: { force_reply: true, input_field_placeholder: f.stage === "filename" ? "Filename only, or /cancel" : "Exact text, or /cancel" },
    }, AbortSignal.any([this.io.signal, f.controller.signal, AbortSignal.timeout(10_000)]));
    if (!Number.isSafeInteger(sent.message_id) || sent.message_id <= 0) throw new Error();
    this.known.add(sent.message_id);
    if (this.known.size > 1000) this.known.delete(this.known.values().next().value!);
    if (this.live(f)) { f.promptId = sent.message_id; f.phase = "awaiting"; }
  }
  private acceptFilename(f: Flow, name: string): void {
    // Fence synchronously: duplicate filename replies cannot start a second preflight/prompt.
    f.phase = "preparing";
    this.io.background((async () => {
      try {
        if (!await this.options!.verify() || !this.live(f)) throw new Error();
        try { f.target = await prepareSecretTarget(this.options!.cwd, name); }
        catch {
          if (this.live(f)) {
            f.phase = "awaiting";
            this.io.notice("Destination unavailable or already exists. Nothing was saved. Reply to the filename prompt with another basename, or /cancel for local safety repair.");
          }
          return;
        }
        if (!this.live(f)) return;
        f.stage = "content";
        await this.prompt(f);
      } catch {
        if (this.flow === f) { this.cancel(false); this.io.notice("Secret prompt could not be prepared or confirmed. Nothing was saved; no automatic retry."); }
      }
    })());
  }
  /** Called before feedback, attachments and commands. Stop and cancel are reserved even in exact replies. */
  reply(message: Message, saved: (path: string, size: number) => void, edited = false): boolean {
    if (message.chat.id !== this.owner || message.chat.type !== "private" || message.from?.id !== this.owner || message.from.is_bot) return false;
    const recognized = this.recognized(message.reply_to_message);
    const f = this.flow;
    if (!f && !recognized) return false;
    if (edited || !recognized || !f || !this.live(f) || f.phase !== "awaiting" || message.reply_to_message?.message_id !== f.promptId || message.forward_origin) {
      this.io.notice("Secret data was not accepted. Reply directly to the current secret prompt with text only, or use /cancel. Expired prompts cannot be reused."); return true;
    }
    const text = message.text;
    if (f.stage === "filename") {
      if (typeof text !== "string" || !validSecretName(text)) this.io.notice(invalidName);
      else this.acceptFilename(f, text);
      return true;
    }
    if (typeof text !== "string" || !text.length || Buffer.byteLength(text, "utf8") > SECRET_LIMIT) {
      this.io.notice("Secret data must be nonempty text, at most 16384 UTF-8 bytes. Whitespace is preserved. Nothing was saved."); return true;
    }
    f.phase = "saving";
    this.io.background((async () => {
      let result: { path: string; size: number };
      try {
        const target = await prepareSecretTarget(this.options!.cwd, f.target!.name, f.target!.root);
        if (!await this.options!.verify() || !this.live(f)) throw new Error();
        result = commitSecret(target, text, () => this.live(f));
      } catch { if (this.flow === f) { this.cancel(false); this.io.notice("Secret was not saved. Destination may exist or require local safety repair. Remove sensitive chat messages manually; no automatic retry."); } return; }
      // Commit is complete. Retain saving fence during bounded deletion; duplicates cannot write again.
      let deleted = true;
      for (const id of [message.message_id, f.promptId!]) {
        if (!this.live(f)) { deleted = false; break; }
        try { await this.io.request("deleteMessage", { chat_id: this.owner, message_id: id }, AbortSignal.any([this.io.signal, f.controller.signal, AbortSignal.timeout(5000)])); }
        catch { deleted = false; }
      }
      if (!this.live(f)) return;
      try {
        if (!await this.options!.verify() || !this.live(f)) { if (this.flow === f) this.cancel(false); return; }
      } catch { if (this.flow === f) this.cancel(false); return; }
      this.cancel(false);
      this.io.notice(`Saved ${f.target!.name} — ${result.size} bytes${deleted ? "" : ". Telegram deletion could not be confirmed. Remove the secret reply and prompt manually."}`);
      saved(result.path, result.size);
    })());
    return true;
  }
}
