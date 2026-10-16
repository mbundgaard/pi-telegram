import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, readFile, writeFile, stat, symlink, link, mkdir, chmod, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { TelegramSessionConnection } from "../src/telegram.ts";
import { prepareSecretTarget, commitSecret, validSecretName, SECRET_DIRECTORY } from "../src/secret-files.ts";
import { SecretFlow, SECRET_TTL } from "../src/secret.ts";
import { resolveTelegramProjectFile } from "../src/files.ts";

const flush = async () => { for (let i = 0; i < 10; i++) await new Promise<void>(r => setImmediate(r)); };
const wait = async (predicate: () => boolean) => { for (let i = 0; i < 300 && !predicate(); i++) await new Promise(r => setTimeout(r, 5)); assert.ok(predicate(), "condition reached"); };
const deferred = () => { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r; }); return { promise, resolve }; };
async function fixture(run: (f: any) => Promise<void>) {
  const cwd = await mkdtemp(join(tmpdir(), "pi-secret-test-"));
  const previous = globalThis.fetch, requests: any[] = [], inputs: any[] = [];
  let id = 10, current = true, verified = true, hook = async (_r: any) => {}, verifyHook = async () => {};
  const connection = new TelegramSessionConnection("dummy-token", 42, { botId: 777, secret: { cwd, current: () => current, verify: async () => { await verifyHook(); return verified; } } });
  globalThis.fetch = (async (url, init) => {
    const request = { method: String(url).split("/").at(-1), body: JSON.parse(String(init?.body)), id: ++id };
    requests.push(request); await hook(request);
    return new Response(JSON.stringify({ ok: true, result: { message_id: request.id } }));
  }) as typeof fetch;
  const dispatch = (message: any, edited = false) => (connection as any).dispatch({ update_id: id, [edited ? "edited_message" : "message"]: { message_id: 300, chat: { id: 42, type: "private" }, from: { id: 42, is_bot: false }, ...message } }, (m: any) => inputs.push(m), () => {}, () => "status", () => false);
  const prompt = () => requests.filter(r => r.body.reply_markup?.force_reply).at(-1);
  const bot = (p = prompt()) => ({ message_id: p.id, text: p.body.text, chat: { id: 42, type: "private" }, from: { id: 777, is_bot: true } });
  const ready = async (name = "dummy.txt") => { dispatch({ text: `/secret ${name}` }); await wait(() => (connection as any).secret.flow?.phase === "awaiting"); return bot(); };
  try { await run({ cwd, connection, requests, inputs, dispatch, prompt, bot, ready, current: (v: boolean) => { current = v; }, verified: (v: boolean) => { verified = v; }, hook: (h: typeof hook) => { hook = h; }, verifyHook: (h: typeof verifyHook) => { verifyHook = h; } }); }
  finally { await connection.stop(); globalThis.fetch = previous; await rm(cwd, { recursive: true, force: true }); }
}

test("secret success preserves exact UTF8, deletes only original IDs after write, metadata followup only", async () => fixture(async f => {
  const p = await f.ready(); const dummy = "  DUMMY-only\n雪\r\n$(not-executed)  ";
  f.hook(async (r: any) => { if (r.method === "deleteMessage") assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "dummy.txt"), "utf8"), dummy); });
  f.dispatch({ text: dummy, reply_to_message: p }); f.dispatch({ text: dummy, reply_to_message: p });
  await wait(() => f.inputs.length === 1);
  assert.deepEqual(f.requests.filter((r: any) => r.method === "deleteMessage").map((r: any) => r.body.message_id), [300, p.message_id]);
  assert.equal(f.inputs[0].forceFollowUp, true); assert.equal(f.inputs[0].forceSteer, undefined);
  assert.ok(f.inputs[0].text.includes(`${SECRET_DIRECTORY}/dummy.txt`)); assert.ok(f.inputs[0].text.includes(`bytes=${Buffer.byteLength(dummy)}`));
  assert.ok(!JSON.stringify(f.inputs).includes("DUMMY-only")); assert.ok(!JSON.stringify(f.requests).includes("DUMMY-only"));
  const file = join(f.cwd, SECRET_DIRECTORY, "dummy.txt");
  if (process.platform !== "win32") { assert.equal((await stat(file)).mode & 0o777, 0o600); assert.equal((await stat(join(f.cwd, SECRET_DIRECTORY))).mode & 0o777, 0o700); }
  assert.deepEqual((await readdir(join(f.cwd, SECRET_DIRECTORY))).sort(), [".gitignore", "dummy.txt"]);
  await assert.rejects(resolveTelegramProjectFile(f.cwd, file), /will not send/);
  await writeFile(join(f.cwd, SECRET_DIRECTORY, "innocent.bin"), "dummy");
  await assert.rejects(resolveTelegramProjectFile(f.cwd, `${SECRET_DIRECTORY}/innocent.bin`));
  await symlink(file, join(f.cwd, "alias.txt")); await assert.rejects(resolveTelegramProjectFile(f.cwd, "alias.txt"));
  await link(file, join(f.cwd, "hard.txt")); await assert.rejects(resolveTelegramProjectFile(f.cwd, "hard.txt"), /hard-linked/);
}));

