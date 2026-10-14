import { MongoClient, type Collection, type Db } from "mongodb";
import type { EventDoc, SessionDoc } from "./types.js";

export interface Store {
  db: Db;
  events: Collection<EventDoc>;
  sessions: Collection<SessionDoc>;
}

export function createStore(db: Db): Store {
  return {
    db,
    events: db.collection<EventDoc>("events"),
    sessions: db.collection<SessionDoc>("sessions"),
  };
}

export async function ensureIndexes(store: Store): Promise<void> {
  await Promise.all([
    store.events.createIndex({ event_id: 1 }, { unique: true }),
    store.events.createIndex({ session_id: 1, timestamp: 1 }),
    store.events.createIndex({ url: 1, type: 1, device: 1, timestamp: -1 }),
    store.sessions.createIndex({ last_seen: -1 }),
  ]);
}

export async function connect(uri: string): Promise<{ client: MongoClient; store: Store }> {
  const client = new MongoClient(uri);
  await client.connect();
  const store = createStore(client.db());
  await ensureIndexes(store);
  return { client, store };
}
