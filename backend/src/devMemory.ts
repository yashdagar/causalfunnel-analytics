import { MongoMemoryServer } from "mongodb-memory-server";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri("causalfunnel");
console.log(`In-memory MongoDB at ${process.env.MONGODB_URI}`);

process.on("exit", () => void mongo.stop());
await import("./server.js");
