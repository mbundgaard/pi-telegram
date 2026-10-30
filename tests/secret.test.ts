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
import { registerResponseRouting } from "../src/request-routing.ts";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

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
  assert.equal(f.inputs[0].text, `Native secret saved: project-relative path=${JSON.stringify(`${SECRET_DIRECTORY}/dummy.txt`)}; bytes=${Buffer.byteLength(dummy)}.`);
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

test("successive direct and menu saves remain available before, during and after metadata turns", async () => fixture(async f => {
  const handlers = new Map<string, Function>();
  const route = registerResponseRouting({ on: (name: string, handler: Function) => handlers.set(name, handler) } as unknown as ExtensionAPI, () => f.connection);
  for (let i = 0; i < 6; i++) {
    const name = "repeat.txt";
    if (i % 2) {
      f.dispatch({ text: "/secret" });
      await wait(() => (f.connection as any).secret.flow?.phase === "awaiting");
      f.dispatch({ text: name, reply_to_message: f.bot() });
      await wait(() => (f.connection as any).secret.flow?.stage === "content" && (f.connection as any).secret.flow?.phase === "awaiting");
    } else await f.ready(name);
    f.dispatch({ text: `DUMMY-repeat-${i}`, reply_to_message: f.bot() });
    await wait(() => f.inputs.length === i + 1);
    assert.equal((f.connection as any).secret.active, false);
    assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, name), "utf8"), `DUMMY-repeat-${i}`);
    const text = route.origins.enqueue(f.inputs[i].text, f.connection);
    await handlers.get("input")!({ text, source: "extension" });
    if (i % 3 !== 0) {
      await handlers.get("message_start")!({ message: { role: "user", content: text } });
      assert.equal(route.destination(), f.connection);
      if (i % 3 === 2) {
        await handlers.get("agent_settled")!({});
        assert.equal(route.destination(), undefined);
      }
    }
  }
  route.reset();
  assert.ok(!JSON.stringify(f.inputs).includes("DUMMY-repeat"));
  assert.ok(!JSON.stringify(f.requests).includes("DUMMY-repeat"));
}));

test("existing secret survives prompt, invalid contents and cancellation without confirmation", async () => fixture(async f => {
  await prepareSecretTarget(f.cwd, "dummy.txt");
  const file = join(f.cwd, SECRET_DIRECTORY, "dummy.txt");
  await writeFile(file, "DUMMY-old");
  for (const cancel of ["/cancel", "/stop"]) {
    const p = await f.ready();
    assert.equal(await readFile(file, "utf8"), "DUMMY-old");
    f.dispatch({ text: "", reply_to_message: p }); await flush();
    assert.equal(await readFile(file, "utf8"), "DUMMY-old");
    f.dispatch({ text: cancel }); await flush();
    assert.equal(await readFile(file, "utf8"), "DUMMY-old");
  }
  assert.equal(f.inputs.length, 0);
}));

test("a fresh secret command replaces a question after a successful save",  async () => fixture(async f => {
  const p = await f.ready();
  f.dispatch({ text: "DUMMY-first", reply_to_message: p });
  await wait(() => f.inputs.length === 1);
  await f.connection.post("What next?", [{ label: "Continue", reply: "Continue" }]);
  await f.ready("next.txt");
  assert.equal((f.connection as any).question, undefined);
  assert.equal(f.inputs.length, 1, "replacement never becomes model input");
  f.dispatch({ text: "DUMMY-second", reply_to_message: f.bot() });
  await wait(() => f.inputs.length === 2);
  assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "next.txt"), "utf8"), "DUMMY-second");
}));

