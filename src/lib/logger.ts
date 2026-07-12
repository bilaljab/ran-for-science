import pino from "pino";

// Structured JSON to stdout only — Vercel's own logs dashboard ingests
// stdout/stderr automatically, so no transport/destination config is needed
// here. `base: undefined` drops the default pid/hostname fields, which are
// redundant with metadata Vercel already attaches to each log line.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  base: undefined,
});
