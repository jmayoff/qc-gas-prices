process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const LATEST_URL = "https://regieessencequebec.ca/data/latest";
const OUTPUT_PATH = path.join("data", "latest.xlsx");

async function run() {
  try {
    console.log("Fetching latest XLSX…");

    const res = await fetch(LATEST_URL, { redirect: "follow" });

    if (!res.ok) {
      console.error("❌ Failed to fetch XLSX:", res.status, res.statusText);
      process.exit(1);
    }

    const finalUrl = res.url;
    console.log("Resolved XLSX URL:", finalUrl);

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(OUTPUT_PATH, buffer);

    console.log("✅ Saved XLSX to", OUTPUT_PATH);

  } catch (err) {
    console.error("❌ Script error:", err);
    process.exit(1);
  }
}

run();
