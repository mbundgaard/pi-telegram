import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { TelegramSessionConnection } from "./telegram.ts";

/** Extension hooks only, not AgentSession SDK events. Never retain event contents. */
export function registerCompactionNotices(
  pi: ExtensionAPI,
  target: (ctx: ExtensionContext) => TelegramSessionConnection | undefined,
  verify: (connection: TelegramSessionConnection, ctx: ExtensionContext) => Promise<boolean>,
): { reset(): void } {
  type Attempt = { connection: TelegramSessionConnection; manager: object; session: string; epoch: number };
  let pending: Attempt | undefined;
  let epoch = 0;
  const seen = new WeakSet<AbortSignal>();
  const reset = () => { pending = undefined; epoch++; };
  const matches = (attempt: Attempt, ctx: ExtensionContext) =>
    attempt.epoch === epoch && attempt.manager === ctx.sessionManager &&
    attempt.session === ctx.sessionManager.getSessionId() && target(ctx) === attempt.connection;
  const notice = (attempt: Attempt, ctx: ExtensionContext, text: string) => {
    // Queue admission is synchronous; bounded, supervised transport does not hold up compaction.
    // Revalidate both before and after asynchronous assignment verification at execution time.
    attempt.connection.sendGuardedControlNotice(text, async () =>
      matches(attempt, ctx) && await verify(attempt.connection, ctx) && matches(attempt, ctx));
  };
  pi.on("session_before_compact", (event, ctx) => {
    if (seen.has(event.signal)) return;
    seen.add(event.signal);
    pending = undefined;
    const connection = target(ctx);
    if (!connection) return;
    pending = { connection, manager: ctx.sessionManager, session: ctx.sessionManager.getSessionId(), epoch };
    notice(pending, ctx, "Context compaction starting. Pi may pause while it summarizes older context.");
  });
  const finish = (ctx: ExtensionContext, text: string) => {
    const attempt = pending;
    if (!attempt || !matches(attempt, ctx)) return;
    pending = undefined; // Consume before scheduling, including failed/uncertain delivery. No replay.
    notice(attempt, ctx, text);
  };
  pi.on("session_compact", (_event, ctx) => finish(ctx, "Context compaction completed."));
  pi.on("session_compact_failed", (event, ctx) =>
    finish(ctx, event.aborted ? "Context compaction cancelled." : "Context compaction failed."));
  pi.on("session_start", reset);
  pi.on("session_shutdown", reset);
  return { reset };
}
