export const BLOCKS_API_URL = process.env.NEXT_PUBLIC_BLOCKS_API_URL!;
export const BLOCKS_PROJECT_KEY = process.env.NEXT_PUBLIC_BLOCKS_PROJECT_KEY!;

/**
 * The DMS/storage service (`/files/*`, `/directory/*`, `/objects/*`) has two homes for
 * this project:
 *  - "local" — a standalone local instance (`NEXT_PUBLIC_BLOCKS_STORAGE_API_URL`,
 *    default `http://localhost:9000`), base path `/api`.
 *  - "live" — fronted by the main Blocks gateway, same host as IAM
 *    (`NEXT_PUBLIC_BLOCKS_API_URL`), base path `/data/v4`.
 * Toggle with `NEXT_PUBLIC_BLOCKS_STORAGE_MODE` — defaults to "local".
 */
const STORAGE_MODE = process.env.NEXT_PUBLIC_BLOCKS_STORAGE_MODE === "live" ? "live" : "local";

export const BLOCKS_STORAGE_API_URL =
  STORAGE_MODE === "live" ? BLOCKS_API_URL : process.env.NEXT_PUBLIC_BLOCKS_STORAGE_API_URL || "http://localhost:9000";

export const BLOCKS_STORAGE_BASE_PATH = STORAGE_MODE === "live" ? "/data/v4" : "/api";
