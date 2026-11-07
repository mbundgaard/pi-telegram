import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import lockfile from "proper-lockfile";

const modes = ["steeringMode", "followUpMode"] as const;
type Settings = Record<string, unknown>;

function readSettings(path: string): { settings: Settings; mode: number } {
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error("Unsafe settings file");
    const value: unknown = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid settings object");
    return { settings: value as Settings, mode: stat.mode & 0o777 };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { settings: {}, mode: 0o600 };
    throw error;
  }
}

/**
 * Narrow file edit, not a second message queue or a live AgentSession setter.
 * SettingsManager's public queue setters only write global settings and migrate
 * unrelated legacy fields; there is no public project queue-mode setter.
 * Use the host's proper-lockfile filename/options and read AFTER acquiring both
 * locks. No await occurs in the locked read/validate/write critical section.
 */
export function ensureQueueSettings(cwd: string, current: () => boolean, agentDir = getAgentDir()): "changed" | "unchanged" | "skipped" {
  if (!current()) return "skipped";
  const paths = [join(resolve(agentDir), "settings.json"), join(resolve(cwd), ".pi", "settings.json")];
  const releases: Array<() => void> = [];
  try {
    // Stable ordering also handles a custom agent directory equal to project .pi.
    for (const path of [...new Set(paths)].sort()) {
      mkdirSync(dirname(path), { recursive: true });
      releases.push(lockfile.lockSync(path, { realpath: false, retries: 0 }));
    }
    const global = readSettings(paths[0]!);
    const project = paths[0] === paths[1] ? global : readSettings(paths[1]!);
    const writes: Array<{ path: string; settings: Settings; mode: number }> = [];
    for (const [index, entry] of [global, project].entries()) {
      if (index === 1 && paths[0] === paths[1]) continue;
      const settings = { ...entry.settings };
      for (const key of modes) {
        // Set global defaults, and replace only existing project overrides.
        // Legacy queueMode is an effective steering override in Pi too.
        if (index === 0 || Object.hasOwn(settings, key) || (key === "steeringMode" && Object.hasOwn(settings, "queueMode"))) settings[key] = "all";
      }
      if (modes.some(key => settings[key] !== entry.settings[key])) writes.push({ path: paths[index]!, settings, mode: entry.mode });
    }
    if (!current()) return "skipped";
    for (const { path, settings, mode } of writes) {
      const temporary = `${path}.${randomUUID()}.tmp`;
      try {
        writeFileSync(temporary, `${JSON.stringify(settings, null, 2)}\n`, { flag: "wx", mode });
        renameSync(temporary, path);
      } finally {
        try { unlinkSync(temporary); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      }
    }
    return writes.length ? "changed" : "unchanged";
  } finally {
    for (const release of releases.reverse()) release();
  }
}

/** Persist defaults and notify the owner; applying them is an explicit user reload. */
export function configureQueueSettings(options: {
  cwd: string;
  current: () => boolean;
  notify: (message: string) => void;
  agentDir?: string;
}): void {
  try {
    const result = ensureQueueSettings(options.cwd, options.current, options.agentDir);
    if (result === "changed") options.notify("Pi Telegram set steeringMode and followUpMode to all. Send /reload when idle to apply these settings.");
  } catch {
    if (options.current()) options.notify("Pi Telegram could not finish updating steeringMode and followUpMode. Check Pi settings locally, set both to all, then send /reload when idle.");
  }
}