test("malformed invalid and unsafe shortcut filenames never prompt or reach model", async () => fixture(async f => {
  for (const text of ["/secret@",  "/secret: DUMMY", "/secret ../x", "/secret a/b", "/secret a\\b", "/secret CON.txt", "/secret config", "/secret .git", "/secret a b", "/secret " + "x".repeat(65)]) f.dispatch({ text });
  await flush(); assert.equal(f.prompt(), undefined); assert.equal(f.inputs.length, 0);
  await prepareSecretTarget(f.cwd, "exists.txt"); await mkdir(join(f.cwd, SECRET_DIRECTORY, "exists.txt"));
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
    await f.ready("after-cancel.txt"); f.dispatch({ text: "/cancel" });
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

test("visible prompt before acknowledgement holds one reply until exact ACK, for direct and menu intake",  async () => {
  for (const menu of [false, true]) for (const failure of [false, true]) await fixture(async f => {
    const held = deferred(), entered = deferred();
    let filename: any;
    if (menu) {
      f.dispatch({ text: "/secret" });
      await wait(() => (f.connection as any).secret.flow?.phase === "awaiting");
      filename = f.bot();
    }
    f.hook(async (r: any) => {
      if (r.body.reply_markup?.force_reply) {
        entered.resolve(); await held.promise;
        if (failure) throw new Error("DUMMY-uncertain-send-error");
      }
    });
    f.dispatch(menu ? { text: "dummy.txt", reply_to_message: filename } : { text: "/secret dummy.txt" });
    await entered.promise;
    const visible = f.bot();
    f.dispatch({ text: "DUMMY-fast-reply", reply_to_message: visible });
    await flush();
    await assert.rejects(stat(join(f.cwd, SECRET_DIRECTORY, "dummy.txt")));
    assert.equal(f.inputs.length, 0);
    f.dispatch({ text: "DUMMY-duplicate", reply_to_message: visible });
    held.resolve();
    await wait(() => failure ? !(f.connection as any).secret.active : f.inputs.length === 1);
    await flush();
    assert.equal(f.requests.filter((r: any) => r.body.reply_markup?.force_reply).length, menu ? 2 : 1);
    if (failure) {
      await assert.rejects(stat(join(f.cwd, SECRET_DIRECTORY, "dummy.txt")));
      assert.equal(f.requests.filter((r: any) => r.method === "deleteMessage").length, 0);
      assert.ok(f.requests.some((r: any) => r.body.text?.includes("A prompt may be visible")));
      assert.ok(!f.requests.some((r: any) => r.body.text?.includes("destination may already exist")));
      f.dispatch({ text: "DUMMY-stale-reply", reply_to_message: visible });
      await flush(); assert.equal(f.inputs.length, 0);
    } else {
      assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "dummy.txt"), "utf8"), "DUMMY-fast-reply");
      assert.equal(f.inputs.length, 1);
      assert.equal(f.requests.filter((r: any) => r.method === "deleteMessage").length, 2);
    }
    assert.ok(!JSON.stringify(f.requests).includes("DUMMY-"));
    assert.ok(!JSON.stringify(f.inputs).includes("DUMMY-"));
  });
});

test("fast filename reply advances only after ACK and retains fixed deadline", async () => fixture(async f => {
  const held = deferred(), entered = deferred(); let once = false;
  f.hook(async (r: any) => { if (!once && r.body.reply_markup?.force_reply) { once = true; entered.resolve(); await held.promise; } });
  f.dispatch({ text: "/secret" }); await entered.promise;
  const expires = (f.connection as any).secret.flow.expires;
  f.dispatch({ text: "fast-name.txt", reply_to_message: f.bot() });
  f.dispatch({ text: "duplicate.txt", reply_to_message: f.bot() });
  held.resolve();
  await wait(() => (f.connection as any).secret.flow?.stage === "content" && (f.connection as any).secret.flow?.phase === "awaiting");
  assert.equal((f.connection as any).secret.flow.expires, expires);
  f.dispatch({ text: "DUMMY-fast-name", reply_to_message: f.bot() });
  await wait(() => f.inputs.length === 1);
  assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "fast-name.txt"), "utf8"), "DUMMY-fast-name");
}));

test("inflight candidates require current nonce AND confirmed exact ID; replacement drops buffers", async () => {
  for (const mode of ["nonce", "id", "replace", "stop", "expire"]) await fixture(async f => {
    const held = deferred(), entered = deferred(); let once = false;
    f.hook(async (r: any) => { if (!once && r.body.reply_markup?.force_reply) { once = true; entered.resolve(); await held.promise; } });
    f.dispatch({ text: "/secret old.txt" }); await entered.promise;
    const old = f.bot();
    const quoted = mode === "nonce" ? { ...old, text: old.text.replace(/[a-f0-9]{24}/, "0".repeat(24)) } : mode === "id" ? { ...old, message_id: 999 } : old;
    f.dispatch({ text: "DUMMY-buffer", reply_to_message: quoted });
    const oldFlow = (f.connection as any).secret.flow;
    if (mode === "replace") await f.ready("new.txt");
    if (mode === "stop") f.dispatch({ text: "/stop" });
    if (mode === "expire") oldFlow.expires = Date.now() - 1;
    held.resolve(); await flush();
    await assert.rejects(stat(join(f.cwd, SECRET_DIRECTORY, "old.txt")));
    assert.equal(f.inputs.length, 0);
    if (mode === "replace" || mode === "stop") assert.equal(oldFlow.early, undefined);
    if (mode === "replace") {
      f.dispatch({ text: "/secret stale.txt", reply_to_message: old });
      f.dispatch({ text: "DUMMY-new", reply_to_message: f.bot() });
      await wait(() => f.inputs.length === 1);
      assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "new.txt"), "utf8"), "DUMMY-new");
    }
    assert.ok(!JSON.stringify(f.inputs).includes("DUMMY-"));
    assert.ok(!JSON.stringify(f.requests).includes("DUMMY-"));
  });
});

