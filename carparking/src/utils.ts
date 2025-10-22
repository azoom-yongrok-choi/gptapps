import type {
  ParkingResponseType,
  ParkingInfoType,
  LoadParams,
  Context,
} from "./type.js";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { LRUCache } from "lru-cache";
import { camelCase } from "scule";

export const getParkingInfo = (
  parking: ParkingResponseType
): ParkingInfoType => {
  return {
    id: parking.id,
    region: parking.region,
    updatedAt: parking.updatedAt,
    status: parking.status,
    isVisible: parking.isVisible,
    address: parking.address,
    spaces: parking.spaces,
    prefecture: parking.prefecture,
    city: parking.city,
    nearbyStations: parking.nearbyStations,
    name: parking.name,
    location: parking.location,
  };
};

//
export function jsonResponse<T extends (...args: any) => Promise<any>>(fn: T) {
  return async (...args: Parameters<T>): Promise<string> => {
    const result = await fn(...args);
    return JSON.stringify(result, null, 2);
  };
}

export function createDataSetId(params: LoadParams) {
  return createHash("sha256")
    .update(JSON.stringify(params))
    .digest("base64url")
    .slice(0, 22);
}

export function keysToCamel(o: any): any {
  if (Array.isArray(o)) {
    return o.map((v) => keysToCamel(v));
  }
  if (o && typeof o === "object") {
    return Object.keys(o).reduce((acc, key) => {
      const newKey = camelCase(key);
      const value = o[key];
      acc[newKey] = keysToCamel(value);
      return acc;
    }, {} as any);
  }
  return o;
}

// LRU cache helpers
export interface CacheOptions {
  compress?: boolean;
  ttlMs?: number;
}

const COMPRESSED_PREFIX = "gz:";

export function ensureLRU(
  holder: Record<string, any>,
  prop: string,
  options?: { max?: number }
): LRUCache<string, any> {
  const existing = holder[prop];
  if (existing instanceof LRUCache) return existing as LRUCache<string, any>;
  const cache = new LRUCache<string, any>({ max: options?.max ?? 100 });
  holder[prop] = cache;
  return cache;
}

export function setCacheLRU(
  cache: LRUCache<string, any>,
  key: string,
  data: unknown,
  options?: CacheOptions
): void {
  const compress = options?.compress === true;
  const ttlMs = options?.ttlMs;
  const value = compress
    ? `${COMPRESSED_PREFIX}${gzipSync(
        Buffer.from(JSON.stringify(data), "utf-8")
      ).toString("base64")}`
    : data;
  cache.set(key, value, { ttl: ttlMs });
}

export function getCacheLRU<T>(
  cache: LRUCache<string, any>,
  key: string,
  options?: CacheOptions
): T | undefined {
  const entry = cache.get(key);
  if (entry === undefined) return undefined;
  // Auto-detect compressed payload by prefix; fallback to options.compress for backward compatibility
  if (typeof entry === "string") {
    if (entry.startsWith(COMPRESSED_PREFIX)) {
      const b64 = entry.slice(COMPRESSED_PREFIX.length);
      const json = gunzipSync(Buffer.from(b64, "base64")).toString("utf-8");
      return JSON.parse(json) as T;
    }
    if (options?.compress === true) {
      // backward compatibility if older entries lack prefix
      try {
        const json = gunzipSync(Buffer.from(entry, "base64")).toString("utf-8");
        return JSON.parse(json) as T;
      } catch {
        // not actually compressed; fall through
      }
    }
  }
  return entry as T;
}

// Wrapper helpers that hide ensureLRU from callers
export function setCache(
  holder: Record<string, any>,
  prop: string,
  key: string,
  data: unknown,
  options?: CacheOptions
): void {
  const cache = ensureLRU(holder, prop);
  setCacheLRU(cache, key, data, options);
}

export function getCache<T>(
  holder: Record<string, any>,
  prop: string,
  key: string,
  options?: CacheOptions
): T | undefined {
  const cache = ensureLRU(holder, prop);
  return getCacheLRU<T>(cache, key, options);
}

// Session-aware helpers (accept Context-like object with optional session)
function ensureSession(holder: Context): Record<string, any> {
  if (!holder.session) holder.session = {};
  return holder.session;
}

export function setSessionCache(
  context: Context,
  prop: string,
  key: string,
  data: unknown,
  options?: CacheOptions
): void {
  const session = ensureSession(context);
  setCache(session, prop, key, data, options);
}

export function getSessionCache<T>(
  context: Context,
  prop: string,
  key: string,
  options?: CacheOptions
): T | undefined {
  const session = ensureSession(context);
  return getCache<T>(session, prop, key, options);
}
