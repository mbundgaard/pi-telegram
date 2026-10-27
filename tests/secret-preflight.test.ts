import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, rm, writeFile, chmod, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { prepareSecretTarget, SecretPreflightError } from "../src/secret-files.ts";
import { SecretFlow } from "../src/secret.ts";

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, stdio: "pipe" });
test("preflight accepts ordinary, ignored-parent, exclude, nested and canonical ancestor projects", async () => {
  for (const mode of ["plain", "git", "ignored-parent", "exclude", "nested", "ancestor-alias"]) {
    const root = await mkdtemp(join(tmpdir(), "secret-preflight-"));
    try {
      if (mode !== "plain") git(root, "init", "-q");
      let cwd = root;
      if (mode === "ignored-parent") await writeFile(join(root, ".gitignore"), ".pi/\n");
      if (mode === "exclude") await writeFile(join(root, ".git/info/exclude"), ".pi/\n");
      if (mode === "nested") { cwd = join(root, "nested"); await mkdir(cwd); }
      if (mode === "ancestor-alias") {
        await mkdir(join(root, "actual")); await symlink(join(root, "actual"), join(root, "alias")); cwd = join(root, "alias");
      }
      await mkdir(join(cwd, ".pi"), { mode: 0o755 });
      const a = await prepareSecretTarget(cwd, "first.txt");
      await writeFile(a.path, "DUMMY", { mode: 0o600 });
      await prepareSecretTarget(cwd, "second.txt");
      await assert.rejects(prepareSecretTarget(cwd, "first.txt"), (e: unknown) => e instanceof SecretPreflightError && e.code === "exists" && !e.message.includes(root));
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});

test("deterministic storage failures expose only typed categories, preserving safety gates", async () => {
  for (const mode of ["permissions", "ignore", "tracked", "storage"] as const) {
    const cwd = await mkdtemp(join(tmpdir(), "secret-preflight-"));
    try {
      git(cwd, "init", "-q");
      const t = await prepareSecretTarget(cwd, "dummy.txt");
      if (mode === "permissions") {
        if (process.platform === "win32") continue;
        await chmod(t.directory, 0o755);
      }
      if (mode === "ignore") await writeFile(join(t.directory, ".gitignore"), "DUMMY-unexpected-not-for-output");
      if (mode === "tracked") git(cwd, "add", "-f", ".pi/telegram-secrets/.gitignore");
      if (mode === "storage") { await rm(t.directory, { recursive: true }); await symlink(cwd, t.directory); }
      await assert.rejects(prepareSecretTarget(cwd, "dummy.txt"), (e: unknown) => e instanceof SecretPreflightError && e.code === mode && !e.message.includes(cwd) && !e.message.includes("DUMMY"));
    } finally { await rm(cwd, { recursive: true, force: true }); }
  }
});

test("bare preflight does not touch destination; verification errors cannot expose raw details", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "secret-preflight-"));
  try {
    await writeFile(join(cwd, ".pi"), "DUMMY-invalid-parent");
    for (const name of [undefined, "dummy.txt"]) {
      for (const verified of [true, false, "throw"]) {
        const notices: string[] = [], requests: any[] = [], jobs: Promise<void>[] = [];
        const flow = new SecretFlow(42, 777, { cwd, current: () => true, verify: async () => {
          if (verified === "throw") throw new Error("DUMMY-private-config-details");
          return verified === true;
        } }, { notice: text => notices.push(text), background: work => jobs.push(work), signal: new AbortController().signal,
          request: async (_method, body) => { requests.push(body); return { message_id: 10 }; } });
        flow.start(name, false); await Promise.all(jobs);
        if (verified !== true) assert.match(notices[0]!, /connection\/assignment verification/);
        else if (name === undefined) assert.equal(requests.length, 1, "bare command has no destination check before filename prompt");
        else assert.match(notices[0]!, /storage path is unavailable or unsafe/);
        assert.ok(!JSON.stringify(notices).includes("DUMMY"));
        assert.ok(!JSON.stringify(notices).includes(cwd));
        flow.cancel(false);
      }
    }
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
