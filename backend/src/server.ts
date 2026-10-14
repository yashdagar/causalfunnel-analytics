import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { connect } from "./db.js";

const config = loadConfig();
const { client, store } = await connect(config.mongoUri);
const server = createApp(store, config).listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => void client.close().then(() => process.exit(0)));
  });
}
