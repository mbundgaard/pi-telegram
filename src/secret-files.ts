import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { constants, lstatSync, realpathSync, openSync, closeSync, writeFileSync, fsyncSync, linkSync, unlinkSync, fstatSync } from "node:fs";
import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const SECRET_DIRECTORY = ".pi/telegram-secrets";
export const SECRET_LIMIT = 16_384;
const exec = promisify(execFile);
const ignoreText = "*\n";
export function validSecretName(name: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(name) && !name.endsWith(".") && !name.includes("..") &&
    !/^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name) && !/^(?:config|git|\.git)(?:\.|$)/i.test(name);
}
const preflightMessages = {
  target: "Secret destination is invalid. Choose a simple basename or request local storage-path repair.",
  storage: "Secret storage path is unavailable or unsafe. Request local directory/symlink/access repair; changing the filename will not repair storage.",
  permissions: "Secret storage directory permissions are not private. Request local permission repair; no permissions were changed automatically.",
  ignore: "Secret storage ignore file is unsafe or has unexpected contents. Request local ignore-file repair.",
  exists: "Secret destination already exists. Choose another filename; existing files are never overwritten.",
  git: "Secret storage Git safety verification could not complete. Request local Git availability/access repair.",
  tracked: "Secret storage contains Git-tracked entries. Request local tracking repair before retrying.",
  unignored: "Secret destination or temporary files are not Git-ignored. Request local ignore-rule repair.",
} as const;
export type SecretPreflightCode = keyof typeof preflightMessages;
/** Fixed allowlisted metadata only; never retains native errors, paths or Git output. */
export class SecretPreflightError extends Error {
  constructor(readonly code: SecretPreflightCode) { super(preflightMessages[code]); this.name = "SecretPreflightError"; }
}
async function directory(path: string, privateMode: boolean): Promise<void> {
  try { await mkdir(path, { mode: 0o700 }); } catch (e) { if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e; }
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new SecretPreflightError("storage");
  if (privateMode && process.platform !== "win32" && (info.mode & 0o077)) throw new SecretPreflightError("permissions");
}
export interface SecretTarget { root: string; directory: string; name: string; path: string }
/** No content is accepted during preflight; only allowlisted failure categories escape. */
export async function prepareSecretTarget(cwd: string, name: string, expectedRoot?: string): Promise<SecretTarget> {
  let stage: SecretPreflightCode = "target";
  try {
    if (!validSecretName(name)) throw new Error();
    const root = await realpath(cwd);
    if (expectedRoot && root !== expectedRoot) throw new Error();
    stage = "storage";
    await directory(join(root, ".pi"), false);
    const dir = join(root, SECRET_DIRECTORY);
    await directory(dir, true);
    if (await realpath(dir) !== dir) throw new Error();
    stage = "ignore";
    const ignore = join(dir, ".gitignore");
    try { await writeFile(ignore, ignoreText, { flag: "wx", mode: 0o600 }); } catch (e) { if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e; }
    const info = await lstat(ignore);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || await readFile(ignore, "utf8") !== ignoreText) throw new Error();
    stage = "storage";
    const path = join(dir, name);
    try { await lstat(path); throw new SecretPreflightError("exists"); } catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
    stage = "git";
    const options = { cwd: root, windowsHide: true, timeout: 5000 };
    let git = true;
    try { await exec("git", ["rev-parse", "--show-toplevel"], options); } catch (e) {
      if (/not a git repository/i.test(String((e as { stderr?: string }).stderr))) git = false; else throw e;
    }
    if (git) {
      const tracked = await exec("git", ["ls-files", "--", SECRET_DIRECTORY], options);
      if (tracked.stdout.trim()) throw new SecretPreflightError("tracked");
      for (const candidate of [path, join(dir, ".secret-probe.tmp")]) {
        try { await exec("git", ["check-ignore", "-q", "--", candidate], options); }
        catch (e) {
          if ((e as { code?: unknown }).code === 1) throw new SecretPreflightError("unignored");
          throw e;
        }
      }
    }
    return { root, directory: dir, name, path };
  } catch (e) { throw e instanceof SecretPreflightError ? e : new SecretPreflightError(stage); }
}
/** Bounded synchronous commit prevents JS Stop/expiry from interleaving after the final guard.
 * Atomic hard-link publication never overwrites; temporary file is owned by this call only.
 * Like other project storage, this is not isolation against a hostile local filesystem writer.
 */
export function commitSecret(target: SecretTarget, text: string, current: () => boolean): { path: string; size: number } {
  let temporary: string | undefined;
  let fd: number | undefined;
  try {
    const size = Buffer.byteLength(text, "utf8");
    if (!text.length || size > SECRET_LIMIT || !current() || realpathSync(target.root) !== target.root) throw new Error();
    for (const path of [join(target.root, ".pi"), target.directory]) {
      const info = lstatSync(path);
      if (!info.isDirectory() || info.isSymbolicLink() || realpathSync(path) !== path) throw new Error();
    }
    if (process.platform !== "win32" && (lstatSync(target.directory).mode & 0o077)) throw new Error();
    const temp = join(target.directory, `.secret-${randomUUID()}.tmp`);
    fd = openSync(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600);
    temporary = temp;
    if (fstatSync(fd).nlink !== 1) throw new Error();
    writeFileSync(fd, text, "utf8"); fsyncSync(fd); closeSync(fd); fd = undefined;
    if (!current()) throw new Error();
    linkSync(temp, target.path);
    return { path: `${SECRET_DIRECTORY}/${target.name}`, size };
  } catch { throw new Error("Secret could not be saved. No automatic retry was made."); }
  finally {
    if (fd !== undefined) try { closeSync(fd); } catch { /* generic failure only */ }
    if (temporary) try { unlinkSync(temporary); } catch { /* Ignored protected temporary may need local cleanup. */ }
  }
}
