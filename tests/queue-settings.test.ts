import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import lockfile from "proper-lockfile";
import { configureQueueSettings, ensureQueueSettings } from "../src/queue-settings.ts";

function fixture(work: (cwd: string, agent: string, global: string, project: string) => void) {
  const root = mkdtempSync(join(tmpdir(), "telegram-queue-settings-"));
  const cwd = join(root, "project"), agent = join(root, "agent");
  mkdirSync(join(cwd, ".pi"), { recursive: true }); mkdirSync(agent);
  try { work(cwd, agent, join(agent, "settings.json"), join(cwd, ".pi", "settings.json")); }
  finally { rmSync(root, { recursive: true, force: true }); }
}
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

test("queue defaults are saved in the resolved agent directory, not Telegram settings", () => fixture((cwd, agent, global, project) => {
  const previous = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = agent;
  try {
    writeFileSync(global, JSON.stringify({ theme: "custom", retry: { maxRetries: 2 }, extensions: ["x"] }));
    writeFileSync(project, '{ "custom": 42 }');
    assert.equal(ensureQueueSettings(cwd, () => true), "changed");
    assert.deepEqual(read(global), { theme: "custom", retry: { maxRetries: 2 }, extensions: ["x"], steeringMode: "all", followUpMode: "all" });
    assert.equal(readFileSync(project, "utf8"), '{ "custom": 42 }');
  } finally {
    if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR; else process.env.PI_CODING_AGENT_DIR = previous;
  }
}));

test("existing project overrides and legacy steering override become all without migrating other fields", () => fixture((cwd, agent, global, project) => {
  writeFileSync(global, JSON.stringify({ queueMode: "one-at-a-time", websockets: true }));
  writeFileSync(project, JSON.stringify({ queueMode: "one-at-a-time", followUpMode: "one-at-a-time", theme: "local" }));
  assert.equal(ensureQueueSettings(cwd, () => true, agent), "changed");
  assert.deepEqual(read(global), { queueMode: "one-at-a-time", websockets: true, steeringMode: "all", followUpMode: "all" });
  assert.deepEqual(read(project), { queueMode: "one-at-a-time", followUpMode: "all", theme: "local", steeringMode: "all" });
}));

test("already correct settings keep exact bytes, no notice or reload request, across repeated startups", () => fixture((cwd, agent, global) => {
  const content = '{"steeringMode":"all", "followUpMode":"all"}';
  writeFileSync(global, content);
  const notices: string[] = [];
  for (let i = 0; i < 3; i++) configureQueueSettings({ cwd, agentDir: agent, current: () => true, notify: message => notices.push(message) });
  assert.equal(readFileSync(global, "utf8"), content); assert.deepEqual(notices, []);
}));

test("changed settings notify once; activation is explicitly manual, not fake reload input", () => fixture((cwd, agent) => {
  const notices: string[] = [];
  for (let i = 0; i < 2; i++) configureQueueSettings({ cwd, agentDir: agent, current: () => true, notify: message => notices.push(message) });
  assert.deepEqual(notices, ["Pi Telegram set steeringMode and followUpMode to all. Send /reload when idle to apply these settings."]);
}));

for (const malformed of ['{', '[]', 'null', '42']) test(`malformed project settings ${malformed} do not replace either file`, () => fixture((cwd, agent, global, project) => {
  writeFileSync(global, '{"theme":"keep"}'); writeFileSync(project, malformed);
  assert.throws(() => ensureQueueSettings(cwd, () => true, agent));
  assert.equal(readFileSync(global, "utf8"), '{"theme":"keep"}'); assert.equal(readFileSync(project, "utf8"), malformed);
}));

test("malformed global configuration is preserved and produces only a generic warning", () => fixture((cwd, agent, global) => {
  writeFileSync(global, 'private malformed fixture');
  const notices: string[] = [];
  configureQueueSettings({ cwd, agentDir: agent, current: () => true, notify: message => notices.push(message) });
  assert.equal(notices.length, 1); assert.doesNotMatch(notices[0]!, /private malformed fixture/);
  assert.equal(readFileSync(global, "utf8"), 'private malformed fixture');
}));

test("host settings lock contention does not overwrite, and later writes preserve another writer's fields", () => fixture((cwd, agent, global) => {
  writeFileSync(global, '{"theme":"before"}');
  const release = lockfile.lockSync(global, { realpath: false });
  try {
    assert.throws(() => ensureQueueSettings(cwd, () => true, agent));
    writeFileSync(global, '{"theme":"concurrent", "newField":123}');
  } finally { release(); }
  assert.equal(ensureQueueSettings(cwd, () => true, agent), "changed");
  assert.deepEqual(read(global), { theme: "concurrent", newField: 123, steeringMode: "all", followUpMode: "all" });
}));

test("invalidated caller guard skips before files and again before commit", () => fixture((cwd, agent, global) => {
  assert.equal(ensureQueueSettings(cwd, () => false, agent), "skipped");
  let checks = 0;
  assert.equal(ensureQueueSettings(cwd, () => ++checks === 1, agent), "skipped");
  assert.throws(() => readFileSync(global), /ENOENT/);
}));

test("custom agent directory equal to project .pi is locked and changed once", () => fixture((cwd, _agent, _global, project) => {
  assert.equal(ensureQueueSettings(cwd, () => true, join(cwd, ".pi")), "changed");
  assert.deepEqual(read(project), { steeringMode: "all", followUpMode: "all" });
}));

test("symlink settings destination is refused", () => fixture((cwd, agent, global, project) => {
  writeFileSync(global, '{}'); symlinkSync(global, project);
  assert.throws(() => ensureQueueSettings(cwd, () => true, agent));
  assert.equal(readFileSync(global, "utf8"), '{}');
}));