test("malformed invalid and existing shortcut filenames never prompt or reach model", async () => fixture(async f => {
  for (const text of ["/secret@",  "/secret: DUMMY", "/secret ../x", "/secret a/b", "/secret a\\b", "/secret CON.txt", "/secret config", "/secret .git", "/secret a b", "/secret " + "x".repeat(65)]) f.dispatch({ text });
  await flush(); assert.equal(f.prompt(), undefined); assert.equal(f.inputs.length, 0);
  await prepareSecretTarget(f.cwd, "exists.txt"); await writeFile(join(f.cwd, SECRET_DIRECTORY, "exists.txt"), "dummy");
  f.dispatch({ text: "/secret exists.txt" }); await wait(() => !(f.connection as any).secret.active);
  assert.equal(f.prompt(), undefined); assert.equal(f.inputs.length, 0);
  for (const name of ["NUL", "com1.a", "LPT9", "a..b", "a.", "a\n", ".env", "a\0b"]) assert.equal(validSecretName(name), false);
}));

test("active intake fails closed for unmatched text, wrong prompt, media, edits and native commands", async () => fixture(async f => {
  const p = await f.ready();
  for (const message of [{ text: "DUMMY-unmatched" }, { text: "/feedback" }, { text: "/reload" }, { text: "DUMMY-wrong", reply_to_message: { ...p, message_id: 999 } }, { document: { file_id: "never-download" }, caption: "DUMMY-caption", reply_to_message: p }, { text: "DUMMY-forward", forward_origin: {}, reply_to_message: p }]) f.dispatch(message);
  f.dispatch({ text: "DUMMY-edit", reply_to_message: p }, true);
  for (const override of [{ from: { id: 7, is_bot: false } }, { chat: { id: 42, type: "group" } }, { from: { id: 42, is_bot: true } }]) f.dispatch({ text: "DUMMY-other", reply_to_message: p, ...override });
  await flush(); assert.equal(f.inputs.length, 0); assert.equal((f.connection as any).incoming, undefined);
  assert.equal((f.connection as any).secret.flow.phase, "awaiting");
  assert.ok(!JSON.stringify(f.requests).includes("DUMMY-"));
}));

test("cancel and established global Stop override exact reply data; all stale prompt replies fail closed", async () => {
  for (const command of ["/cancel", "/stop", "stop"]) await fixture(async f => {
    const p = await f.ready(); f.dispatch({ text: command, reply_to_message: p }); await flush();
    assert.equal((f.connection as any).secret.active, false);
    f.dispatch({ text: "DUMMY-late", reply_to_message: p }); f.dispatch({ document: { file_id: "never" }, caption: "DUMMY-late", reply_to_message: p });
    await flush(); assert.equal(f.inputs.length, 0); assert.equal(f.requests.filter((r: any) => r.method === "deleteMessage").length, 0);
    await assert.rejects(stat(join(f.cwd, SECRET_DIRECTORY, "dummy.txt")));
  });
});

test("own-bot secret marker rejects stale replies across fresh connections", async () => {
  let old: any;
  await fixture(async f => { old = await f.ready(); });
  await fixture(async f => {
    for (const message of [{ text: "DUMMY-late" }, { document: { file_id: "never" }, caption: "DUMMY-late" }, { voice: { file_id: "never", duration: 1 } }]) f.dispatch({ ...message, reply_to_message: old });
    await flush(); assert.equal(f.inputs.length, 0); assert.equal(f.prompt(), undefined); assert.equal((f.connection as any).incoming, undefined);
  });
});

