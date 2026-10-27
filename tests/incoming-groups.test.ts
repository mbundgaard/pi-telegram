import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, truncate, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { IncomingGroups, type IncomingItem } from "../src/incoming-groups.ts";
import { receiveAttachmentBatch, receiveProjectAttachment, INBOX_BYTE_LIMIT, INBOX_FILE_LIMIT } from "../src/incoming-files.ts";
import { TelegramSessionConnection, type TelegramInboundMessage } from "../src/telegram.ts";

const tick = () => new Promise<void>(r => setImmediate(r));
const wait = (ms = 30) => new Promise<void>(r => setTimeout(r, ms));
function deferred() { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r; }); return { promise, resolve }; }
const item = (id: number, text = ""): IncomingItem => ({ messageId: id, text, attachment: { fileId: `id${id}`, fileName: `file${id}.txt`, kind: "document" } });

test("groups arriving during download queue independently, retain captions, and deduplicate message IDs", async () => {
  const held = deferred(), batches: IncomingItem[][] = [], notices: string[] = [];
  const queue = new IncomingGroups(async items => { batches.push(items); if (batches.length === 1) await held.promise; }, text => notices.push(text), 10, 40);
  queue.add(item(1)); await tick();
  queue.add(item(2, "/stop is a caption"), "a"); queue.add(item(2), "a");
  queue.add(item(3), "b"); queue.add(item(4, "review both"), "a");
  await wait(); assert.equal(batches.length, 1); assert.equal(queue.busy, true);
  held.resolve(); await wait();
  assert.deepEqual(batches.map(b => b.map(i => i.messageId)), [[1], [2, 4], [3]]);
  assert.equal(batches[1]![0]!.text, "/stop is a caption");
  queue.add(item(5), "a"); assert.match(notices[0]!, /already closed/);
  assert.equal(queue.busy, false);
});

test("queue caps groups and files including running work; group collection has a maximum window", async () => {
  const held = deferred(), notices: string[] = [], batches: IncomingItem[][] = [];
  const queue = new IncomingGroups(async items => { batches.push(items); await held.promise; }, t => notices.push(t), 100, 25);
  for (let i = 1; i <= 11; i++) queue.add(item(i), "a");
  for (let i = 12; i <= 21; i++) queue.add(item(i), "b");
  for (let i = 22; i <= 31; i++) queue.add(item(i), "c");
  queue.add(item(32), "d");
  assert.equal(notices.length, 2); await wait(40);
  assert.equal(batches[0]!.length, 10); // max window, not the quiet window
  queue.cancel(); held.resolve(); await tick();
  assert.equal(batches.length, 1); assert.equal(queue.busy, false);
  const second = new IncomingGroups(async () => { await held.promise; }, t => notices.push(t), 100, 100);
  for (let i = 40; i < 45; i++) second.add(item(i), String(i));
  assert.equal(notices.length, 3); second.cancel();
});

test("cancel clears collecting/queued groups and aborts running work without reviving old groups", async () => {
  const held = deferred(); let signal: AbortSignal | undefined; const batches: IncomingItem[][] = [];
  const queue = new IncomingGroups(async (items, s) => { batches.push(items); signal = s; await held.promise; }, () => {}, 10, 40);
  queue.add(item(1)); await tick(); queue.add(item(2), "old"); queue.cancel();
  assert.equal(signal!.aborted, true); held.resolve(); await wait(); assert.equal(batches.length, 1);
  queue.add(item(3), "old"); await wait(); assert.equal(batches.length, 1);
  queue.add(item(4), "new"); await wait(); assert.equal(batches.length, 2);
});

test("combined receipt identifies partial failures and captions; all-failed and cancelled groups have no receipt", async () => {
  const result = await receiveAttachmentBatch([item(1, "/reload"), item(2), item(3)], new AbortController().signal, async i => {
    if (i.attachment.fileId === "id2") throw new Error("private failure detail");
    return { path: `.pi/telegram-inbox/${i.attachment.fileName}`, size: 7 };
  });
  assert.equal(result.saved, 2); assert.equal(result.failed, 1);
  assert.match(result.request!, /File 2.*FAILED/); assert.match(result.request!, /User caption for file 1:\n\/reload/);
  assert.match(result.request!, /not Telegram commands/); assert.doesNotMatch(result.request!, /private failure detail/);
  const captionless = await receiveAttachmentBatch([item(1), item(2)], new AbortController().signal, async () => ({ path: "dummy", size: 1 }));
  assert.match(captionless.request!, /do not inspect or modify/);
  const failed = await receiveAttachmentBatch([item(1), item(2)], new AbortController().signal, async () => { throw new Error(); });
  assert.equal(failed.request, undefined); assert.equal(failed.failed, 2);
  const controller = new AbortController(); let calls = 0;
  await assert.rejects(receiveAttachmentBatch([item(1), item(2)], controller.signal, async () => { calls++; controller.abort(); return { path: "saved-before-stop", size: 1 }; }));
  assert.equal(calls, 1);
});

test("sequential batch saves enforce remaining inbox file and byte quotas", async () => {
  for (const quota of ["files", "bytes"]) {
    const cwd = await mkdtemp(join(tmpdir(), "pi-group-quota-"));
    const inbox = join(cwd, ".pi", "telegram-inbox");
    const signal = new AbortController().signal;
    try {
      await mkdir(inbox, { recursive: true });
      if (quota === "files") {
        for (let i = 0; i < INBOX_FILE_LIMIT - 1; i++) await writeFile(join(inbox, `existing-${i}`), "");
      } else {
        await writeFile(join(inbox, "existing"), "");
        await truncate(join(inbox, "existing"), INBOX_BYTE_LIMIT - 5);
      }
      let downloads = 0;
      const result = await receiveAttachmentBatch([item(1), item(2)], signal, i =>
        receiveProjectAttachment(cwd, i.attachment, signal, async () => { downloads++; return new Response("hello"); }));
      assert.equal(result.saved, 1); assert.equal(result.failed, 1); assert.equal(downloads, 1);
      assert.ok(!(await readdir(inbox)).some(name => name.endsWith(".part")));
    } finally { await rm(cwd, { recursive: true, force: true }); }
  }
});

