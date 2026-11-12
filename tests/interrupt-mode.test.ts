import test from "node:test";
import assert from "node:assert/strict";
import { InterruptMode } from "../src/interrupt-mode.ts";
import { TelegramSessionConnection } from "../src/telegram.ts";

test("interrupt is explicitly enabled and resets off with its connection", () => {
  const mode = new InterruptMode<object>();
  assert.equal(mode.enabled, false);
  assert.match(mode.configure(), /off/);
  assert.match(mode.configure("on"), /on for this connection/);
  assert.equal(mode.enabled, true);
  assert.match(mode.configure("invalid"), /Use/);
  assert.equal(mode.enabled, true);
  mode.add({}, "one");
  const pending = mode.pending!;
  mode.reset();
  assert.equal(mode.enabled, false);
  assert.equal(mode.pending, undefined);
  assert.equal(pending.cancellation.signal.aborted, true);
});

test("native interrupt toggle accepts only the private owner and never enters model input", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }))) as typeof fetch;
  const changes: Array<string | undefined> = [], inputs: unknown[] = [];
  const connection = new TelegramSessionConnection("dummy", 42, { interruptMode: arg => { changes.push(arg); return "status"; } });
  try {
    let id = 0;
    const dispatch = (user: number, type: string, text: string) => (connection as any).dispatch({ message: {
      message_id: ++id, from: { id: user, is_bot: false }, chat: { id: 42, type }, text,
    } }, (input: unknown) => inputs.push(input), () => {}, () => "status", () => false);
    dispatch(99, "private", "/interrupt on");
    dispatch(42, "group", "/interrupt on");
    dispatch(42, "private", "/interrupt");
    dispatch(42, "private", "/interrupt on");
    dispatch(42, "private", "/interrupt off");
    assert.deepEqual(changes, [undefined, "on", "off"]);
    assert.deepEqual(inputs, []);
  } finally { await connection.stop(); globalThis.fetch = original; }
});

test("pending interruption collects bounded messages in order without replacing earlier corrections", () => {
  const mode = new InterruptMode<object>(); const target = {};
  assert.equal(mode.add(target, "one"), "start");
  assert.equal(mode.add(target, "two"), "added");
  assert.deepEqual(mode.pending!.texts, ["one", "two"]);
  assert.equal(mode.add({}, "wrong connection"), "full");
  for (let i = 2; i < 8; i++) assert.equal(mode.add(target, String(i)), "added");
  assert.equal(mode.add(target, "overflow"), "full");
  mode.clear();
  mode.add(target, "x".repeat(32768));
  assert.equal(mode.add(target, "overflow"), "full");
  const request = mode.pending!;
  mode.configure("off");
  assert.equal(request.cancellation.signal.aborted, true);
  assert.equal(mode.pending, undefined);
});