test("prompt in flight fences data and cancellation cannot revive prompt", async () => fixture(async f => {
  const hold = deferred(), entered = deferred();
  f.hook(async (r: any) => { if (r.body.reply_markup?.force_reply) { entered.resolve(); await hold.promise; } });
  f.dispatch({ text: "/secret dummy.txt" }); await entered.promise;
  f.dispatch({ text: "DUMMY-before-ack", reply_to_message: f.bot() }); f.dispatch({ text: "DUMMY-unmatched" });
  f.dispatch({ text: "/cancel" }); hold.resolve(); await flush();
  f.dispatch({ text: "DUMMY-after", reply_to_message: f.bot() }); await flush();
  assert.equal(f.inputs.length, 0); assert.equal((f.connection as any).secret.active, false);
}));

test("revalidation failure and cancel during verification prevent late writes and deletion", async () => {
  for (const mode of ["cancel", "disconnect", "transfer", "verify"]) await fixture(async f => {
    const p = await f.ready(), entered = deferred(), held = deferred();
    f.verifyHook(async () => { entered.resolve(); await held.promise; });
    f.dispatch({ text: "DUMMY-held", reply_to_message: p }); await entered.promise;
    if (mode === "cancel") f.dispatch({ text: "/cancel" });
    if (mode === "disconnect") { const closing = f.connection.stop(); held.resolve(); await closing; }
    if (mode === "transfer") f.current(false);
    if (mode === "verify") f.verified(false);
    held.resolve(); await flush();
    await assert.rejects(stat(join(f.cwd, SECRET_DIRECTORY, "dummy.txt")));
    assert.equal(f.inputs.length, 0); assert.equal(f.requests.filter((r: any) => r.method === "deleteMessage").length, 0);
  });
});

test("deadline rejects data even before timer callback; whitespace valid and empty rejected", async () => fixture(async f => {
  let p = await f.ready();
  f.dispatch({ text: "", reply_to_message: p }); f.dispatch({ text: "雪".repeat(6000), reply_to_message: p }); await flush();
  assert.equal((f.connection as any).secret.flow.phase, "awaiting");
  (f.connection as any).secret.flow.expires = Date.now() - SECRET_TTL;
  f.dispatch({ text: "DUMMY-expired", reply_to_message: p }); await flush(); assert.equal(f.inputs.length, 0);
  f.dispatch({ text: "/cancel" }); p = await f.ready(); f.dispatch({ text: " \n\t", reply_to_message: p });
  await wait(() => f.inputs.length === 1); assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "dummy.txt"), "utf8"), " \n\t");
}));

test("deletion failure warns without secret or retry; write collision does not delete data", async () => {
  await fixture(async f => {
    const p = await f.ready(); f.hook(async (r: any) => { if (r.method === "deleteMessage") throw new Error("DUMMY-sensitive-error"); });
    f.dispatch({ text: "DUMMY-value", reply_to_message: p }); await wait(() => f.inputs.length === 1); await flush();
    assert.equal(f.requests.filter((r: any) => r.method === "deleteMessage").length, 2);
    assert.ok(f.requests.some((r: any) => r.body.text?.includes("Remove the secret reply and prompt manually")));
    assert.ok(!JSON.stringify(f.requests).includes("DUMMY-"));
  });
  await fixture(async f => {
    const p = await f.ready(); await writeFile(join(f.cwd, SECRET_DIRECTORY, "dummy.txt"), "winner");
    f.dispatch({ text: "DUMMY-collision", reply_to_message: p }); await wait(() => !(f.connection as any).secret.active); await flush();
    assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "dummy.txt"), "utf8"), "winner");
    assert.equal(f.inputs.length, 0); assert.equal(f.requests.filter((r: any) => r.method === "deleteMessage").length, 0);
    assert.ok(!f.requests.some((r: any) => r.body.text?.startsWith("Saved ")));
  });
});