test("secret supersedes inflight and queued questions, and blocks new button sends until done", async () => fixture(async f => {
  const held = deferred(), entered = deferred();
  f.hook(async (r: any) => { if (r.method === "sendRichMessage") { entered.resolve(); await held.promise; } });
  const first = assert.rejects(f.connection.post("Old?", [{ label: "Yes", reply: "yes" }]));
  await entered.promise;
  const queued = assert.rejects(f.connection.post("Queued?", [{ label: "Yes", reply: "yes" }]));
  await f.ready();
  await assert.rejects(f.connection.post("New?", [{ label: "Yes", reply: "yes" }]), /Secret intake/);
  await assert.rejects(f.connection.postEmbedded([{ type: "button_row", buttons: [{ label: "Yes", reply: "yes" }] }]), /Secret intake/);
  held.resolve(); await Promise.all([first, queued]);
  assert.equal((f.connection as any).question, undefined);
  assert.equal(f.requests.filter((r: any) => r.method === "sendRichMessage").length, 1);
  f.dispatch({ text: "/cancel" });
  assert.equal((f.connection as any).question, undefined);
  assert.equal(f.inputs.length, 0);
}));

test("invalid replacement preserves current question or intake; valid repeated starts replace", async () => fixture(async f => {
  await f.connection.post("Question?", [{ label: "Yes", reply: "yes" }]);
  const question = (f.connection as any).question;
  f.dispatch({ text: "/secret ../bad" });
  assert.equal((f.connection as any).question, question);
  const old = await f.ready();
  const flow = (f.connection as any).secret.flow;
  f.dispatch({ text: "/secret CON" });
  assert.equal((f.connection as any).secret.flow, flow);
  f.dispatch({ text: "/secret one.txt" });
  await f.ready("two.txt");
  f.dispatch({ text: "DUMMY-old", reply_to_message: old });
  f.dispatch({ text: "DUMMY-two", reply_to_message: f.bot() });
  await wait(() => f.inputs.length === 1);
  assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "two.txt"), "utf8"), "DUMMY-two");
}));

test("secret retires inflight feedback prompt and preview without Submit resurrection", async () => {
  for (const preview of [false, true]) await fixture(async f => {
    const feedback = (f.connection as any).feedback;
    feedback.options = { endpoint: "https://feedback.example.test/", version: "0.6.4" };
    if (preview) { f.dispatch({ text: "/feedback" }); await wait(() => feedback.current?.phase === "awaiting"); }
    const held = deferred(), entered = deferred();
    f.hook(async (r: any) => { if (r.body.text?.startsWith("Pi Telegram feedback")) { entered.resolve(); await held.promise; } });
    if (preview) f.dispatch({ text: "dummy feedback", reply_to_message: f.bot() });
    else f.dispatch({ text: "/feedback" });
    await entered.promise;
    const old = f.requests.at(-1);
    await f.ready(); held.resolve(); await flush();
    assert.equal(feedback.active, false);
    f.dispatch({ text: "/cancel" });
    if (preview) (f.connection as any).dispatch({ callback_query: { id: "old", from: { id: 42, is_bot: false }, message: f.bot(old), data: old.body.reply_markup.inline_keyboard[0][0].callback_data } }, (m: any) => f.inputs.push(m));
    else f.dispatch({ text: "DUMMY-stale", reply_to_message: f.bot(old) });
    await flush(); assert.equal(f.inputs.length, 0);
    assert.ok(!f.requests.some((r: any) => r.body.feedback));
  });
});

