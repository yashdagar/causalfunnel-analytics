import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { createStore, ensureIndexes, type Store } from "../src/db.js";

export function useTestApp() {
  const context = {} as { app: ReturnType<typeof createApp>; store: Store; api: () => ReturnType<typeof request> };
  let mongo: MongoMemoryServer;
  let client: MongoClient;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    client = await MongoClient.connect(mongo.getUri());
    context.store = createStore(client.db("test"));
    context.app = createApp(context.store, { corsOrigins: "*" });
    context.api = () => request(context.app);
  });

  beforeEach(async () => {
    await context.store.db.dropDatabase();
    await ensureIndexes(context.store);
  });

  afterAll(async () => {
    await client?.close();
    await mongo?.stop();
  });

  return context;
}

let counter = 0;

export function pageView(overrides: Record<string, unknown> = {}) {
  counter += 1;
  return {
    id: `event-${counter.toString().padStart(6, "0")}`,
    session_id: "session-aaaa",
    type: "page_view",
    url: "https://shop.test/demo/",
    timestamp: new Date(Date.UTC(2026, 9, 5, 10, 0, counter)).toISOString(),
    viewport: { width: 1280, height: 800 },
    document: { width: 1280, height: 2400 },
    ...overrides,
  };
}

export function click(overrides: Record<string, unknown> = {}) {
  return pageView({ type: "click", x: 100, y: 200, target: { tag: "button", text: "Add to cart" }, ...overrides });
}
