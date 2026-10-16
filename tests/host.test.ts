import assert from "node:assert/strict";
import test from "node:test";

import {
  formatSessionPingMessage,
  formatSessionStatusMessage,
} from "../src/host.ts";

test("ping includes only project and captured running version on one line", () => {
  assert.equal(formatSessionPingMessage({ projectName: "Demo", version: "0.2.2" }),
    "Pong · Demo · v0.2.2");
});

test("formatSessionStatusMessage uses the status heading", () => {
  const message = formatSessionStatusMessage({
    projectName: "SampleProject",
    branch: "main",
    hostname: "workstation",
    ip: "192.168.1.20",
  });
  assert.match(message, /^Pi Telegram session status$/m);
  assert.match(message, /^Branch: main$/m);
  assert.match(message, /^Host: workstation \(192\.168\.1\.20\)$/m);
  assert.match(message, /^Normal messages: steer active Telegram work; new turn when idle$/m);
  assert.match(message, /^\/steer message: explicitly steer active work$/m);
  assert.match(message, /^Leading ! characters are literal text$/m);
  assert.match(message, /^Send stop: cancel the current Telegram task$/m);
});

test("ping handles an unavailable version explicitly", () => {
  assert.equal(formatSessionPingMessage({ projectName: "LooseFiles" }), "Pong · LooseFiles · vunknown");
});
