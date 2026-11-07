import assert from "node:assert/strict";
import test from "node:test";
import { withTelegramUsername } from "../src/session-label.ts";

test("Telegram appends only its username to the existing session name", () => {
  assert.equal(withTelegramUsername("Coordinator", "ExampleBot"), "Coordinator • @ExampleBot");
  assert.equal(withTelegramUsername("Worker • custom name", "ExampleBot"), "Worker • custom name • @ExampleBot");
  assert.equal(withTelegramUsername(undefined, "ExampleBot"), "@ExampleBot");
  assert.equal(withTelegramUsername("", "ExampleBot"), "@ExampleBot");
});

test("reload does not duplicate an existing username in either order", () => {
  for (const name of ["@ExampleBot", "Coordinator • @ExampleBot", "@ExampleBot • Coordinator"]) {
    assert.equal(withTelegramUsername(name, "ExampleBot"), name);
  }
  assert.equal(withTelegramUsername("Coordinator • @ExampleBotExtra", "ExampleBot"), "Coordinator • @ExampleBotExtra • @ExampleBot");
});
