import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, readFile, writeFile, chmod, stat, readdir, link, symlink, mkdir, open } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareSecretTarget, commitSecret } from "../src/secret-files.ts";

test("replacement preserves old bytes until commit, resets mode, and never mutates old inode", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "secret-replace-"));
  try {
    const t = await prepareSecretTarget(cwd, "dummy.txt");
    await writeFile(t.path, "DUMMY-old");
    await chmod(t.path, 0o644);
    await prepareSecretTarget(cwd, t.name);
    assert.equal(await readFile(t.path, "utf8"), "DUMMY-old");
    for (const text of ["", "x".repeat(16385)]) assert.throws(() => commitSecret(t, text, () => true), /Secret could not be saved/);
    let checks = 0;
    assert.throws(() => commitSecret(t, "DUMMY-cancel", () => ++checks < 2));
    assert.equal(await readFile(t.path, "utf8"), "DUMMY-old");
    assert.deepEqual((await readdir(t.directory)).sort(), [".gitignore", "dummy.txt"]);
    const old = await open(t.path, "r");
    try {
      commitSecret(t, "  DUMMY-new\n雪\r\n", () => true);
      assert.equal(await old.readFile("utf8"), "DUMMY-old");
    } finally { await old.close(); }
    assert.equal(await readFile(t.path, "utf8"), "  DUMMY-new\n雪\r\n");
    if (process.platform !== "win32") assert.equal((await stat(t.path)).mode & 0o777, 0o600);
    await link(t.path, join(cwd, "alias"));
    await assert.rejects(prepareSecretTarget(cwd, t.name));
    assert.throws(() => commitSecret(t, "DUMMY-refused", () => true));
    assert.equal(await readFile(join(cwd, "alias"), "utf8"), "  DUMMY-new\n雪\r\n");
    await rm(t.path);
    await symlink(join(cwd, "alias"), t.path);
    assert.throws(() => commitSecret(t, "DUMMY-refused", () => true));
    await rm(t.path); await mkdir(t.path);
    assert.throws(() => commitSecret(t, "DUMMY-refused", () => true));
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
