process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const PAGE_URL = "https://regieessencequebec.ca/";

const OUTPUT_PATH = path.join("data", "latest.xlsx");

async function run() {
  try {
    console.log("Fetching new Régie page…");
    const pageRes = await fetch(PAGE_URL);
    const html = await pageRes.text();

    // Find stations-XXXXXXXXXXXXXX.xlsx
    const match = html.match(/stations-[0-9]+\.xlsx/);

    if (!match) {
      console.error("❌ Could not find XLSX link on the new page.");
      process.exit(1);
    }

    const xlsxUrl = new URL(`/data/${match[0]}`, PAGE_URL).href;
    console.log("Found XLSX:", xlsxUrl);

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
