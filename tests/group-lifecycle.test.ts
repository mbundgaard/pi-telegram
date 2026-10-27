import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import extension from "../src/index.ts";
import { saveProjectSettings } from "../src/config.ts";
import { INCOMING_FILE_LIMIT } from "../src/incoming-files.ts";

test("registered group reception saves successful files once and emits one authenticated follow-up with partial failure", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "pi-group-lifecycle-"));
  const previous = globalThis.fetch, settings = process.env.PI_TELEGRAM_SETTINGS;
  process.env.PI_TELEGRAM_SETTINGS = join(cwd, "global", "settings.json");
  const handlers = new Map<string, Array<(event: any, ctx: any) => any>>();
  const tools = new Map<string, any>(); const sent: string[] = [], deliveries: unknown[] = [], downloads: string[] = [];
  const ctx = { cwd, mode: "tui", hasUI: true, isIdle: () => true, hasPendingMessages: () => false,
    sessionManager: { getSessionId: () => "group-session", getBranch: () => [] },
    ui: { notify() {}, setStatus() {}, theme: { fg: (_c: string, t: string) => t } },
  } as unknown as ExtensionContext;
  extension({
    on: (name: string, fn: any) => handlers.set(name, [...(handlers.get(name) ?? []), fn]),
    registerCommand() {}, registerTool: (tool: any) => tools.set(tool.name, tool),
    sendUserMessage: (content: string, options: unknown) => { sent.push(content); deliveries.push(options); },
  } as unknown as ExtensionAPI);
  const emit = async (name: string, event = {}) => { for (const fn of handlers.get(name) ?? []) await fn(event, ctx); };
  let poll = 0;
  const base = { chat: { id: 42, type: "private" }, from: { id: 42, is_bot: false }, media_group_id: "group1" };
  const incoming = [
    { update_id: 1, message: { ...base, message_id: 1, caption: "/stop", document: { file_id: "one", file_size: 5, file_name: "one.txt" } } },
    { update_id: 2, message: { ...base, message_id: 2, document: { file_id: "too-big", file_size: INCOMING_FILE_LIMIT + 1, file_name: "big.txt" } } },
    { update_id: 3, message: { ...base, message_id: 3, document: { file_id: "three", file_size: 5, file_name: "three.txt" } } },
  ];
  globalThis.fetch = (async (url, init) => {
    const ok = (result: unknown) => new Response(JSON.stringify({ ok: true, result }));
    if (String(url).startsWith("https://registry.npmjs.org/")) return new Response(JSON.stringify({ name: "@comput/pi-telegram", version: "0.0.0" }));
    if (String(url).startsWith("https://api.telegram.org/file/")) { downloads.push(String(url).split("/").at(-1)!); return new Response("hello"); }
    const method = String(url).split("/").at(-1), body = JSON.parse(String(init?.body ?? "{}"));
    if (method === "getMe") return ok({ id: 111, is_bot: true, username: "Example111Bot" });
    if (method === "getWebhookInfo") return ok({ url: "" });
    if (method === "getFile") return ok({ file_path: `documents/${body.file_id}.txt`, file_size: 5 });
    if (method !== "getUpdates") return ok({ message_id: 99 });
    if (body.offset === -1) return ok([]);
    if (poll++ === 0) return ok(incoming);
    return new Promise<Response>((_resolve, reject) => { if (init?.signal?.aborted) reject(new Error("aborted")); else init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true }); });
  }) as typeof fetch;
  try {
    await saveProjectSettings(cwd, { version: 2, bots: [{ id: "111", username: "Example111Bot", token: "dummy-group-token", ownerUserId: "42", managed: false, sessionId: "group-session" }] });
    await emit("session_start");
    for (let i = 0; i < 300 && !sent.length; i++) await new Promise(r => setTimeout(r, 10));
    assert.equal(sent.length, 1); assert.match(sent[0]!, /2 saved, 1 failed/);
    assert.match(sent[0]!, /User caption for file 1:\n\/stop/);
    assert.deepEqual(deliveries, [{ deliverAs: "followUp" }]);
    assert.deepEqual(downloads, ["one.txt", "three.txt"]);
    assert.equal((await readdir(join(cwd, ".pi", "telegram-inbox"))).filter(n => n !== ".gitignore").length, 2);
    // Origin admission still requires the actual authenticated input event; no direct tool authority is fabricated.
    const input = handlers.get("input")![0]!;
    await input({ text: sent[0], source: "extension", images: [] }, ctx);
    const sendFile = () => tools.get("telegram_send_file").execute("test", { path: "public.txt" }, undefined, undefined, ctx);
    await assert.rejects(sendFile(), /current Telegram-originated request/);
    await emit("message_start", { message: { role: "user", content: sent[0] } });
    // Once begun it reaches file validation rather than the origin guard.
    await assert.rejects(sendFile(), error => error instanceof Error && !/current Telegram-originated request/.test(error.message));
  } finally {
    await emit("session_shutdown"); globalThis.fetch = previous;
    if (settings === undefined) delete process.env.PI_TELEGRAM_SETTINGS; else process.env.PI_TELEGRAM_SETTINGS = settings;
    await rm(cwd, { recursive: true, force: true });
  }
});
