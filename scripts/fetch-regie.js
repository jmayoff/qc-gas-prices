import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const PAGE_URL = "https://www.regie-energie.qc.ca/energie/essence/index.html";
const OUTPUT_PATH = path.join("data", "latest.xlsx");

async function run() {
  try {
    console.log("Fetching Régie page…");
    const pageRes = await fetch(PAGE_URL);
    const html = await pageRes.text();

    // Find the XLSX link: stations-XXXXXXXXXXXXXX.xlsx
    const match = html.match(/href="([^"]*stations-[0-9]+\.xlsx)"/i);

    if (!match) {
      console.error("❌ Could not find XLSX link on the page.");
      process.exit(1);
    }

    const xlsxUrl = new URL(match[1], PAGE_URL).href;
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

