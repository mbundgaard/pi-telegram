import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ConnectionManager } from "../src/connection-manager.ts";
import { saveProjectSettings } from "../src/config.ts";

async function fixture(work: (f: any) => Promise<void>, feedbackEndpoint?: string) {
  const cwd = await mkdtemp(join(tmpdir(), "pi-notice-"));
  const previousFetch = globalThis.fetch, previousSettings = process.env.PI_TELEGRAM_SETTINGS;
  process.env.PI_TELEGRAM_SETTINGS = join(cwd, "global", "settings.json");
  const bot = { id: "998877", username: "NoticeTestBot", token: "test-placeholder", ownerUserId: "42", managed: false, sessionId: "main" };
  const calls: string[] = [], warnings: string[] = [];
  const ctx = { cwd, sessionManager: { getSessionId: () => "main" }, ui: { setStatus() {}, notify: (text: string) => warnings.push(text), theme: { fg: (_: string, text: string) => text } } } as any;
  let connected = 0;
  const manager = new ConnectionManager({ input() {}, canStop: () => false, stopTask() {}, disconnected() {}, reload: () => false, connected: () => { connected++; }, version: "test", feedbackEndpoint });
  let handler: (method: string, signal: AbortSignal, body: any) => Promise<Response | undefined> = async () => undefined;
  const ok = (result: unknown) => new Response(JSON.stringify({ ok: true, result }));
  globalThis.fetch = (async (url, init) => {
    const method = String(url).split("/").at(-1)!;
    const body = JSON.parse(String(init?.body));
    calls.push(method);
    const result = await handler(method, init!.signal!, body);
    if (result) return result;
    if (method === "getWebhookInfo") return ok({ url: "" });
    if (method === "getUpdates") {
      if (body.offset === -1) return ok([]);
      return new Promise<Response>((_resolve, reject) => {
        if (init!.signal!.aborted) reject(new Error("aborted"));
        else init!.signal!.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
    }
    return ok(true);
  }) as typeof fetch;
  try {
    await saveProjectSettings(cwd, { version: 2, bots: [bot] });
    await work({ manager, bot, ctx, calls, warnings, connected: () => connected, handle: (fn: typeof handler) => { handler = fn; }, ok });
  } finally {
    await manager.disconnect(ctx);
    globalThis.fetch = previousFetch;
    if (previousSettings === undefined) delete process.env.PI_TELEGRAM_SETTINGS; else process.env.PI_TELEGRAM_SETTINGS = previousSettings;
    await rm(cwd, { recursive: true, force: true });
  }
}

test("feedback wiring retains trusted bot identity while disabled and uses the loaded version when configured", async () => {
  for (const endpoint of [undefined, "https://feedback.example.invalid/submit"]) {
    await fixture(async ({ manager, bot, ctx }: any) => {
      assert.equal(await manager.connect(bot, ctx, new AbortController().signal), true);
      const options = manager.connection.options;
      assert.equal(options.botId, Number(bot.id));
      assert.deepEqual(options.feedback, endpoint === undefined ? undefined : { endpoint, version: "test" });
    }, endpoint);
  }
});

test("restart refusal callback is fenced to the ready connection and exact session", async () =>
  fixture(async ({ manager, bot, ctx }: any) => {
    await manager.connect(bot, ctx, new AbortController().signal);
    const refusal = manager.connection.options.restartRefusal;
    assert.match(refusal(), /cannot verify the updated Pi launcher/);
    ctx.sessionManager.getSessionId = () => "replacement";
    assert.match(refusal(), /no longer ready/);
    ctx.sessionManager.getSessionId = () => "main";
    await manager.disconnect(ctx);
    assert.match(refusal(), /no longer ready/);
    await manager.connect(bot, ctx, new AbortController().signal);
    assert.match(refusal(), /no longer ready/);
  }));

test("native ping is owner/private only and drops stale session and retired connection requests", async () =>
  fixture(async ({ manager, bot, ctx, calls }: any) => {
    await manager.connect(bot, ctx, new AbortController().signal);
    const current = manager.connection;
    assert.match(current.options.ping(), /^Pong · pi-notice-.* · vtest$/);
    let inputs = 0;
    const dispatch = (owner = 42, type = "private") => current.dispatch({ update_id: 1, message: {
      message_id: 1, text: "/ping", chat: { id: 42, type }, from: { id: owner, is_bot: false },
    } }, () => { inputs++; }, () => {}, () => "status", () => false);
    const flush = () => new Promise(resolve => setTimeout(resolve, 20));
    dispatch(7); dispatch(42, "group"); await flush();
    assert.equal(calls.filter((m: string) => m === "sendMessage").length, 0);
    dispatch(); await flush();
    assert.equal(calls.filter((m: string) => m === "sendMessage").length, 1);
    // Fence at effect execution, not only at admission.
    dispatch(); ctx.sessionManager.getSessionId = () => "other";
    await flush();
    assert.equal(current.options.ping(), undefined);
    assert.equal(calls.filter((m: string) => m === "sendMessage").length, 1);
    ctx.sessionManager.getSessionId = () => "main";
    await manager.disconnect(ctx);
    await manager.connect(bot, ctx, new AbortController().signal);
    assert.equal(current.options.ping(), undefined);
    dispatch(); await flush();
    assert.equal(calls.filter((m: string) => m === "sendMessage").length, 1);
    assert.equal(inputs, 0);
  }));

test("silent startup completes independently of slow menu APIs; disconnect aborts menu work", async () => {
  for (const slowMethod of ["setMyCommands", "setChatMenuButton"]) {
    await fixture(async ({ manager, bot, ctx, calls, warnings, handle, connected }: any) => {
      let entered!: () => void;
      const menuStarted = new Promise<void>(resolve => { entered = resolve; });
      let aborted = false;
      handle(async (method: string, signal: AbortSignal) => {
        if (method !== slowMethod) return undefined;
        entered();
        return new Promise<Response>((_resolve, reject) => {
          signal.addEventListener("abort", () => { aborted = true; reject(new Error("aborted")); }, { once: true });
        });
      });
      // The short deadline reproduces startup budget exhaustion without a 30s test.
      assert.equal(await manager.connect(bot, ctx, AbortSignal.timeout(1000)), true);
      await menuStarted;
      assert.ok(!calls.includes("sendMessage"));
      assert.equal(manager.isReady, true);
      assert.equal(connected(), 1);
      assert.ok(manager.connection);
      await manager.disconnect(ctx);
      await new Promise(resolve => setTimeout(resolve, 10));
      assert.equal(aborted, true);
      assert.deepEqual(warnings, [], "shutdown cancellation must not report a menu error on the replacement session");
    });
  }
});

test("menu failures warn locally without undoing a successful connection", async () =>
  fixture(async ({ manager, bot, ctx, handle, warnings, connected }: any) => {
    handle(async (method: string) => { if (method === "setMyCommands") throw new Error("offline"); });
    assert.equal(await manager.connect(bot, ctx, new AbortController().signal), true);
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(connected(), 1);
    assert.ok(manager.connection);
    assert.ok(warnings.some((text: string) => text.includes("command menu")));
  }));

test("an initializing connection is not ready and failed initialization releases it for retry", async () =>
  fixture(async ({ manager, bot, ctx, handle, calls, connected }: any) => {
    let entered!: () => void, fail!: () => void;
    const sending = new Promise<void>(resolve => { entered = resolve; });
    const release = new Promise<void>(resolve => { fail = resolve; });
    handle(async (method: string) => { if (method === "getWebhookInfo") { entered(); await release; throw new Error("offline"); } });
    const attempt = manager.connect(bot, ctx, new AbortController().signal);
    const rejected = assert.rejects(attempt, /getWebhookInfo failed/);
    await sending;
    assert.equal(await manager.connect(bot, ctx, new AbortController().signal), false);
    fail();
    await rejected;
    assert.equal(manager.connection, undefined);
    assert.equal(connected(), 0);
    assert.ok(!calls.includes("setMyCommands"));
    assert.ok(!calls.includes("sendMessage"));
    handle(async () => undefined);
    assert.equal(await manager.connect(bot, ctx, new AbortController().signal), true);
  }));

const waitFor = async (predicate: () => boolean) => {
  for (let i = 0; i < 300 && !predicate(); i++) await new Promise(resolve => setTimeout(resolve, 5));
  assert.ok(predicate(), "condition reached");
};

test("secret start and save outlive the completed startup deadline", async () => {
  for (const abortAt of ["before-start", "before-save"]) {
    await fixture(async ({ manager, bot, ctx, handle, ok }: any) => {
      const startup = new AbortController();
      await manager.connect(bot, ctx, AbortSignal.any([startup.signal, AbortSignal.timeout(30_000)]));
      const connection = manager.connection, secret = connection.options.secret;
      let prompt: any;
      const inputs: any[] = [];
      handle(async (method: string, _signal: AbortSignal, body: any) => {
        if (method === "sendMessage" && body.reply_markup?.force_reply) {
          prompt = { message_id: 123, text: body.text, chat: { id: 42, type: "private" }, from: { id: Number(bot.id), is_bot: true } };
          return ok({ message_id: 123 });
        }
      });
      const dispatch = (message: any) => connection.dispatch({ update_id: 1, message: {
        message_id: 300, chat: { id: 42, type: "private" }, from: { id: 42, is_bot: false }, ...message,
      } }, (m: any) => inputs.push(m), () => {}, () => "status", () => false);
      if (abortAt === "before-start") startup.abort(new DOMException("Startup deadline", "TimeoutError"));
      assert.equal(manager.isReady, true);
      assert.match(connection.options.ping(), /^Pong/);
      assert.equal(secret.current(), true);
      assert.equal(await secret.verify(), true);
      dispatch({ text: "ordinary text" });
      assert.equal(inputs.length, 1);
      dispatch({ text: "/secret dummy.txt" });
      await waitFor(() => connection.secret.flow?.phase === "awaiting");
      if (abortAt === "before-save") startup.abort(new DOMException("Startup deadline", "TimeoutError"));
      assert.equal(secret.current(), true);
      assert.equal(await secret.verify(), true);
      dispatch({ text: "DUMMY-deadline-only", reply_to_message: prompt });
      await waitFor(() => inputs.length === 2);
      assert.equal(await readFile(join(ctx.cwd, ".pi/telegram-secrets/dummy.txt"), "utf8"), "DUMMY-deadline-only");
      assert.equal(inputs[1].forceFollowUp, true);
      assert.ok(!JSON.stringify(inputs).includes("DUMMY-deadline-only"));
    });
  }
});

test("secret ownership still rejects changed sessions, assignments, leases and retired connections", async () =>
  fixture(async ({ manager, bot, ctx }: any) => {
    const lost = new AbortController();
    const lease = { botId: bot.id, sessionId: "main", projectPath: ctx.cwd, signal: lost.signal, release: async () => { lost.abort(); } };
    const startup = new AbortController();
    await manager.connect(bot, ctx, startup.signal, lease);
    startup.abort();
    const secret = manager.connection.options.secret;
    ctx.sessionManager.getSessionId = () => "other";
    assert.equal(secret.current(), false); assert.equal(await secret.verify(), false);
    ctx.sessionManager.getSessionId = () => "main";
    for (const changed of [{ sessionId: "other" }, { token: "changed-dummy" }, { ownerUserId: "43" }]) {
      await saveProjectSettings(ctx.cwd, { version: 2, bots: [{ ...bot, ...changed }] });
      assert.equal(await secret.verify(), false);
    }
    await saveProjectSettings(ctx.cwd, { version: 2, bots: [bot] });
    assert.equal(await secret.verify(), true);
    lost.abort();
    assert.equal(secret.current(), false); assert.equal(await secret.verify(), false);
    await manager.disconnect(ctx);
    assert.equal(secret.current(), false); assert.equal(await secret.verify(), false);
    await manager.connect(bot, ctx, new AbortController().signal);
    assert.equal(secret.current(), false); assert.equal(await secret.verify(), false);
    assert.equal(await manager.connection.options.secret.verify(), true);
  }));

test("startup cancellation before readiness tears down and cannot resurrect after a late API result", async () => {
  for (const cancel of ["deadline", "shutdown"]) {
    await fixture(async ({ manager, bot, ctx, handle, ok, connected }: any) => {
      const startup = new AbortController();
      let entered!: () => void, release!: () => void;
      const started = new Promise<void>(resolve => { entered = resolve; });
      const held = new Promise<void>(resolve => { release = resolve; });
      handle(async (method: string) => {
        if (method === "getWebhookInfo") { entered(); await held; return ok({ url: "" }); }
      });
      const attempt = manager.connect(bot, ctx, startup.signal);
      const rejected = assert.rejects(attempt);
      await started;
      const secret = manager.connection.options.secret;
      assert.equal(secret.current(), false); assert.equal(await secret.verify(), false);
      if (cancel === "deadline") startup.abort();
      else await manager.disconnect(ctx);
      release();
      await rejected;
      assert.equal(manager.isReady, false); assert.equal(manager.connection, undefined);
      assert.equal(connected(), 0);
      assert.equal(secret.current(), false); assert.equal(await secret.verify(), false);
      handle(async () => undefined);
      assert.equal(await manager.connect(bot, ctx, new AbortController().signal), true);
      assert.equal(secret.current(), false);
    });
  }
});
