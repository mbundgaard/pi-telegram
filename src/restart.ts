/**
 * Native restart admission, deliberately refusal-only.
 *
 * Herdr's supported agent.start surface cannot pin/attest the executable
 * resolved by the existing interactive shell. Inherited HERDR_* markers do
 * not prove pane/process identity. Do not arm a helper or request shutdown
 * until those launch guarantees can be established (see development-status).
 */
export const RESTART_UNSUPPORTED = "Restart is unavailable: this build cannot verify the updated Pi launcher in the existing herdr shell pane. No shutdown or restart was scheduled. Restart Pi locally with the exact saved session; /reload only reloads resources.";
export const RESTART_BUSY = "Restart refused while work is running or pending. Nothing was queued; try /restart again when idle.";

export function restartRefusal(state: {
  current: boolean;
  idle: boolean;
  pending: boolean | undefined;
  localPending: boolean;
  mode: string | undefined;
}, host: { platform: string; herdr: string | undefined } = { platform: process.platform, herdr: process.env.HERDR_ENV }): string {
  if (!state.current) return "Restart refused: this Telegram connection is no longer ready. Nothing was scheduled.";
  if (!state.idle || state.pending === true || state.localPending) return RESTART_BUSY;
  if (state.pending !== false) return "Restart unavailable: this Pi host cannot verify pending work. Nothing was scheduled.";
  if (host.platform !== "linux" || state.mode !== "tui" || host.herdr !== "1")
    return "Restart unavailable: only a verified Linux interactive Pi in an existing herdr shell pane could be supported. Nothing was scheduled.";
  // Necessary markers are not sufficient capability evidence. Never promote
  // them (or CLI version alone) into authorization to spawn or shut down.
  return RESTART_UNSUPPORTED;
}
