process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const JSON_URL = "https://regieessencequebec.ca/data/stations.json";
const OUTPUT_PATH = path.join("data", "latest.xlsx");

async function run() {
  try {
    console.log("Fetching stations.json…");
    const jsonRes = await fetch(JSON_URL);

    if (!jsonRes.ok) {
      console.error("❌ Failed to fetch stations.json:", jsonRes.status, jsonRes.statusText);
      process.exit(1);
    }

    const data = await jsonRes.json();

    if (!data.last_update) {
      console.error("❌ stations.json does not contain last_update field.");
      process.exit(1);
    }

    const timestamp = data.last_update;
    const xlsxUrl = `https://regieessencequebec.ca/data/stations-${timestamp}.xlsx`;

    console.log("Latest XLSX URL:", xlsxUrl);

    console.log("Downloading XLSX…");
    const fileRes = await fetch(xlsxUrl);

    if (!fileRes.ok) {
      console.error("❌ Failed to download XLSX:", fileRes.status, fileRes.statusText);
      process.exit(1);
    }

    const buffer = Buffer.from(await fileRes.arrayBuffer());
    fs.writeFileSync(OUTPUT_PATH, buffer);

    console.log("✅ Saved XLSX to", OUTPUT_PATH);

  } catch (err) {
    console.error("❌ Script error:", err);
    process.exit(1);
  }
}

run();