test("Stop suppresses late running failures and queued receipts, then permits fresh work", async () => {
  const held = deferred(), received: number[] = [], notices: string[] = [];
  const queue = new IncomingGroups(async (items, signal) => {
    if (items[0]!.messageId === 1) { await held.promise; signal.throwIfAborted(); }
    received.push(items[0]!.messageId);
  }, text => notices.push(text), 10, 40);
  queue.add(item(1)); await tick(); queue.add(item(2), "queued"); queue.cancel();
  held.resolve(); await wait();
  assert.deepEqual(received, []); assert.deepEqual(notices, []);
  queue.add(item(3)); await tick(); assert.deepEqual(received, [3]);
});

const base = { chat: { id: 42, type: "private" }, from: { id: 42, is_bot: false } };
function dispatch(c: TelegramSessionConnection, message: unknown, input: (m: TelegramInboundMessage) => void | Promise<void>) {
  (c as any).dispatch({ update_id: 1, message }, input, () => {}, () => "status", () => false);
}
test("transport authenticates grouped media, keeps text independent, and blocks secret intake while collecting", async () => {
  const original = globalThis.fetch; const notices: string[] = [];
  globalThis.fetch = (async (_url, init) => { notices.push(JSON.parse(String(init?.body)).text ?? ""); return new Response(JSON.stringify({ ok: true, result: { message_id: 99 } })); }) as typeof fetch;
  const c = new TelegramSessionConnection("dummy", 42, { botId: 777, secret: { cwd: "/unused-fixture", current: () => true, verify: async () => true } }); const received: TelegramInboundMessage[] = [];
  const input = (m: TelegramInboundMessage) => { received.push(m); };
  const file = { ...base, message_id: 1, media_group_id: "album", document: { file_id: "a" }, caption: "/stop" };
  try {
    dispatch(c, { ...file, from: { id: 7, is_bot: false } }, input);
    dispatch(c, { ...file, chat: { id: 42, type: "group" } }, input);
    dispatch(c, { ...file, from: { id: 42, is_bot: true } }, input);
    assert.equal((c as any).incoming, undefined);
    dispatch(c, file, input); dispatch(c, file, input);
    dispatch(c, { ...base, message_id: 2, media_group_id: "album", photo: [{ file_id: "small", width: 1, height: 1 }, { file_id: "large", width: 10, height: 10 }], caption: "review" }, input);
    dispatch(c, { ...base, message_id: 3, text: "ordinary text" }, input);
    dispatch(c, { ...base, message_id: 4, text: "/secret" }, input);
    assert.deepEqual(received.map(m => m.text), ["ordinary text"]);
    await wait(850);
    assert.equal(received.length, 2); assert.equal(received[1]!.attachments!.length, 2);
    assert.equal(received[1]!.attachments![1]!.attachment.fileId, "large");
    assert.equal(received[1]!.attachments![0]!.text, "/stop");
    assert.ok(notices.some(n => /download/i.test(n)));
  } finally { await c.stop(); globalThis.fetch = original; }
});

test("transport Stop cancels running and collected groups without late failure notices", async () => {
  const original = globalThis.fetch, notices: string[] = [], received: TelegramInboundMessage[] = [];
  globalThis.fetch = (async (_url, init) => { notices.push(JSON.parse(String(init?.body)).text ?? ""); return new Response(JSON.stringify({ ok: true, result: { message_id: 99 } })); }) as typeof fetch;
  const c = new TelegramSessionConnection("dummy", 42), held = deferred();
  const input = async (m: TelegramInboundMessage) => { received.push(m); await held.promise; m.downloadSignal!.throwIfAborted(); };
  try {
    dispatch(c, { ...base, message_id: 1, document: { file_id: "one" } }, input); await tick();
    dispatch(c, { ...base, message_id: 2, media_group_id: "waiting", document: { file_id: "two" } }, input);
    dispatch(c, { ...base, message_id: 3, text: "/stop" }, input);
    held.resolve(); await wait(850);
    assert.equal(received.length, 1); assert.equal(received[0]!.downloadSignal!.aborted, true);
    assert.ok(notices.some(n => /cancellation requested/.test(n)));
    assert.ok(!notices.some(n => /failed|timed out/.test(n)));
    assert.equal((c as any).incoming, undefined);
  } finally { held.resolve(); await c.stop(); globalThis.fetch = original; }
});

test("disconnect cancels collecting groups; replacement receives only its own updates", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true, result: true }))) as typeof fetch;
  const old = new TelegramSessionConnection("dummy", 42), next = new TelegramSessionConnection("dummy", 42);
  const received: TelegramInboundMessage[] = [], input = (m: TelegramInboundMessage) => { received.push(m); };
  try {
    const file = { ...base, message_id: 1, media_group_id: "album", document: { file_id: "a" } };
    dispatch(old, file, input); await old.stop();
    dispatch(next, file, input); await wait(850);
    assert.equal(received.length, 1); assert.equal(received[0]!.downloadSignal!.aborted, false);
  } finally { await old.stop(); await next.stop(); globalThis.fetch = original; }
});