test("download and agent question refuse secret collection; callback cannot enter model while active", async () => fixture(async f => {
  (f.connection as any).incoming = { controller: new AbortController(), task: Promise.resolve() };
  f.dispatch({ text: "/secret dummy.txt" }); await flush(); assert.equal(f.prompt(), undefined);
  (f.connection as any).incoming = undefined;
  await f.connection.post("Question", [{ label: "Yes", reply: "yes" }]);
  f.dispatch({ text: "/secret dummy.txt" }); await flush(); assert.equal(f.prompt(), undefined);
  f.dispatch({ text: "/stop" }); await f.ready();
  (f.connection as any).dispatch({ callback_query: { id: "q", from: { id: 42, is_bot: false }, data: "ask:old:0" } }, (m: any) => f.inputs.push(m));
  await flush(); assert.equal(f.inputs.length, 0);
}));

test("secret TTL timer retires its own flow without creating a prompt after delayed verification", async t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const held = deferred(); const requests: any[] = [], tasks: Promise<void>[] = [];
  const flow = new SecretFlow(42, 777, { cwd: "/unused", current: () => true, verify: async () => { await held.promise; return true; } }, {
    request: async (_method, body) => { requests.push(body); return { message_id: 10 }; },
    notice: () => {}, background: task => { tasks.push(task); }, signal: new AbortController().signal,
  });
  flow.start("dummy.txt", false); assert.equal(flow.active, true);
  t.mock.timers.tick(SECRET_TTL); assert.equal(flow.active, false);
  held.resolve(); await Promise.all(tasks); assert.equal(requests.length, 0);
});

test("filename stage timer and delayed verification retain the original fixed deadline", async t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const held = deferred(), tasks: Promise<void>[] = [], requests: any[] = [];
  let verifyCount = 0;
  const flow = new SecretFlow(42, 777, { cwd: "/unused", current: () => true, verify: async () => { if (++verifyCount > 1) await held.promise; return true; } }, {
    request: async (_method, body) => { requests.push(body); return { message_id: 10 }; },
    notice: () => {}, background: work => { tasks.push(work); }, signal: new AbortController().signal,
  });
  flow.start(undefined, false); await tasks[0];
  t.mock.timers.tick(SECRET_TTL - 1);
  const reply = { message_id: 20, text: "dummy.txt", chat: { id: 42, type: "private" }, from: { id: 42, is_bot: false }, reply_to_message: { message_id: 10, text: requests[0].text, chat: { id: 42, type: "private" }, from: { id: 777, is_bot: true } } };
  assert.equal(flow.reply(reply, () => assert.fail("no metadata")), true);
  t.mock.timers.tick(1); assert.equal(flow.active, false);
  held.resolve(); await Promise.all(tasks); assert.equal(requests.length, 1);
  assert.equal(flow.reply(reply, () => assert.fail("no metadata")), true);
});

test("post-commit cancellation preserves file but suppresses metadata and further cleanup", async () => fixture(async f => {
  const p = await f.ready(), entered = deferred(), held = deferred();
  f.hook(async (r: any) => { if (r.method === "deleteMessage") { entered.resolve(); await held.promise; } });
  f.dispatch({ text: "DUMMY-committed", reply_to_message: p }); await entered.promise;
  f.dispatch({ text: "/cancel" }); held.resolve(); await flush();
  assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "dummy.txt"), "utf8"), "DUMMY-committed");
  assert.equal(f.inputs.length, 0);
  assert.equal(f.requests.filter((r: any) => r.method === "deleteMessage").length, 1);
  assert.ok(!f.requests.some((r: any) => r.body.text?.startsWith("Saved ")));
}));

test("retired intake rejects recognizable prompt replies but does not redact ordinary chat", async () => fixture(async f => {
  const p = await f.ready(); f.dispatch({ text: "/cancel" });
  f.dispatch({ text: "DUMMY-stale", reply_to_message: p });
  f.dispatch({ text: "ordinary non-sensitive conversation" }); await flush();
  assert.equal(f.inputs.length, 1);
  assert.equal(f.inputs[0].text, "ordinary non-sensitive conversation");
}));

test("native feedback must be cancelled before secret collection", async () => fixture(async f => {
  // Existing flow state is transport-owned; this isolates admission from endpoint availability.
  Object.defineProperty((f.connection as any).feedback, "active", { value: true, configurable: true });
  f.dispatch({ text: "/secret dummy.txt" }); await flush();
  assert.equal(f.prompt(), undefined); assert.equal(f.inputs.length, 0);
}));

