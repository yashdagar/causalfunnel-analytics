export interface Config {
  port: number;
  mongoUri: string;
  corsOrigins: string[] | "*";
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const origins = (env.CORS_ORIGINS ?? "*").trim();
  return {
    port: Number(env.PORT ?? 4000),
    mongoUri: env.MONGODB_URI ?? "mongodb://localhost:27017/causalfunnel",
    corsOrigins: origins === "*" ? "*" : origins.split(",").map((origin) => origin.trim()),
  };
}
