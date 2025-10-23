import type { Context, LoadParams, SimpleParking } from "./type.js";
import { env } from "node:process";
import { BigQuery } from "@google-cloud/bigquery";
import {
  createDataSetId,
  getSessionCache,
  keysToCamel,
  setSessionCache,
} from "./utils.js";
import dotenv from "dotenv";
dotenv.config();

const bigquery = new BigQuery();

async function findParkingsByGeoCircle(
  geoCircle: LoadParams["geoCircle"]
): Promise<SimpleParking[]> {
  const query = `
    DECLARE lat FLOAT64 DEFAULT @lat;
    DECLARE lng FLOAT64 DEFAULT @lng;
    DECLARE radiusKm FLOAT64 DEFAULT @radiusKm;
    DECLARE includeNonReferral BOOL DEFAULT @includeNonReferral;
    SELECT id, name, address, can_sublease, space_updated_at
    FROM \`${env.BIGQUERY_PROJECT}.parking.nearest_parkings\`(lat, lng, radiusKm, includeNonReferral) LIMIT 100;
  `;
  const [rows] = await bigquery.query({
    query,
    parameterMode: "NAMED",
    params: {
      lat: geoCircle.lat,
      lng: geoCircle.lng,
      radiusKm: geoCircle.radiusKm,
      includeNonReferral: false,
    },
    jobCreationMode: "JOB_CREATION_OPTIONAL",
    useLegacySql: false,
  });

  return rows.map((row) => keysToCamel(row)) as SimpleParking[];
}

export async function parkingSearchLoad(
  params: LoadParams,
  context: Context
): Promise<{ dataSetId: string; parkings: SimpleParking[] }> {
  const dataSetId = createDataSetId(params);
  // 取得: 自動解凍付きの getSessionCache（内部で ensure される）
  const parkings: SimpleParking[] =
    getSessionCache<SimpleParking[]>(context, "parkings", dataSetId) ||
    (await findParkingsByGeoCircle(params.geoCircle));
  // 保存: 圧縮 + TTL（10分）でキャッシュ（内部で ensure される）
  setSessionCache(context, "parkings", dataSetId, parkings, {
    compress: true,
    ttlMs: 3 * 60_000,
  });

  return {
    dataSetId,
    parkings,
  };
}
