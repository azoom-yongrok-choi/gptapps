import type { Context, LoadParams, LoadResult, Parking } from "./type.js";
import { env } from "node:process";
import { BigQuery } from "@google-cloud/bigquery";
import { enrichParkings } from "./enrichment.js";
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
): Promise<Parking[]> {
  const query = `
    DECLARE lat FLOAT64 DEFAULT @lat;
    DECLARE lng FLOAT64 DEFAULT @lng;
    DECLARE radiusKm FLOAT64 DEFAULT @radiusKm;
    DECLARE includeNonReferral BOOL DEFAULT @includeNonReferral;
    SELECT * FROM \`${env.BIGQUERY_PROJECT}.parking.nearest_parkings\`(lat, lng, radiusKm, includeNonReferral) LIMIT 100;
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

  return rows.map((row) => keysToCamel(row)) as Parking[];
}

export async function parkingSearchLoad(
  params: LoadParams,
  context: Context
): Promise<LoadResult> {
  const dataSetId = createDataSetId(params);
  // 取得: 自動解凍付きの getSessionCache（内部で ensure される）
  const parkings: Parking[] =
    getSessionCache<Parking[]>(context, "parkings", dataSetId) ||
    (await findParkingsByGeoCircle(params.geoCircle));
  const enrichedParkings = enrichParkings(params.vehicleDimensions)(parkings);
  // 保存: 圧縮 + TTL（10分）でキャッシュ（内部で ensure される）
  setSessionCache(context, "parkings", dataSetId, enrichedParkings, {
    compress: true,
    ttlMs: 3 * 60_000,
  });

  const totalCount = enrichedParkings.length;
  const subleaseCount = enrichedParkings.filter((p) => p.canSublease).length;
  const brokerageCount = totalCount - subleaseCount;

  return {
    dataSetId,
    totalCount,
    subleaseCount,
    brokerageCount,
    parkings: enrichedParkings,
  };
}
