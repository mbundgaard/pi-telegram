import assert from "node:assert/strict";
import test from "node:test";
import { registerCompactionNotices } from "../src/compaction-notices.ts";
import { TelegramSessionConnection } from "../src/telegram.ts";

const tick = () => new Promise<void>(resolve => setImmediate(resolve));
async function fixture(work: (f: any) => Promise<void>) {
  const original = globalThis.fetch;
  const sent: any[] = [], warnings: string[] = [];
  let ready = true, assigned = true, session = "one";
  let verification: (() => Promise<boolean>) | undefined;
  const connection = new TelegramSessionConnection("dummy", 42, { onDraftError: () => warnings.push("delivery failed"), canStop: () => false });
  let target = connection;
  const ctx = { sessionManager: { getSessionId: () => session }, isIdle: () => false };
  const handlers = new Map<string, Function>();
  const pi = { on: (name: string, handler: Function) => handlers.set(name, handler) };
  const notices = registerCompactionNotices(pi as any, () => ready ? target : undefined,
    async () => verification ? verification() : assigned);
  globalThis.fetch = (async (url, init) => {
    sent.push({ method: String(url).split("/").at(-1), ...JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify({ ok: true, result: { message_id: sent.length } }));
  }) as typeof fetch;
  const emit = (name: string, event: any = {}, context = ctx) => handlers.get(name)?.(event, context);
  try {
    await work({ sent, warnings, connection, ctx, handlers, notices, emit,
      ready: (value: boolean) => { ready = value; }, assigned: (value: boolean) => { assigned = value; },
      session: (value: string) => { session = value; }, target: (value: TelegramSessionConnection) => { target = value; },
      verify: (fn: () => Promise<boolean>) => { verification = fn; } });
  } finally { await connection.stop(); globalThis.fetch = original; }
}
const start = (reason = "threshold") => ({ reason, signal: new AbortController().signal,
  get preparation(): never { throw new Error("must not read context"); },
  get branchEntries(): never { throw new Error("must not read transcript"); } });

test("native compaction hooks notify automatic threshold/overflow and manual attempts while busy, without exposing content", async () =>
  fixture(async ({ emit, sent, handlers }: any) => {
    assert.deepEqual([...handlers.keys()], ["session_before_compact", "session_compact", "session_compact_failed", "session_start", "session_shutdown"]);
    for (const reason of ["threshold", "overflow", "manual"]) {
      assert.equal(emit("session_before_compact", start(reason)), undefined, "does not await Telegram or alter compaction");
      emit("session_compact", { get compactionEntry() { throw new Error("must not read summary"); } });
      await tick();
    }
    assert.equal(sent.length, 6);
    assert.ok(sent.every((s: any) => s.method === "sendMessage" && s.chat_id === 42));
    assert.deepEqual(sent.map((s: any) => s.text), Array(3).fill([
      "Context compaction starting. Pi may pause while it summarizes older context.", "Context compaction completed.",
    ]).flat());
  }));

test("failures and cancellations are generic, terminal events are paired and deduplicated; missing outcomes never imply success", async () =>
  fixture(async ({ emit, sent }: any) => {
    emit("session_compact_failed", { aborted: false }); // Preparation failure before our start.
    for (const aborted of [false, true]) {
      const event = start("manual");
      emit("session_before_compact", event); emit("session_before_compact", event);
      emit("agent_start"); await tick();
      assert.equal(sent.at(-1).text.includes("starting"), true);
      const failure = { aborted, get errorMessage() { throw new Error("must not read errors"); } };
      emit("session_compact_failed", failure); emit("session_compact_failed", failure); emit("session_compact");
      await tick();
      assert.equal(sent.at(-1).text, aborted ? "Context compaction cancelled." : "Context compaction failed.");
    }
    assert.equal(sent.length, 4);
    emit("session_before_compact", start()); await tick();
    emit("agent_start"); emit("agent_settled"); await tick();
    assert.equal(sent.length, 5);
    // A host missing a failure event must not permanently suppress the next attempt.
    emit("session_before_compact", start()); emit("session_compact"); await tick();
    assert.equal(sent.length, 7);
  }));

test("startup is silent; disconnected/unassigned starts and stale queued notices are suppressed", async () =>
  fixture(async ({ emit, sent, ready, assigned, notices, session }: any) => {
    emit("session_start"); await tick(); assert.equal(sent.length, 0);
    ready(false); emit("session_before_compact", start()); ready(true); emit("session_compact");
    await tick(); assert.equal(sent.length, 0);
    assigned(false); emit("session_before_compact", start()); emit("session_compact");
    await tick(); assert.equal(sent.length, 0);
    assigned(true); emit("session_before_compact", start()); notices.reset(); emit("session_compact");
    await tick(); assert.equal(sent.length, 0);
    emit("session_before_compact", start()); session("replacement"); emit("session_compact");
    await tick(); assert.equal(sent.length, 0);
    emit("session_before_compact", start()); emit("session_shutdown");
    await tick(); assert.equal(sent.length, 0);
  }));

test("connection replacement and session replacement during async verification fence both sides of the await", async () => {
  for (const mode of ["connection", "session", "shutdown"]) {
    await fixture(async ({ emit, sent, verify, target, session, ctx }: any) => {
      let release!: (value: boolean) => void;
      verify(() => new Promise<boolean>(resolve => { release = resolve; }));
      emit("session_before_compact", start()); await tick();
      if (mode === "connection") target({});
      if (mode === "session") session("new");
      if (mode === "shutdown") emit("session_shutdown");
      release(true); await tick();
      emit("session_compact", {}, { ...ctx, sessionManager: { getSessionId: () => "one" } });
      await tick(); assert.equal(sent.length, 0);
    });
  }
});

test("transport failures are supervised without retry, model input, or Stop authority", async () =>
  fixture(async ({ emit, sent, warnings, connection }: any) => {
    globalThis.fetch = (async () => { throw new Error("private transport detail"); }) as typeof fetch;
    emit("session_before_compact", start()); await tick();
    emit("session_compact"); await tick();
    assert.deepEqual(warnings, ["delivery failed"]);
    assert.equal(sent.length, 0);
    assert.equal(connection.options.canStop(), false);
    assert.equal(connection.workingStatus, undefined);
    assert.equal(connection.outboundDraft, undefined);
  }));
