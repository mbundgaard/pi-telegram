import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { reloadIntents } from "../src/reload-intent.ts";

test("reload handoff is fresh-generation, exact identity, one-use and bounded", t => {
  let now = 100;
  t.mock.method(performance, "now", () => now);
  const manager = {};
  const old = reloadIntents();
  const id = old.arm("project/session/bot/owner/credential", manager)!;
  assert.ok(id);
  assert.equal(old.arm("other", manager), undefined);
  old.shutdown("reload");
  const fresh = reloadIntents();
  assert.equal(fresh.start("reload", {}), undefined);
  assert.equal(fresh.start("reload", manager), id);
  old.cancel(id); // Returning old command cannot cancel a claimed successor.
  const valid = fresh.consume(id, "project/session/bot/owner/credential", manager)!;
  assert.equal(valid(), true);
  assert.equal(fresh.consume(id, "project/session/bot/owner/credential", manager), undefined);
  now += 30_000;
  assert.equal(valid(), false);
});

test("no intent, wrong identity, expiry, non-reload and same-factory starts never acknowledge", t => {
  let now = 100;
  t.mock.method(performance, "now", () => now);
  assert.equal(reloadIntents().start("reload", {}), undefined);
  for (const reason of ["startup", "resume", "new", "fork", undefined]) {
    const manager = {}, old = reloadIntents();
    old.arm("identity", manager);
    old.shutdown("reload");
    assert.equal(reloadIntents().start(reason, manager), undefined);
  }
  {
    const manager = {}, old = reloadIntents();
    old.arm("identity", manager); old.shutdown("reload");
    assert.equal(old.start("reload", manager), undefined);
  }
  for (const failure of ["identity", "expiry", "cancel", "shutdown"]) {
    const manager = {}, old = reloadIntents(), fresh = reloadIntents();
    const id = old.arm("identity", manager)!;
    old.shutdown(failure === "shutdown" ? "resume" : "reload");
    if (failure === "expiry") now += 30_001;
    if (failure === "cancel") old.cancel(id);
    const claim = fresh.start("reload", manager);
    if (failure === "identity") {
      assert.equal(claim, id);
      assert.equal(fresh.consume(id, "wrong", manager), undefined);
      assert.equal(fresh.consume(id, "identity", manager), undefined);
    } else assert.equal(claim, undefined);
  }
});