test("preparation failures are distinct from uncertain visible prompt delivery", async () => fixture(async f => {
  f.verified(false);
  f.dispatch({ text: "/secret dummy.txt" });
  await wait(() => !(f.connection as any).secret.active); await flush();
  assert.equal(f.prompt(), undefined);
  assert.ok(f.requests.some((r: any) => r.body.text?.includes("preparation failed before sending its prompt")));
  assert.equal(f.inputs.length, 0);
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

test("deletion failure warns without secret or retry; unsafe target does not delete data", async () => {
  await fixture(async f => {
    const p = await f.ready(); f.hook(async (r: any) => { if (r.method === "deleteMessage") throw new Error("DUMMY-sensitive-error"); });
    f.dispatch({ text: "DUMMY-value", reply_to_message: p }); await wait(() => f.inputs.length === 1); await flush();
    assert.equal(f.requests.filter((r: any) => r.method === "deleteMessage").length, 2);
    assert.ok(f.requests.some((r: any) => r.body.text?.includes("Remove the secret reply and prompt manually")));
    assert.ok(!JSON.stringify(f.requests).includes("DUMMY-"));
    await f.ready("after-deletion-failure.txt");
    f.dispatch({ text: "DUMMY-next", reply_to_message: f.bot() });
    await wait(() => f.inputs.length === 2);
    assert.equal((f.connection as any).secret.active, false);
  });
  await fixture(async f => {
    const p = await f.ready(); await writeFile(join(f.cwd, SECRET_DIRECTORY, "dummy.txt"), "winner");
    await link(join(f.cwd, SECRET_DIRECTORY, "dummy.txt"), join(f.cwd, "alias.txt"));
    f.dispatch({ text: "DUMMY-collision", reply_to_message: p }); await wait(() => !(f.connection as any).secret.active); await flush();
    assert.equal(await readFile(join(f.cwd, SECRET_DIRECTORY, "dummy.txt"), "utf8"), "winner");
    assert.equal(f.inputs.length, 0); assert.equal(f.requests.filter((r: any) => r.method === "deleteMessage").length, 0);
    assert.ok(!f.requests.some((r: any) => r.body.text?.startsWith("Saved ")));
    await f.ready("after-collision.txt");
    f.dispatch({ text: "DUMMY-recovered", reply_to_message: f.bot() });
    await wait(() => f.inputs.length === 1);
  });
});

test("download remains guarded; secret replaces question and callbacks stay inert",  async () => fixture(async f => {
  (f.connection as any).incomingGroups = { busy: true, cancel() {} };
  f.dispatch({ text: "/secret dummy.txt" }); await flush(); assert.equal(f.prompt(), undefined);
  assert.ok(f.requests.some((r: any) => r.body.text?.includes("a file download is active")));
  (f.connection as any).incomingGroups = undefined;
  await f.connection.post("Question", [{ label: "Yes", reply: "yes" }]);
  await f.ready();
  assert.equal((f.connection as any).question, undefined);
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
  f.hook(async () => {});
  await f.ready("after-postcommit-cancel.txt");
  f.dispatch({ text: "DUMMY-next", reply_to_message: f.bot() });
  await wait(() => f.inputs.length === 1);
}));

test("retired intake rejects recognizable prompt replies but does not redact ordinary chat", async () => fixture(async f => {
  const p = await f.ready(); f.dispatch({ text: "/cancel" });
  f.dispatch({ text: "DUMMY-stale", reply_to_message: p });
  f.dispatch({ text: "ordinary non-sensitive conversation" }); await flush();
  assert.equal(f.inputs.length, 1);
  assert.equal(f.inputs[0].text, "ordinary non-sensitive conversation");
}));

test("native feedback is cancelled by fresh secret without submission", async () => fixture(async f => {
  const feedback = (f.connection as any).feedback;
  feedback.options = { endpoint: "https://feedback.example.test/", version: "0.6.4" };
  f.dispatch({ text: "/feedback" });
  await wait(() => feedback.current?.phase === "awaiting");
  const old = f.bot();
  await f.ready();
  assert.equal(feedback.active, false);
  f.dispatch({ text: "DUMMY-stale-feedback", reply_to_message: old });
  assert.equal(f.inputs.length, 0);
}));

test("unready connection refuses both commands without prompting and can recover", async () => fixture(async f => {
  f.current(false);
  for (const text of ["/secret", "/secret dummy.txt"]) f.dispatch({ text });
  await flush();
  assert.equal(f.prompt(), undefined); assert.equal(f.inputs.length, 0);
  assert.equal(f.requests.filter((r: any) => r.body.text?.includes("this connection is not ready. Check /ping")).length, 2);
  f.current(true); await f.ready();
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

test("filename stage corrects invalid and unsafe destinations without echo or TTL renewal", async () => fixture(async f => {
  await prepareSecretTarget(f.cwd, "exists.txt"); await mkdir(join(f.cwd, SECRET_DIRECTORY, "exists.txt"));
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
  assert.ok((await stat(join(f.cwd, SECRET_DIRECTORY, "exists.txt"))).isDirectory());
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

test("filesystem rejects symlinks, tracked tree, altered ignore and open permissions; replaces regular files", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "pi-secret-storage-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd });
    let target = await prepareSecretTarget(cwd, "dummy.txt");
    assert.equal(execFileSync("git", ["check-ignore", "--", `${SECRET_DIRECTORY}/dummy.txt`, `${SECRET_DIRECTORY}/.secret-any.tmp`], { cwd, encoding: "utf8" }).trim().split("\n").length, 2);
    await writeFile(target.path, "winner"); commitSecret(target, "DUMMY-replacement", () => true); assert.equal(await readFile(target.path, "utf8"), "DUMMY-replacement");
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