test("bare menu command requires filename then a distinct content reply; duplicates stay fenced", async () => fixture(async f => {
  f.dispatch({ text: "/secret" }); await wait(() => (f.connection as any).secret.flow?.phase === "awaiting");
  const filename = f.bot(), expires = (f.connection as any).secret.flow.expires;
  assert.match(filename.text, /not secret contents/);
  f.dispatch({ text: "menu.txt", reply_to_message: filename });
  f.dispatch({ text: "duplicate.txt", reply_to_message: filename });
  await wait(() => (f.connection as any).secret.flow?.stage === "content" && (f.connection as any).secret.flow?.phase === "awaiting");
  const content = f.bot(); assert.notEqual(content.message_id, filename.message_id);
  assert.equal((f.connection as any).secret.flow.expires, expires);
  await assert.rejects(stat(join(f.cwd, SECRET_DIRECTORY, "menu.txt")));
  for (const message of [{ text: "DUMMY-old" }, { caption: "DUMMY-caption", document: { file_id: "never" } }]) f.dispatch({ ...message, reply_to_message: filename });
  f.dispatch({ text: "DUMMY-edit", reply_to_message: filename }, true);
  f.dispatch({ text: "/secret literal-dummy", reply_to_message: content });
  await wait(() => f.inputs.length === 1);
  assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "menu.txt"), "utf8"), "/secret literal-dummy");
  assert.deepEqual(f.requests.filter((r: any) => r.method === "deleteMessage").map((r: any) => r.body.message_id), [300, content.message_id]);
  assert.ok(!JSON.stringify(f.inputs).includes("literal-dummy")); assert.ok(!JSON.stringify(f.requests).includes("DUMMY-"));
  f.dispatch({ text: "DUMMY-retired", reply_to_message: filename }); await flush(); assert.equal(f.inputs.length, 1);
}));

test("filename stage corrects invalid and existing destinations without echo or TTL renewal", async () => fixture(async f => {
  await prepareSecretTarget(f.cwd, "exists.txt"); await writeFile(join(f.cwd, SECRET_DIRECTORY, "exists.txt"), "winner");
  f.dispatch({ text: "/secret" }); await wait(() => (f.connection as any).secret.flow?.phase === "awaiting");
  const p = f.bot(), expires = (f.connection as any).secret.flow.expires;
  for (const text of ["../DUMMY-invalid", "CON", "a b", "", "x".repeat(65)]) f.dispatch({ text, reply_to_message: p });
  for (const message of [{ text: "DUMMY-unmatched" }, { caption: "DUMMY-media", voice: { file_id: "never", duration: 1 }, reply_to_message: p }, { text: "DUMMY-forward", forward_origin: {}, reply_to_message: p }, { text: "wrong.txt", from: { id: 7, is_bot: false }, reply_to_message: p }, { text: "wrong.txt", chat: { id: 42, type: "group" }, reply_to_message: p }]) f.dispatch(message);
  f.dispatch({ text: "DUMMY-edit", reply_to_message: p }, true);
  f.dispatch({ text: "exists.txt", reply_to_message: p }); await wait(() => (f.connection as any).secret.flow?.phase === "awaiting");
  assert.equal(f.prompt().id, p.message_id); assert.equal((f.connection as any).secret.flow.expires, expires);
  assert.equal(f.inputs.length, 0); assert.ok(!JSON.stringify(f.requests).includes("DUMMY-"));
  f.dispatch({ text: "corrected.txt", reply_to_message: p });
  await wait(() => (f.connection as any).secret.flow?.stage === "content" && (f.connection as any).secret.flow?.phase === "awaiting");
  f.dispatch({ text: "DUMMY-success", reply_to_message: f.bot() }); await wait(() => f.inputs.length === 1);
  assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "exists.txt"), "utf8"), "winner");
}));

