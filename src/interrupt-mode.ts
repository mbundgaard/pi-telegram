/** Session-local opt-in; pending text stays out of Pi until cancellation settles. */
export class InterruptMode<T> {
  enabled = false;
  pending?: { target: T; texts: string[]; started: boolean; cancellation: AbortController };

  configure(argument?: string): string {
    if (argument === undefined) return `Interrupt mode is ${this.enabled ? "on" : "off"}. Use /interrupt on or /interrupt off.`;
    const value = argument.trim().toLowerCase();
    if (value !== "on" && value !== "off") return "Use /interrupt on, /interrupt off, or /interrupt to check.";
    if (value === "off") this.clear();
    this.enabled = value === "on";
    return this.enabled
      ? "Interrupt mode is on for this connection. Ordinary text interrupts this bot's active work; completed actions are not undone. /steer still steers. Resets to off on reconnect/reload."
      : "Interrupt mode is off. Any waiting replacement was discarded; an already requested cancellation cannot be undone.";
  }

  add(target: T, text: string): "start" | "added" | "full" {
    const pending = this.pending;
    if (pending && (pending.target !== target || pending.texts.length >= 8 || pending.texts.reduce((n, t) => n + t.length, 0) + text.length > 32768)) return "full";
    if (pending) { pending.texts.push(text); return "added"; }
    this.pending = { target, texts: [text], started: false, cancellation: new AbortController() };
    return "start";
  }

  clear(): void {
    this.pending?.cancellation.abort();
    this.pending = undefined;
  }
  reset(): void { this.clear(); this.enabled = false; }
}
