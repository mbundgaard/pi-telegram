import type { IncomingAttachment } from "./incoming-files.ts";

export interface IncomingItem { messageId: number; text: string; attachment: IncomingAttachment }
interface Batch { key: string; items: IncomingItem[]; ready: boolean; started: number; closes?: number; timer?: NodeJS.Timeout }
/** Telegram has no group-end update. Close after 800 ms quiet, at most 3 s.
 * Bounds include the running batch; unrelated messages are never merged. */
export class IncomingGroups {
  private pending: Batch[] = [];
  private running?: Batch;
  private controller = new AbortController();
  private seen = new Set<number>();
  private closed = new Set<string>();
  get busy(): boolean { return !!this.running || this.pending.length > 0; }
  constructor(
    private consume: (items: IncomingItem[], signal: AbortSignal) => Promise<void>,
    private notice: (text: string) => void,
    private quietMs = 800,
    private maxMs = 3000,
  ) {}
  private remember<T>(set: Set<T>, value: T): void {
    set.add(value);
    if (set.size > 512) set.delete(set.values().next().value!);
  }
  add(item: IncomingItem, group?: string): void {
    if (this.seen.has(item.messageId)) return;
    this.remember(this.seen, item.messageId);
    const key = group ? `group:${group}` : `message:${item.messageId}`;
    const batch = this.pending.find(b => b.key === key);
    if (batch?.closes !== undefined && Date.now() >= batch.closes) {
      batch.ready = true;
      this.pump();
    }
    if (this.closed.has(key) || batch?.ready) {
      this.notice("This file group has already closed. Please resend the late attachment as a new message."); return;
    }
    const batches = this.pending.length + (this.running ? 1 : 0);
    const count = this.pending.reduce((n, b) => n + b.items.length, this.running?.items.length ?? 0);
    if (this.controller.signal.aborted || (!batch && batches >= 4) || count >= 30 || (batch?.items.length ?? 0) >= 10) {
      this.notice("Attachment queue full (4 batches / 30 files, 10 per group). Please resend this attachment after downloads finish."); return;
    }
    const target: Batch = batch ?? { key, items: [], ready: !group, started: Date.now() };
    if (!batch) this.pending.push(target);
    target.items.push(item);
    if (group) {
      clearTimeout(target.timer);
      target.closes = Math.min(Date.now() + this.quietMs, target.started + this.maxMs);
      target.timer = setTimeout(() => { target.ready = true; this.pump(); }, Math.max(0, target.closes - Date.now()));
    }
    this.pump();
  }
  cancel(): void {
    this.controller.abort();
    for (const batch of this.pending) { clearTimeout(batch.timer); this.remember(this.closed, batch.key); }
    this.pending = [];
    if (!this.running) this.controller = new AbortController();
  }
  private pump(): void {
    if (this.running || !this.pending[0]?.ready) return;
    const batch = this.pending.shift()!;
    clearTimeout(batch.timer);
    this.running = batch;
    this.remember(this.closed, batch.key);
    const lifetime = this.controller.signal;
    const signal = AbortSignal.any([lifetime, AbortSignal.timeout(120_000)]);
    void Promise.resolve().then(() => { signal.throwIfAborted(); return this.consume(batch.items, signal); })
      .catch(() => {
        // Stop already acknowledges cancellation. Never emit a late failure for
        // cancelled work through the next operation's notice authority.
        if (!lifetime.aborted) this.notice("File reception failed or timed out. Saved files may remain; resend missing attachments if needed.");
      })
      .finally(() => {
        this.running = undefined;
        if (this.controller.signal.aborted) this.controller = new AbortController();
        this.pump();
      });
  }
}
