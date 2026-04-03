process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import zlib from "zlib";

const GEOJSON_URL = "https://regieessencequebec.ca/data/stations.geojson.gz";
const OUTPUT_PATH = path.join("data", "latest.geojson");

async function run() {
  try {
    console.log("Fetching stations.geojson.gz…");

    const res = await fetch(GEOJSON_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://regieessencequebec.ca/",
        "Accept-Encoding": "gzip"
      }
    });

    if (!res.ok) {
      console.error("❌ Failed to fetch GeoJSON:", res.status, res.statusText);
      process.exit(1);
    }

    const compressed = Buffer.from(await res.arrayBuffer());
    const decompressed = zlib.gunzipSync(compressed);

    fs.writeFileSync(OUTPUT_PATH, decompressed);

    console.log("✅ Saved GeoJSON to", OUTPUT_PATH);

  } catch (err) {
    console.error("❌ Script error:", err);
    process.exit(1);
  }
}

run();
