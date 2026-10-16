import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

// Deliberately process-owned, not Pi session state or a module-cache assumption.
// No credentials, environment state, files, timers, or child-process inheritance.
const namespace = Symbol.for("@comput/pi-telegram/reload-intents/v1");
interface Intent {
  id: string; generation: string; successor?: string; identity: string;
  manager: object; expires: number; transferred: boolean;
}
const host = globalThis as typeof globalThis & { [namespace]?: Map<string, Intent> };
const intents = host[namespace] ??= new Map<string, Intent>();
const prune = () => {
  for (const [id, intent] of intents) if (performance.now() >= intent.expires) intents.delete(id);
};

export function reloadIntents() {
  const generation = randomUUID();
  return {
    arm(identity: string, manager: object): string | undefined {
      prune();
      if (intents.size >= 32 || [...intents.values()].some(i => i.manager === manager)) return undefined;
      const id = randomUUID();
      intents.set(id, { id, generation, identity, manager, expires: performance.now() + 30_000, transferred: false });
      return id;
    },
    cancel(id: string) { if (intents.get(id)?.generation === generation && !intents.get(id)?.successor) intents.delete(id); },
    shutdown(reason: string | undefined) {
      prune();
      for (const [id, i] of intents) if (i.generation === generation) {
        if (reason === "reload") i.transferred = true;
        else intents.delete(id);
      }
    },
    start(reason: string | undefined, manager: object): string | undefined {
      prune();
      for (const [id, i] of intents) if (i.manager === manager) {
        if (reason === "reload" && i.transferred && i.generation !== generation && !i.successor) {
          i.successor = generation;
          return id;
        }
        intents.delete(id);
      }
      return undefined;
    },
    consume(id: string, identity: string, manager: object): (() => boolean) | undefined {
      prune();
      const i = intents.get(id);
      if (!i || i.successor !== generation) return undefined;
      intents.delete(id); // Consume before delivery, including uncertain failure.
      if (i.identity !== identity || i.manager !== manager) return undefined;
      return () => performance.now() < i.expires;
    },
    discard(id: string) {
      const i = intents.get(id);
      if (i?.successor === generation) intents.delete(id);
    },
  };
}