test("filename prompts remain rejection-only after cancellation, deadline and reconnect", async () => {
  let old: any;
  for (const command of ["/cancel", "/stop", "stop", "expiry"]) await fixture(async f => {
    f.dispatch({ text: "/secret" }); await wait(() => (f.connection as any).secret.flow?.phase === "awaiting"); old = f.bot();
    if (command === "expiry") (f.connection as any).secret.flow.expires = Date.now() - 1;
    else f.dispatch({ text: command, reply_to_message: old });
    f.dispatch({ text: "DUMMY-stale", reply_to_message: old }); await flush();
    assert.equal(f.inputs.length, 0); assert.equal(f.requests.filter((r: any) => r.body.reply_markup?.force_reply).length, 1);
  });
  await fixture(async f => {
    for (const m of [{ text: "DUMMY-reconnect" }, { caption: "DUMMY-media", document: { file_id: "never" } }]) f.dispatch({ ...m, reply_to_message: old });
    f.dispatch({ text: "DUMMY-edit", reply_to_message: old }, true); await flush();
    assert.equal(f.inputs.length, 0); assert.equal(f.prompt(), undefined);
  });
});

test("filename verification and both prompt sends are cancellation fenced; send errors never leak", async () => {
  for (const stage of ["filename-send", "verify", "content-send", "error"]) await fixture(async f => {
    const entered = deferred(), held = deferred();
    if (stage === "filename-send") f.hook(async (r: any) => { if (r.body.reply_markup?.force_reply) { entered.resolve(); await held.promise; } });
    f.dispatch({ text: "/secret" });
    if (stage !== "filename-send") {
      await wait(() => (f.connection as any).secret.flow?.phase === "awaiting");
      if (stage === "verify") f.verifyHook(async () => { entered.resolve(); await held.promise; });
      else f.hook(async (r: any) => { if (r.body.reply_markup?.force_reply) { entered.resolve(); if (stage === "error") throw new Error("DUMMY-private-error"); await held.promise; } });
      f.dispatch({ text: "dummy.txt", reply_to_message: f.bot() });
    }
    await entered.promise;
    f.dispatch({ text: "DUMMY-early", reply_to_message: f.bot() });
    if (stage !== "error") f.dispatch({ text: "/cancel" });
    held.resolve(); await wait(() => !(f.connection as any).secret.active);
    f.dispatch({ text: "DUMMY-late", reply_to_message: f.bot() }); await flush();
    assert.equal(f.inputs.length, 0); assert.ok(!JSON.stringify(f.requests).includes("DUMMY-"));
    await assert.rejects(stat(join(f.cwd, SECRET_DIRECTORY, "dummy.txt")));
  });
});

test("filesystem rejects symlinks, tracked tree, altered ignore, open permissions and no-clobber race", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "pi-secret-storage-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd });
    let target = await prepareSecretTarget(cwd, "dummy.txt");
    assert.equal(execFileSync("git", ["check-ignore", "--", `${SECRET_DIRECTORY}/dummy.txt`, `${SECRET_DIRECTORY}/.secret-any.tmp`], { cwd, encoding: "utf8" }).trim().split("\n").length, 2);
    await writeFile(target.path, "winner"); assert.throws(() => commitSecret(target, "DUMMY-loser", () => true)); assert.equal(await readFile(target.path, "utf8"), "winner");
    await rm(target.path); await symlink(join(cwd, "outside"), target.path); await assert.rejects(prepareSecretTarget(cwd, "dummy.txt")); await rm(target.path);
    execFileSync("git", ["add", "-f", `${SECRET_DIRECTORY}/.gitignore`], { cwd }); await assert.rejects(prepareSecretTarget(cwd, "dummy.txt"));
    execFileSync("git", ["rm", "--cached", "-q", `${SECRET_DIRECTORY}/.gitignore`], { cwd });
    await writeFile(join(target.directory, ".gitignore"), "bad\n"); await assert.rejects(prepareSecretTarget(cwd, "dummy.txt"));
    await writeFile(join(target.directory, ".gitignore"), "*\n");
    if (process.platform !== "win32") { await chmod(target.directory, 0o755); await assert.rejects(prepareSecretTarget(cwd, "dummy.txt")); await chmod(target.directory, 0o700); }
    target = await prepareSecretTarget(cwd, "dummy.txt"); assert.throws(() => commitSecret(target, "DUMMY-cancelled", () => false));
    await rm(join(cwd, ".pi"), { recursive: true }); await mkdir(join(cwd, "elsewhere")); await symlink(join(cwd, "elsewhere"), join(cwd, ".pi"));
    await assert.rejects(prepareSecretTarget(cwd, "dummy.txt"));
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
