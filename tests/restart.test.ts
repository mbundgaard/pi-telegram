import assert from "node:assert/strict";
import test from "node:test";
import { RESTART_BUSY, RESTART_UNSUPPORTED, restartRefusal } from "../src/restart.ts";
import { TelegramSessionConnection } from "../src/telegram.ts";
import { RequestOrigins } from "../src/request-routing.ts";

const idle = { current: true, idle: true, pending: false, localPending: false, mode: "tui" };
const linuxHerdr = { platform: "linux", herdr: "1" };

test("restart refuses busy, queued, unknown-host and unsupported mode/platform without granting capability from markers", () => {
  assert.equal(restartRefusal(idle, linuxHerdr), RESTART_UNSUPPORTED);
  for (const patch of [{ idle: false }, { pending: true }, { localPending: true }])
    assert.equal(restartRefusal({ ...idle, ...patch }, linuxHerdr), RESTART_BUSY);
  assert.match(restartRefusal({ ...idle, pending: undefined }, linuxHerdr), /cannot verify pending work/);
  assert.match(restartRefusal({ ...idle, current: false }, linuxHerdr), /no longer ready/);
  for (const mode of ["rpc", "print", "json", undefined])
    assert.match(restartRefusal({ ...idle, mode }, linuxHerdr), /only a verified Linux/);
  for (const host of [{ platform: "win32", herdr: "1" }, { platform: "linux", herdr: undefined }])
    assert.match(restartRefusal(idle, host), /only a verified Linux/);
});

test("restart pending receipt guard includes not-yet-admitted input and resets without changing origin authority", () => {
  const origins = new RequestOrigins<object>();
  const destination = {};
  assert.equal(origins.hasPending, false);
  const content = origins.enqueue("work", destination);
  assert.equal(origins.hasPending, true);
  assert.equal(origins.current, undefined);
  origins.admit(content, "extension");
  assert.equal(origins.hasPending, true);
  assert.equal(origins.begin(content), destination);
  assert.equal(origins.hasPending, false);
  origins.enqueue("next", destination);
  origins.reset();
  assert.equal(origins.hasPending, false);
});

test("native restart is owner/private, refuses duplicates, and never invokes reload or model input", () => {
  const notices: string[] = [];
  let checks = 0;
  const connection = new TelegramSessionConnection("placeholder", 42, {
    restartRefusal: () => { checks++; return RESTART_UNSUPPORTED; },
  });
  const internal = connection as any;
  internal.sendControlNotice = (text: string) => notices.push(text);
  const dispatch = (text: string, owner = 42, type = "private") => internal.dispatch({ message: {
    message_id: 1, from: { id: owner }, chat: { id: owner, type }, text,
  } }, () => assert.fail("restart must not reach Pi input"), () => assert.fail("must not stop"), () => "status", () => assert.fail("must not reload"));
  dispatch("/restart", 13);
  dispatch("/restart", 42, "group");
  assert.equal(checks, 0);
  dispatch("/restart");
  dispatch("/restart");
  assert.equal(checks, 2);
  assert.deepEqual(notices, [RESTART_UNSUPPORTED, RESTART_UNSUPPORTED]);
  internal.incoming = {};
  dispatch("/restart");
  assert.equal(checks, 2);
  assert.equal(notices.at(-1), RESTART_BUSY);
  internal.incoming = undefined;
});

test("restart has no capability fallback and is not advertised in native menu or help", async () => {
  const connection = new TelegramSessionConnection("placeholder", 42);
  const internal = connection as any;
  const notices: string[] = [];
  internal.sendControlNotice = (text: string) => notices.push(text);
  internal.dispatch({ message: { message_id: 1, from: { id: 42 }, chat: { id: 42, type: "private" }, text: "/restart" } },
    () => assert.fail("no input"), () => {}, () => "", () => false);
  assert.deepEqual(notices, [RESTART_UNSUPPORTED]);
  let commands: any[] = [];
  internal.call = async (method: string, body: any) => { if (method === "setMyCommands") commands = body.commands; return true; };
  await connection.configureCommandMenu();
  assert.ok(!commands.some(command => command.command === "restart"));
  internal.dispatch({ message: { message_id: 2, from: { id: 42 }, chat: { id: 42, type: "private" }, text: "/help" } },
    () => assert.fail("no input"), () => {}, () => "", () => false);
  assert.doesNotMatch(notices.at(-1)!, /\/restart/);
  await connection.stop();
});
