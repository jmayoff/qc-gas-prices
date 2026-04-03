process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const HOME_URL = "https://regieessencequebec.ca/";
const OUTPUT_PATH = path.join("data", "latest.xlsx");

async function run() {
  try {
    console.log("Fetching homepage…");
    const homeRes = await fetch(HOME_URL);
    const homeHtml = await homeRes.text();

    // Extract JS bundle URL
    const jsMatch = homeHtml.match(/src="(\/assets\/js\/index-[^"]+\.js)"/);
    if (!jsMatch) {
      console.error("❌ Could not find JS bundle URL.");
      process.exit(1);
    }

    const jsUrl = new URL(jsMatch[1], HOME_URL).href;
    console.log("JS bundle:", jsUrl);

    console.log("Fetching JS bundle…");
    const jsRes = await fetch(jsUrl);
    const jsText = await jsRes.text();

    // Extract XLSX filename
    const xlsxMatch = jsText.match(/stations-[0-9]+\.xlsx/);
    if (!xlsxMatch) {
      console.error("❌ Could not find XLSX filename in JS bundle.");
      process.exit(1);
    }

    const xlsxFilename = xlsxMatch[0];
    const xlsxUrl = `https://regieessencequebec.ca/data/${xlsxFilename}`;

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
