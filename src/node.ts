import { readFileSync } from "node:fs";
import { createLeoClient } from "./friendly.js";
import type { LeoEndpointCXOptions } from "./types.js";

export type LeoClientFromPemFileOptions = Omit<LeoEndpointCXOptions, "privateKey"> & {
  encoding?: BufferEncoding;
};

export function createLeoClientFromPemFile(
  tokenPem = "./token.pem",
  options: LeoClientFromPemFileOptions = {},
) {
  const { encoding = "utf8", ...clientOptions } = options;
  const privateKey = readFileSync(tokenPem, encoding);
  return createLeoClient({ ...clientOptions, privateKey });
}
