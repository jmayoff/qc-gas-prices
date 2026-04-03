process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import zlib from "zlib";

const GEOJSON_URL = "https://regieessencequebec.ca/data/stations.geojson.gz";
// CHANGED: Removed the 'data' folder path to save directly to the root
const OUTPUT_PATH = "gas-prices.xlsx"; 

async function run() {
  try {
    console.log("Fetching latest data from Régie...");

    const res = await fetch(GEOJSON_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://regieessencequebec.ca/",
        "Accept-Encoding": "gzip"
      }
    });

    if (!res.ok) {
      console.error("Failed to fetch:", res.status);
      process.exit(1);
    }

    const compressed = Buffer.from(await res.arrayBuffer());
    const decompressed = zlib.gunzipSync(compressed);

    // Note: If you are saving as .xlsx, the source data must actually be Excel format.
    // If the source is GeoJSON, name this 'gas-prices.json' and update app.js accordingly.
    fs.writeFileSync(OUTPUT_PATH, decompressed);

    console.log("✅ Saved data to", OUTPUT_PATH);

  } catch (err) {
    console.error("Script error:", err);
    process.exit(1);
  }
}

run();
